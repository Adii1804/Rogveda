'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Currency, CONVERSION, CURRENCY_SYMBOL } from '@/lib/types'

const COUNTRIES = [
  { name: 'Nigeria',        code: 'NG', dial: '+234' },
  { name: 'United Kingdom', code: 'GB', dial: '+44'  },
  { name: 'United States',  code: 'US', dial: '+1'   },
  { name: 'Kenya',          code: 'KE', dial: '+254' },
  { name: 'Canada',         code: 'CA', dial: '+1'   },
  { name: 'Australia',      code: 'AU', dial: '+61'  },
  { name: 'South Africa',   code: 'ZA', dial: '+27'  },
  { name: 'Ghana',          code: 'GH', dial: '+233' },
  { name: 'Uganda',         code: 'UG', dial: '+256' },
  { name: 'Tanzania',       code: 'TZ', dial: '+255' },
  { name: 'Ethiopia',       code: 'ET', dial: '+251' },
  { name: 'Zimbabwe',       code: 'ZW', dial: '+263' },
  { name: 'Zambia',         code: 'ZM', dial: '+260' },
  { name: 'UAE',            code: 'AE', dial: '+971' },
  { name: 'Saudi Arabia',   code: 'SA', dial: '+966' },
  { name: 'Bangladesh',     code: 'BD', dial: '+880' },
  { name: 'Pakistan',       code: 'PK', dial: '+92'  },
  { name: 'Sri Lanka',      code: 'LK', dial: '+94'  },
  { name: 'Nepal',          code: 'NP', dial: '+977' },
  { name: 'Afghanistan',    code: 'AF', dial: '+93'  },
  { name: 'Germany',        code: 'DE', dial: '+49'  },
  { name: 'France',         code: 'FR', dial: '+33'  },
  { name: 'Ireland',        code: 'IE', dial: '+353' },
  { name: 'New Zealand',    code: 'NZ', dial: '+64'  },
  { name: 'Other',          code: '',   dial: '+'    },
]

function formatPrice(usd: number, currency: Currency) {
  const amount = Math.round(usd * CONVERSION[currency])
  return `${CURRENCY_SYMBOL[currency]}${amount.toLocaleString()}`
}

