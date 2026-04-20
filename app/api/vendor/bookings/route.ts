import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err } from '@/lib/api'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-vendor-auth')
  if (auth !== 'apollo:apollo123') return err('Unauthorized', 401)

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      hospitals   (name, city),
      doctors     (name, experience_years),
      patients    (name, email, country, phone),
      vendor_tasks (id, task_name, completed, completed_at)
    `)
    .order('created_at', { ascending: false })

  if (error) return err(error.message, 500)
  return ok(data)
}
