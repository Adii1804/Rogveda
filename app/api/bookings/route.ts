import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, validateFields } from '@/lib/api'
import { sendBookingConfirmation } from '@/lib/emails'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return err('Invalid JSON body') }

  const invalid = validateFields(body, ['patient_id', 'hospital_id', 'doctor_id', 'room_type', 'price_usd'])
  if (invalid) return err(invalid)

  const price = Number(body.price_usd)
  if (isNaN(price) || price <= 0) return err('price_usd must be a positive number')

  // Verify hospital + doctor exist and match
  const { data: doctor, error: docErr } = await supabaseAdmin
    .from('doctors')
    .select('id, hospital_id')
    .eq('id', body.doctor_id)
    .eq('hospital_id', body.hospital_id)
    .single()

  if (docErr || !doctor) return err('Doctor does not belong to the specified hospital', 422)

  // Verify pricing row exists
  const { data: pricing, error: priceErr } = await supabaseAdmin
    .from('pricing')
    .select('price_usd')
    .eq('doctor_id', body.doctor_id)
    .eq('hospital_id', body.hospital_id)
    .eq('room_type', body.room_type)
    .single()

  if (priceErr || !pricing) return err('Invalid room type for this doctor', 422)

  // Create booking record
  const { data: booking, error: bookingErr } = await supabaseAdmin
    .from('bookings')
    .insert({
      patient_id:  body.patient_id,
      hospital_id: body.hospital_id,
      doctor_id:   body.doctor_id,
      room_type:   body.room_type,
      price_usd:   pricing.price_usd, // always use DB price, never trust client
      currency:    body.currency || 'USD',
      status:      'Confirmed',
    })
    .select()
    .single()

  if (bookingErr) return err(bookingErr.message, 500)

  // Fetch current wallet balance
  const { data: patient, error: patErr } = await supabaseAdmin
    .from('patients')
    .select('wallet_balance')
    .eq('id', body.patient_id)
    .single()

  if (patErr) return err(patErr.message, 500)

  const newBalance = Number(patient.wallet_balance) - Number(pricing.price_usd)

  // Update wallet balance (BNPL — allow negative)
  await supabaseAdmin
    .from('patients')
    .update({ wallet_balance: newBalance })
    .eq('id', body.patient_id)

  // Record wallet transaction
  await supabaseAdmin.from('wallet_transactions').insert({
    patient_id: body.patient_id,
    booking_id: booking.id,
    amount:     -Number(pricing.price_usd),
    type:       'debit',
  })

  // Create vendor task for this booking
  await supabaseAdmin.from('vendor_tasks').insert({
    booking_id: booking.id,
    task_name:  'Visa Invite Letter Sent',
    completed:  false,
  })

  // Fetch full details for the confirmation email
  const [{ data: emailPatient }, { data: emailHospital }, { data: emailDoctor }] = await Promise.all([
    supabaseAdmin.from('patients').select('name, email').eq('id', body.patient_id).single(),
    supabaseAdmin.from('hospitals').select('name, city').eq('id', body.hospital_id).single(),
    supabaseAdmin.from('doctors').select('name').eq('id', body.doctor_id).single(),
  ])

  // Send booking confirmation email (non-blocking — don't fail booking if email fails)
  if (emailPatient?.email) {
    sendBookingConfirmation({
      to:           emailPatient.email,
      patientName:  emailPatient.name,
      bookingRef:   booking.id.slice(0, 8).toUpperCase(),
      hospitalName: emailHospital?.name ?? '',
      hospitalCity: emailHospital?.city ?? '',
      doctorName:   emailDoctor?.name ?? '',
      roomType:     String(body.room_type),
      priceUsd:     Number(pricing.price_usd),
      currency:     String(body.currency || 'USD'),
    }).catch((e) => console.error('Email send failed:', e))
  }

  return ok({ booking, new_wallet_balance: newBalance }, 201)
}

// Fetch bookings by patient email (for booking status page)
export async function GET(req: NextRequest) {
  const patientId = req.nextUrl.searchParams.get('patient_id')
  if (!patientId) return err('patient_id is required')

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      hospitals (name, city, image_url),
      doctors   (name, experience_years),
      vendor_tasks (id, task_name, completed, completed_at)
    `)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error) return err(error.message, 500)
  return ok(data)
}