function BookingForm() {
  const router = useRouter()
  const params = useSearchParams()

  const hospitalId   = params.get('hospital_id') || ''
  const hospitalName = params.get('hospital_name') || ''
  const hospitalCity = params.get('hospital_city') || ''
  const imgSrc       = params.get('hospital_img') || '/apollo.jpg'
  const doctorId     = params.get('doctor_id') || ''
  const doctorName   = params.get('doctor_name') || ''
  const doctorExp    = params.get('doctor_exp') || ''
  const roomType     = params.get('room_type') || ''
  const priceUsd     = Number(params.get('price_usd') || 0)
  const currency     = (params.get('currency') || 'USD') as Currency

  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState<{ bookingId: string; newBalance: number } | null>(null)
  const [error, setError] = useState('')

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { setError('Full name and email are required.'); return }
    setLoading(true); setError('')
    try {
      const fullPhone = phoneNumber ? `${selectedCountry.dial}${phoneNumber}` : ''
      const patientRes = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    name.trim(),
          email:   email.trim(),
          country: selectedCountry.name,
          phone:   fullPhone,
        }),
      })
      const patientData = await patientRes.json()
      if (!patientRes.ok) throw new Error(patientData.error || 'Failed to save patient')

      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientData.id, hospital_id: hospitalId, doctor_id: doctorId, room_type: roomType, price_usd: priceUsd, currency }),
      })
      const bookingData = await bookingRes.json()
      if (!bookingRes.ok) throw new Error(bookingData.error || 'Booking failed')

      setConfirmed({ bookingId: bookingData.booking.id, newBalance: bookingData.new_wallet_balance })
      toast.success('Booking confirmed! Our team will contact you shortly.')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  /* ── Confirmation screen ── */
  if (confirmed) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Success card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Green top bar */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-white">Booking Confirmed!</h2>
              <p className="text-white/80 text-sm mt-1">Your journey to better health begins now</p>
            </div>

            <div className="p-6">
              {/* Ref ID */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center mb-5">
                <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Booking Reference</p>
                <p className="text-2xl font-black font-mono text-blue-700 tracking-wider">{confirmed.bookingId.slice(0, 8).toUpperCase()}</p>
                <p className="text-xs text-blue-400 mt-1">Save this for your records</p>
              </div>

              {/* Summary */}
              <div className="space-y-2.5 mb-5">
                {[
                  { label: 'Patient',   value: name },
                  { label: 'Hospital',  value: hospitalName },
                  { label: 'Location',  value: `${hospitalCity}, India` },
                  { label: 'Doctor',    value: `${doctorName} (${doctorExp} yrs)` },
                  { label: 'Room',      value: roomType },
                  { label: 'Procedure', value: 'Total Knee Replacement' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-semibold text-gray-800 text-right max-w-[55%]">{value}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-2.5 flex justify-between">
                  <span className="font-bold text-gray-900">Total Billed</span>
                  <span className="font-black text-blue-600 text-lg">{formatPrice(priceUsd, currency)}</span>
                </div>
              </div>

              {/* Wallet */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">Wallet Balance (BNPL)</p>
                    <p className="text-xs text-amber-500 mt-0.5">Pay later — team will contact you</p>
                  </div>
                  <p className="text-xl font-black text-amber-700">{formatPrice(confirmed.newBalance, currency)}</p>
                </div>
              </div>

              {/* Next steps */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-5">
                <p className="text-sm font-bold text-gray-800 mb-3">What happens next?</p>
                <div className="space-y-2.5">
                  {[
                    { step: '1', text: 'Coordinator contacts you within 24 hours' },
                    { step: '2', text: 'Visa invitation letter sent in 48 hours' },
                    { step: '3', text: 'Airport pickup arranged for travel date' },
                    { step: '4', text: 'Free post-op teleconsultation included' },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">{step}</div>
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => router.push('/')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Search
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Booking form ── */
  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs">R</div>
            <span className="font-black text-gray-900">Rogveda</span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-10">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-[10px]">✓</span>
            <span className="text-gray-400">Choose</span>
          </div>
          <div className="flex-1 h-px bg-blue-200" />
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-[10px]">2</span>
            <span className="font-semibold text-blue-600">Confirm</span>
          </div>
          <div className="flex-1 h-px bg-gray-200" />
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-5 h-5 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center font-bold text-[10px]">3</span>
            <span>Done</span>
          </div>
        </div>

        {/* Hospital summary card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="relative h-36">
            <Image src={imgSrc} alt={hospitalName} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 p-4">
              <p className="text-white font-black text-lg leading-tight">{hospitalName}</p>
              <p className="text-white/70 text-sm">{hospitalCity}, India</p>
            </div>
          </div>
          <div className="p-4 space-y-2.5">
            {[
              { label: 'Procedure',  val: 'Total Knee Replacement' },
              { label: 'Doctor',     val: `${doctorName} (${doctorExp} yrs exp)` },
              { label: 'Room',       val: roomType },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="font-semibold text-gray-800">{val}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2.5 flex justify-between items-center">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-2xl font-black text-blue-600">{formatPrice(priceUsd, currency)}</span>
            </div>
          </div>
        </div>

        {/* BNPL banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">💳</div>
          <div>
            <p className="text-white font-bold text-sm">Book Now — Pay Later</p>
            <p className="text-white/70 text-xs mt-0.5">
              No payment needed today. Your wallet will show{' '}
              <span className="font-bold text-white">{formatPrice(-priceUsd, currency)}</span> and our team arranges a plan.
            </p>
          </div>
        </div>

        {/* Patient form */}
        <form onSubmit={handleConfirm} noValidate>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-5">
            <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-black">✎</span>
              Your Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Mensah"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder-gray-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder-gray-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Country</label>
                <select
                  value={selectedCountry.code || selectedCountry.name}
                  onChange={(e) => {
                    const found = COUNTRIES.find((c) => (c.code || c.name) === e.target.value)
                    if (found) setSelectedCountry(found)
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code || c.name} value={c.code || c.name}>
                      {c.name} ({c.dial})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                <div className="flex gap-2">
                  {/* Dial code prefix */}
                  <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-xl px-3 py-3 text-sm font-bold text-gray-700 whitespace-nowrap flex-shrink-0">
                    <span className="text-base leading-none">
                      {selectedCountry.code
                        ? String.fromCodePoint(...[...selectedCountry.code].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)))
                        : '🌍'}
                    </span>
                    <span>{selectedCountry.dial}</span>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="8001234567"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder-gray-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Inclusions */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-5">
            <h3 className="font-black text-gray-900 mb-3 text-sm">Everything that&apos;s included</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { icon: '📄', text: 'Visa invitation letter within 48 hours' },
                { icon: '👨‍⚕️', text: 'Dedicated coordinator assigned to you 24/7' },
                { icon: '🚗', text: 'Airport pickup & all hospital transfers' },
                { icon: '💬', text: 'Free post-op teleconsultation' },
                { icon: '🌐', text: 'Medical records translation assistance' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 py-1.5">
                  <span className="text-base flex-shrink-0">{icon}</span>
                  <span className="text-sm text-gray-600">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-4 text-sm flex items-start gap-2">
              <span className="text-base flex-shrink-0">⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black py-4 rounded-2xl transition-all text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Confirming your booking…
              </>
            ) : (
              <>Confirm Booking — Pay Later</>
            )}
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">🔒 Secure booking · No payment required today</p>
        </form>
      </main>
    </div>
  )
}

export default function BookPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FB]">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BookingForm />
    </Suspense>
  )
}
