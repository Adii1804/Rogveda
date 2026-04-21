import nodemailer from 'nodemailer'

// Explicit Gmail SMTP — more reliable than service:'gmail' on serverless
function getTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })
}

const FROM = `"Rogveda Medical Travel" <${process.env.GMAIL_USER}>`

/* ─────────────────────────────────────────────
   Email 1: Booking Confirmation (sent to patient)
───────────────────────────────────────────── */
export async function sendBookingConfirmation(opts: {
  to: string
  patientName: string
  bookingRef: string
  hospitalName: string
  hospitalCity: string
  doctorName: string
  roomType: string
  priceUsd: number
  currency: string
}) {
  const { to, patientName, bookingRef, hospitalName, hospitalCity, doctorName, roomType, priceUsd } = opts

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#F4F6FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6FB;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#1d4ed8,#0284c7);padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:8px 16px;">
                    <span style="color:#fff;font-size:22px;font-weight:900;">Rogveda</span>
                  </div>
                  <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:8px 0 0;">Medical Travel Booking</p>
                </td>
                <td align="right">
                  <div style="background:rgba(255,255,255,0.2);border-radius:50px;padding:8px 16px;">
                    <span style="color:#fff;font-size:13px;font-weight:700;">&#10003; CONFIRMED</span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#111827;">Booking Confirmed, ${patientName}!</h1>
          <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.7;">
            Your Total Knee Replacement has been booked. Our coordinator will contact you within <strong>24 hours</strong>.
          </p>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:16px;padding:18px;text-align:center;margin-bottom:24px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:1px;">Booking Reference</p>
            <p style="margin:0;font-size:28px;font-weight:900;color:#1d4ed8;font-family:monospace;letter-spacing:3px;">${bookingRef}</p>
            <p style="margin:6px 0 0;font-size:11px;color:#93c5fd;">Save this for your records</p>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:16px;overflow:hidden;margin-bottom:24px;">
            <tr><td style="padding:14px 20px;border-bottom:1px solid #f3f4f6;">
              <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;">Booking Details</p>
            </td></tr>
            ${[
              ['Hospital',  `${hospitalName}, ${hospitalCity}`],
              ['Procedure', 'Total Knee Replacement'],
              ['Doctor',    doctorName],
              ['Room',      roomType],
              ['Amount',    `$${priceUsd.toLocaleString()} USD`],
            ].map(([label, value]) => `
            <tr><td style="padding:11px 20px;border-bottom:1px solid #f3f4f6;">
              <table width="100%"><tr>
                <td style="font-size:13px;color:#6b7280;">${label}</td>
                <td align="right" style="font-size:13px;font-weight:700;color:#111827;">${value}</td>
              </tr></table>
            </td></tr>`).join('')}
          </table>
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:16px;padding:16px;margin-bottom:24px;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#92400e;">Book Now, Pay Later</p>
            <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6;">No payment is due now. Our finance team will reach out to arrange a flexible payment plan.</p>
          </div>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;padding:20px;margin-bottom:28px;">
            <p style="margin:0 0 14px;font-size:14px;font-weight:800;color:#14532d;">What happens next?</p>
            ${[
              ['1', 'Coordinator calls you within 24 hours'],
              ['2', 'Visa invitation letter sent within 48 hours'],
              ['3', 'Airport pickup arranged on your travel date'],
              ['4', 'Free post-op teleconsultation included'],
            ].map(([step, text]) => `
            <table cellpadding="0" cellspacing="0" style="margin-bottom:10px;width:100%;">
              <tr>
                <td style="width:26px;vertical-align:top;">
                  <div style="width:22px;height:22px;background:#22c55e;border-radius:50%;text-align:center;line-height:22px;">
                    <span style="color:#fff;font-size:11px;font-weight:800;">${step}</span>
                  </div>
                </td>
                <td style="font-size:13px;color:#166534;padding-left:10px;line-height:1.6;">${text}</td>
              </tr>
            </table>`).join('')}
          </div>
          <div style="text-align:center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://rogveda-xi.vercel.app'}/my-bookings"
               style="display:inline-block;background:#1d4ed8;color:#fff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:14px;text-decoration:none;">
              Track Your Booking
            </a>
          </div>
        </td></tr>
        <tr><td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            &copy; 2025 Rogveda &middot; Medical Travel Booking<br/>
            Trusted by patients from 40+ countries worldwide
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const transporter = getTransporter()
  return transporter.sendMail({
    from: FROM,
    to,
    subject: `Booking Confirmed - ${hospitalName} | Ref: ${bookingRef}`,
    html,
  })
}

