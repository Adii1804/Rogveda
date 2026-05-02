'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Hospital, Currency, CONVERSION, CURRENCY_SYMBOL, CURRENCIES } from '@/lib/types'

function formatPrice(usd: number, currency: Currency) {
  const amount = Math.round(usd * CONVERSION[currency])
  return `${CURRENCY_SYMBOL[currency]}${amount.toLocaleString()}`
}

function getLowestPrice(hospital: Hospital): number {
  const prices = hospital.doctors.flatMap((d) => d.pricing.map((p) => p.price_usd))
  return prices.length ? Math.min(...prices) : 0
}

// Images are served from Supabase Storage (image_url on each hospital record)

function HospitalCard({ hospital, currency }: { hospital: Hospital; currency: Currency }) {
  const router = useRouter()
  const [selectedDoctor, setSelectedDoctor] = useState(hospital.doctors[0])
  const [selectedRoom, setSelectedRoom] = useState(hospital.doctors[0]?.pricing[0]?.room_type || '')

  const roomOptions = selectedDoctor?.pricing.map((p) => p.room_type) || []
  const currentPrice = selectedDoctor?.pricing.find((p) => p.room_type === selectedRoom)?.price_usd
  const lowestPrice = getLowestPrice(hospital)
  const imgSrc = hospital.image_url || '/apollo.jpg'

  function handleDoctorChange(doctorId: string) {
    const doc = hospital.doctors.find((d) => d.id === doctorId)!
    setSelectedDoctor(doc)
    setSelectedRoom(doc.pricing[0]?.room_type || '')
  }

  function handleBook() {
    const params = new URLSearchParams({
      hospital_id: hospital.id,
      hospital_name: hospital.name,
      hospital_city: hospital.city,
      hospital_img: imgSrc,
      doctor_id: selectedDoctor.id,
      doctor_name: selectedDoctor.name,
      doctor_exp: String(selectedDoctor.experience_years),
      room_type: selectedRoom,
      price_usd: String(currentPrice),
      currency,
    })
    router.push(`/book?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-3xl overflow-hidden flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
      {/* Hospital image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={imgSrc}
          alt={hospital.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        {/* Accreditation badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-white/95 backdrop-blur text-green-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
            {hospital.accreditation}
          </span>
        </div>
        {/* Hospital name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className="text-white font-bold text-xl leading-tight drop-shadow">{hospital.name}</h2>
          <p className="text-white/80 text-sm flex items-center gap-1 mt-0.5">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {hospital.city}, India
          </p>
        </div>
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1">
        {/* Procedure tag */}
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
            🦴 Total Knee Replacement
          </span>
        </div>

        {/* Trust micro-badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">✓ Free visa letter</span>
          <span className="text-xs bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-full font-medium">✓ Airport transfer</span>
          <span className="text-xs bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full font-medium">✓ 24/7 coordinator</span>
        </div>

        {/* Selectors */}
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Select Doctor</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 hover:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
              value={selectedDoctor?.id}
              onChange={(e) => handleDoctorChange(e.target.value)}
            >
              {hospital.doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {d.experience_years} yrs experience
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Room Type</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 hover:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
            >
              {roomOptions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Price + CTA */}
        <div className="mt-auto">
          <div className="flex items-end justify-between p-3 bg-gray-50 rounded-2xl">
            <div>
              <p className="text-[11px] text-gray-400 font-medium mb-0.5">Your price</p>
              <p className="text-2xl font-black text-gray-900 tracking-tight">
                {currentPrice ? formatPrice(currentPrice, currency) : '—'}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                From {formatPrice(lowestPrice, currency)} lowest
              </p>
            </div>
            <button
              onClick={handleBook}
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-5 py-3 rounded-xl text-sm transition-all shadow-md shadow-blue-200 flex items-center gap-1.5"
            >
              Book Now
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-3.5 bg-gray-100 rounded-full w-2/5" />
        <div className="h-3 bg-gray-100 rounded-full w-3/5" />
        <div className="h-10 bg-gray-100 rounded-xl" />
        <div className="h-10 bg-gray-100 rounded-xl" />
        <div className="h-14 bg-gray-100 rounded-2xl mt-4" />
      </div>
    </div>
  )
}

export default function SearchPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currency, setCurrency] = useState<Currency>('USD')

  useEffect(() => {
    fetch('/api/hospitals')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setHospitals(data)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      {/* Navbar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm shadow-blue-200">
              <span className="text-white font-black text-base">R</span>
            </div>
            <div>
              <span className="text-xl font-black text-gray-900 tracking-tight">Rogveda</span>
              <span className="hidden sm:inline text-xs text-gray-400 ml-2 font-medium">Medical Travel</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Currency selector */}
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="bg-gray-100 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 border-none outline-none cursor-pointer"
            >
              {CURRENCIES.map(({ code, label }) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
            <a
              href="/my-bookings"
              className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              My Bookings
            </a>
            <a
              href="/vendor"
              className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Vendor
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-300 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-3 py-1.5 mb-4">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-white/90 text-xs font-semibold">10,000+ patients from 40+ countries</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
              Total Knee Replacement<br className="hidden sm:block" />
              <span className="text-blue-200"> in Delhi, India</span>
            </h1>
            <p className="text-white/75 text-base sm:text-lg mb-6 leading-relaxed">
              World-class surgery at 70% less than US or UK costs. Compare top hospitals, choose your doctor, and we arrange everything — visa to recovery.
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {[
                { icon: '🛡️', text: 'NABH & JCI Accredited' },
                { icon: '💳', text: 'Book Now, Pay Later' },
                { icon: '✈️', text: 'Visa + Travel Arranged' },
                { icon: '📞', text: '24/7 Patient Support' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl px-3 py-2 text-sm text-white transition">
                  <span>{icon}</span>
                  <span className="font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
            {[
              { value: '70%', label: 'Cost savings vs US/UK' },
              { value: '48hr', label: 'Visa letter turnaround' },
              { value: '24/7', label: 'Patient coordinator' },
              { value: '4.9★', label: 'Average patient rating' },
            ].map(({ value, label }) => (
              <div key={label} className="py-4 px-4 sm:px-6 text-center">
                <p className="text-xl sm:text-2xl font-black text-blue-600">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              {loading ? 'Finding best hospitals…' : `${hospitals.length} Hospitals Available`}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Prices shown in {currency} · All-inclusive procedure cost</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center mb-6">
            <p className="font-bold mb-1">Unable to load hospitals</p>
            <p className="text-sm">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-3 text-sm underline">Try again</button>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? [1, 2, 3].map((i) => <SkeletonCard key={i} />)
            : hospitals.map((h) => <HospitalCard key={h.id} hospital={h} currency={currency} />)
          }
        </div>
      </main>

      {/* Why Rogveda section */}
      {!loading && (
        <section className="bg-white border-t border-gray-100 mt-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <h3 className="text-2xl font-black text-gray-900 text-center mb-2">Why patients choose Rogveda</h3>
            <p className="text-center text-gray-500 text-sm mb-8">End-to-end care from booking to recovery</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: '🏥', title: 'Top-Ranked Hospitals', desc: 'Every hospital is NABH or JCI accredited — the gold standard for international patient care.' },
                { icon: '👨‍⚕️', title: 'Verified Surgeons', desc: 'Choose from experienced orthopedic surgeons with 10–20 years of specialisation.' },
                { icon: '💳', title: 'Book Now, Pay Later', desc: 'Confirm your slot with zero upfront. Our finance team arranges a flexible payment plan.' },
                { icon: '✈️', title: 'Complete Travel Support', desc: 'Visa invitation letter, airport pickup, hotel assistance — we handle every detail.' },
                { icon: '📋', title: 'Dedicated Coordinator', desc: 'A personal patient coordinator available 24/7 throughout your medical journey.' },
                { icon: '🔒', title: 'Transparent Pricing', desc: 'No hidden fees. What you see is the all-inclusive procedure cost — nothing more.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-4 p-4 rounded-2xl hover:bg-gray-50 transition">
                  <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">{icon}</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm mb-1">{title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black">R</div>
              <span className="font-black text-lg">Rogveda</span>
            </div>
            <p className="text-gray-400 text-sm">Trusted by patients from 40+ countries worldwide</p>
          </div>
          <div className="flex flex-wrap gap-3 mb-6">
            {['🇳🇬 Nigeria', '🇬🇧 UK', '🇺🇸 USA', '🇰🇪 Kenya', '🇨🇦 Canada', '🇦🇺 Australia', '🇿🇦 South Africa'].map((c) => (
              <span key={c} className="text-xs text-gray-500">{c}</span>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <p className="text-xs text-gray-600">© 2025 Rogveda. All rights reserved.</p>
            <a href="/vendor" className="text-xs text-gray-600 hover:text-gray-400 transition">Vendor Login →</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
