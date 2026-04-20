import { supabaseAdmin } from '@/lib/supabase'
import { ok, err } from '@/lib/api'

export async function GET() {
  const [
    { data: hospitals, error: hErr },
    { data: doctors,   error: dErr },
    { data: pricing,   error: pErr },
  ] = await Promise.all([
    supabaseAdmin.from('hospitals').select('*').order('name'),
    supabaseAdmin.from('doctors').select('*').order('name'),
    supabaseAdmin.from('pricing').select('*'),
  ])

  if (hErr) return err(hErr.message, 500)
  if (dErr) return err(dErr.message, 500)
  if (pErr) return err(pErr.message, 500)

  const result = hospitals!.map((h) => ({
    ...h,
    doctors: doctors!
      .filter((d) => d.hospital_id === h.id)
      .map((d) => ({
        ...d,
        pricing: pricing!.filter((p) => p.doctor_id === d.id),
      })),
  }))

  return ok(result)
}