/* ─────────────────────────────────────────────
   Email 2: Visa Letter Sent Notification
───────────────────────────────────────────── */
export async function sendVisaLetterNotification(opts: {
  to: string
  patientName: string
  bookingRef: string
  hospitalName: string
  doctorName: string
}) {
  const { to, patientName, bookingRef, hospitalName, doctorName } = opts

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#F4F6FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6FB;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#059669,#0d9488);padding:32px;">
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:8px 16px;margin-bottom:16px;">
              <span style="color:#fff;font-size:22px;font-weight:900;">Rogveda</span>
            </div>
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:900;">Your Visa Letter is Ready!</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Your journey to India just got one step closer</p>
          </td>
        </tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.7;">
            Hi <strong>${patientName}</strong>,<br/><br/>
            Your <strong>Visa Invitation Letter</strong> for your procedure at <strong>${hospitalName}</strong> with <strong>${doctorName}</strong> has been dispatched to this email.
          </p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;padding:20px;margin-bottom:24px;">
            <table cellpadding="0" cellspacing="0" width="100%"><tr>
              <td style="width:48px;">
                <div style="width:44px;height:44px;background:#22c55e;border-radius:12px;text-align:center;line-height:44px;font-size:22px;">&#10003;</div>
              </td>
              <td style="padding-left:14px;">
                <p style="margin:0;font-size:15px;font-weight:800;color:#14532d;">Visa Invitation Letter Sent</p>
                <p style="margin:4px 0 0;font-size:13px;color:#16a34a;">Your booking status is now: In Progress</p>
              </td>
            </tr></table>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:16px;overflow:hidden;margin-bottom:24px;">
            ${[
              ['Booking Ref', bookingRef],
              ['Hospital',   hospitalName],
              ['Doctor',     doctorName],
              ['Status',     'In Progress'],
            ].map(([label, value]) => `
            <tr><td style="padding:11px 20px;border-bottom:1px solid #f3f4f6;">
              <table width="100%"><tr>
                <td style="font-size:13px;color:#6b7280;">${label}</td>
                <td align="right" style="font-size:13px;font-weight:700;color:#111827;">${value}</td>
              </tr></table>
            </td></tr>`).join('')}
          </table>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:16px;padding:20px;margin-bottom:28px;">
            <p style="margin:0 0 12px;font-size:14px;font-weight:800;color:#1e3a8a;">Your next steps</p>
            <ul style="margin:0;padding-left:20px;color:#1d4ed8;font-size:13px;line-height:2.2;">
              <li>Use the letter to apply for an <strong>Indian Medical Visa</strong> at your nearest Indian embassy</li>
              <li>Our coordinator will call to confirm your travel date</li>
              <li>Airport pickup arranged once travel date is confirmed</li>
            </ul>
          </div>
          <div style="text-align:center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://rogveda-xi.vercel.app'}/my-bookings"
               style="display:inline-block;background:#1d4ed8;color:#fff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:14px;text-decoration:none;">
              View Booking Status
            </a>
          </div>
        </td></tr>
        <tr><td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            &copy; 2025 Rogveda &middot; Medical Travel Booking
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const transporter = getTransporter()
  return transporter.sendMail({
    from: FROM,
    to,
    subject: `Your Visa Invitation Letter is Ready - Rogveda | Ref: ${bookingRef}`,
    html,
  })
}
