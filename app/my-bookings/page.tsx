'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface BookingRecord {
  id: string
  booking_number: number
  room_type: string
  price_usd: number
  currency: string
  status: string
  created_at: string
  hospitals: { name: string; city: string; image_url: string }
  doctors:   { name: string; experience_years: number }
  vendor_tasks: { task_name: string; completed: boolean; completed_at: string | null }[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; desc: string }> = {
  Confirmed:    { label: 'Confirmed',    color: 'bg-blue-100 text-blue-700 border-blue-200',     desc: 'Your booking is confirmed. We\'re arranging your visa letter.' },
  'In Progress':{ label: 'In Progress',  color: 'bg-amber-100 text-amber-700 border-amber-200',   desc: 'Your visa letter has been sent. Coordinator will call you soon.' },
  Completed:    { label: 'Completed',    color: 'bg-emerald-100 text-emerald-700 border-emerald-200', desc: 'Your procedure is complete. We hope your recovery is going well.' },
}

function BookingCard({ booking }: { booking: BookingRecord }) {
  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG['Confirmed']
  const visaTask = booking.vendor_tasks?.[0]

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Hospital image strip */}
      <div className="relative h-28 overflow-hidden">
        {booking.hospitals?.image_url && (
          <Image src={booking.hospitals.image_url} alt={booking.hospitals.name} fill className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 p-3 flex items-end justify-between w-full">
          <div>
            <p className="text-white font-bold text-sm leading-tight">{booking.hospitals?.name}</p>
            <p className="text-white/70 text-xs">{booking.hospitals?.city}, India</p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Booking ref */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Booking Ref
          </span>
          <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-lg">
            #{booking.booking_number}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-1.5 mb-4">
          {[
            { label: 'Procedure', value: 'Total Knee Replacement' },
            { label: 'Doctor',    value: `${booking.doctors?.name} (${booking.doctors?.experience_years} yrs)` },
            { label: 'Room',      value: booking.room_type },
            { label: 'Booked',   value: new Date(booking.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-400">{label}</span>
              <span className="font-semibold text-gray-800 text-right max-w-[55%]">{value}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
            <span className="font-bold text-gray-800">Amount</span>
            <span className="font-black text-blue-600">${Number(booking.price_usd).toLocaleString()}</span>
          </div>
        </div>

        {/* Status description */}
        <div className="bg-gray-50 rounded-2xl p-3 mb-3">
          <p className="text-xs text-gray-600 leading-relaxed">{cfg.desc}</p>
        </div>

        {/* Visa task status */}
        <div className="flex items-center gap-2.5 text-sm">
          {visaTask?.completed ? (
            <>
              <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-emerald-700 text-xs">Visa Invitation Letter Sent</p>
                {visaTask.completed_at && (
                  <p className="text-[10px] text-gray-400">
                    {new Date(visaTask.completed_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-amber-500 text-xs">⏳</span>
              </div>
              <p className="text-xs text-gray-500">Visa letter being prepared (within 48 hrs)</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MyBookingsPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [bookings, setBookings] = useState<BookingRecord[] | null>(null)
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setSearched(false)
    try {
      const patRes = await fetch(`/api/patients?email=${encodeURIComponent(email.trim())}`)
      if (!patRes.ok) {
        toast.error('No account found with that email.')
        setBookings([])
        setSearched(true)
        return
      }
      const patient = await patRes.json()

      const bkRes = await fetch(`/api/bookings?patient_id=${patient.id}`)
      const data = await bkRes.json()
      setBookings(Array.isArray(data) ? data : [])
      setSearched(true)
      if (Array.isArray(data) && data.length === 0) {
        toast('No bookings found for this email.', { icon: '📋' })
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs">R</div>
            <span className="font-black text-gray-900">My Bookings</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">Track Your Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">Enter the email you used when booking to see your status</p>
        </div>

        {/* Email lookup form */}
        <form onSubmit={handleLookup} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-6">
          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">Your Email Address</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder-gray-300"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Look Up'}
            </button>
          </div>
        </form>

        {/* Results */}
        {searched && bookings !== null && (
          <>
            {bookings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
                <p className="text-4xl mb-3">📋</p>
                <p className="font-bold text-gray-700">No bookings found</p>
                <p className="text-sm text-gray-400 mt-1">Try the email you used when booking</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 font-medium">{bookings.length} booking{bookings.length > 1 ? 's' : ''} found</p>
                {bookings.map((b) => <BookingCard key={b.id} booking={b} />)}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
