import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ok, err, validateFields } from '@/lib/api'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return err('Invalid JSON body') }

  const invalid = validateFields(body, ['name', 'email'])
  if (invalid) return err(invalid)

  const name    = String(body.name).trim()
  const email   = String(body.email).trim().toLowerCase()
  const country = body.country ? String(body.country).trim() : null
  const phone   = body.phone   ? String(body.phone).trim()   : null

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('Invalid email address')
  if (name.length < 2) return err('Name must be at least 2 characters')

  // Upsert: find existing patient or create new
  const { data: existing } = await supabaseAdmin
    .from('patients')
    .select('*')
    .eq('email', email)
    .single()

  if (existing) {
    // Update country/phone if provided
    if (country || phone) {
      await supabaseAdmin.from('patients').update({ country, phone }).eq('id', existing.id)
    }
    return ok(existing)
  }

  const { data, error } = await supabaseAdmin
    .from('patients')
    .insert({ name, email, country, phone, wallet_balance: 0 })
    .select()
    .single()

  if (error) return err(error.message, 500)
  return ok(data, 201)
}

// Look up patient by email (for booking status page)
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.toLowerCase()
  if (!email) return err('Email is required')

  const { data, error } = await supabaseAdmin
    .from('patients')
    .select('id, name, email, wallet_balance')
    .eq('email', email)
    .single()

  if (error || !data) return err('No patient found with that email', 404)
  return ok(data)
}
