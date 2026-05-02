export type Currency = 'USD' | 'INR' | 'NGN' | 'GBP' | 'CAD' | 'AUD' | 'AED' | 'SAR' | 'KES' | 'ZAR' | 'GHS' | 'PKR' | 'BDT'

export const CONVERSION: Record<Currency, number> = {
  USD: 1,
  INR: 83,
  NGN: 1550,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.53,
  AED: 3.67,
  SAR: 3.75,
  KES: 130,
  ZAR: 18.5,
  GHS: 15,
  PKR: 278,
  BDT: 110,
}

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  USD: '$',
  INR: '₹',
  NGN: '₦',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  AED: 'AED ',
  SAR: 'SAR ',
  KES: 'KSh ',
  ZAR: 'R',
  GHS: '₵',
  PKR: '₨',
  BDT: '৳',
}

export const CURRENCIES: { code: Currency; label: string }[] = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'AED', label: 'AED — UAE Dirham' },
  { code: 'SAR', label: 'SAR — Saudi Riyal' },
  { code: 'INR', label: 'INR — Indian Rupee' },
  { code: 'NGN', label: 'NGN — Nigerian Naira' },
  { code: 'KES', label: 'KES — Kenyan Shilling' },
  { code: 'ZAR', label: 'ZAR — South African Rand' },
  { code: 'GHS', label: 'GHS — Ghanaian Cedi' },
  { code: 'PKR', label: 'PKR — Pakistani Rupee' },
  { code: 'BDT', label: 'BDT — Bangladeshi Taka' },
]

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
