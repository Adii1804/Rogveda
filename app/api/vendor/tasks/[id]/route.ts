import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err } from '@/lib/api'
import { sendVisaLetterNotification } from '@/lib/emails'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('x-vendor-auth')
  if (auth !== 'apollo:apollo123') return err('Unauthorized', 401)

  const { id } = await params
  if (!id) return err('Task ID is required')

  // Fetch task first to make sure it exists
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('vendor_tasks')
    .select('id, completed, booking_id')
    .eq('id', id)
    .single()

  if (fetchErr || !existing) return err('Task not found', 404)
  if (existing.completed) return err('Task already completed', 409)

  // Mark task complete
  const { data: task, error: taskErr } = await supabaseAdmin
    .from('vendor_tasks')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (taskErr) return err(taskErr.message, 500)

  // Update booking status to In Progress
  const { error: bookingErr } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'In Progress' })
    .eq('id', task.booking_id)

  if (bookingErr) return err(bookingErr.message, 500)

  // Fetch patient + booking details for the email
  const { data: fullBooking } = await supabaseAdmin
    .from('bookings')
    .select(`
      id,
      patients  (name, email),
      hospitals (name),
      doctors   (name)
    `)
    .eq('id', task.booking_id)
    .single()

  // Send visa letter notification email (non-blocking)
  const patient  = (fullBooking?.patients  as unknown) as { name: string; email: string } | null
  const hospital = (fullBooking?.hospitals as unknown) as { name: string } | null
  const doctor   = (fullBooking?.doctors   as unknown) as { name: string } | null

  if (patient?.email) {
    sendVisaLetterNotification({
      to:           patient.email,
      patientName:  patient.name,
      bookingRef:   task.booking_id.slice(0, 8).toUpperCase(),
      hospitalName: hospital?.name ?? '',
      doctorName:   doctor?.name  ?? '',
    }).catch((e) => console.error('Visa email failed:', e))
  }

  return ok({ success: true, task })
}
