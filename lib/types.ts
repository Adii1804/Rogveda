export type Currency = 'USD' | 'INR' | 'NGN'

export const CONVERSION = { USD: 1, INR: 83, NGN: 1550 }
export const CURRENCY_SYMBOL = { USD: '$', INR: '₹', NGN: '₦' }

export interface PricingRow {
  id: string
  doctor_id: string
  hospital_id: string
  room_type: string
  price_usd: number
}

export interface Doctor {
  id: string
  hospital_id: string
  name: string
  experience_years: number
  specialty: string
  pricing: PricingRow[]
}

export interface Hospital {
  id: string
  name: string
  city: string
  accreditation: string
  image_url: string | null
  doctors: Doctor[]
}

export interface Booking {
  id: string
  patient_id: string
  hospital_id: string
  doctor_id: string
  room_type: string
  price_usd: number
  currency: string
  status: string
  created_at: string
  hospitals: { name: string; city: string }
  doctors: { name: string; experience_years: number }
  patients: { name: string; email: string }
  vendor_tasks: { id: string; task_name: string; completed: boolean; completed_at: string | null }[]
}
