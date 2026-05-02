'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Booking, Currency, CONVERSION, CURRENCY_SYMBOL, CURRENCIES } from '@/lib/types'

function formatAmount(usd: number, currency: Currency) {
  const amount = Math.round(usd * CONVERSION[currency])
  return `${CURRENCY_SYMBOL[currency]}${amount.toLocaleString()}`
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Confirmed:    'bg-blue-100 text-blue-700 border-blue-200',
    'In Progress':'bg-amber-100 text-amber-700 border-amber-200',
    Completed:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  }
  return (
    <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${map[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {status === 'Confirmed' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5" />}
      {status === 'In Progress' && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5 animate-pulse" />}
      {status === 'Completed' && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5" />}
      {status}
    </span>
  )
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function VendorPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [bookings, setBookings]   = useState<Booking[]>([])
  const [loading, setLoading]     = useState(false)
  const [selected, setSelected]   = useState<Booking | null>(null)
  const [taskLoading, setTaskLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'Confirmed' | 'In Progress'>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [currency, setCurrency]   = useState<Currency>('USD')

  const fetchBookings = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const res  = await fetch('/api/vendor/bookings', {
        headers: { 'x-vendor-auth': 'apollo:apollo123' },
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('Vendor bookings API error:', data)
        toast.error(`Failed to load bookings: ${data?.error ?? res.status}`)
        setRefreshing(false)
        return []
      }
      const list = Array.isArray(data) ? data : []
      setBookings(list)
      setRefreshing(false)
      return list
    } catch (e) {
      console.error('Fetch error:', e)
      toast.error('Network error — could not reach the server')
      setRefreshing(false)
      return []
    }
  }, [])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoading(true)
    setTimeout(() => {
      if (username === 'apollo' && password === 'apollo123') {
        setLoggedIn(true)
        toast.success('Welcome back, Apollo Spectra!')
      } else {
        setLoginError('Invalid credentials. Try apollo / apollo123')
      }
      setLoginLoading(false)
    }, 600)
  }

  useEffect(() => {
    if (!loggedIn) return
    setLoading(true)
    fetchBookings(true).finally(() => setLoading(false))
  }, [loggedIn, fetchBookings])

  async function handleMarkComplete(taskId: string) {
    setTaskLoading(true)
    const res = await fetch(`/api/vendor/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'x-vendor-auth': 'apollo:apollo123' },
    })
    if (res.ok) {
      toast.success('✉️ Visa invite letter marked as sent!')
    } else {
      const d = await res.json()
      toast.error(d.error || 'Something went wrong')
    }
    const data = await fetchBookings(true)
    const updated = data.find((b: Booking) => b.id === selected?.id)
    if (updated) setSelected(updated)
    setTaskLoading(false)
  }

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)
  const counts = {
    all:          bookings.length,
    Confirmed:    bookings.filter((b) => b.status === 'Confirmed').length,
    'In Progress':bookings.filter((b) => b.status === 'In Progress').length,
  }
  const totalRevenueUsd = bookings.reduce((sum, b) => sum + Number(b.price_usd), 0)

  /* ── Login screen ── */
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Image src="/logo.png" alt="Rogveda" height={56} width={224} className="object-contain mix-blend-multiply mx-auto mb-4" />
            <h1 className="text-2xl font-black text-gray-900">Vendor Portal</h1>
            <p className="text-gray-400 text-sm mt-1">Apollo Spectra · Delhi</p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="apollo"
                  autoComplete="username"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder-gray-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <span>⚠️</span> {loginError}
                </div>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                {loginLoading
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Logging in…</>
                  : 'Login to Dashboard'
                }
              </button>
            </form>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            <a href="/" className="hover:text-blue-500 transition">← Back to patient search</a>
          </p>
        </div>
      </div>
    )
  }

  /* ── Dashboard ── */
  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Image src="/logo.png" alt="Rogveda" height={36} width={144} className="object-contain mix-blend-multiply" />
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

            <button
              onClick={() => fetchBookings()}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition"
            >
              <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setLoggedIn(false)}
              className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Bookings',  value: counts.all,            color: 'text-gray-900' },
            { label: 'Awaiting Action', value: counts.Confirmed,       color: 'text-blue-600' },
            { label: 'In Progress',     value: counts['In Progress'],  color: 'text-amber-600' },
            { label: 'Total Revenue',   value: formatAmount(totalRevenueUsd, currency), color: 'text-emerald-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          {(['all', 'Confirmed', 'In Progress'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all flex-shrink-0 ${
                filter === f
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-300'
              }`}
            >
              {f === 'all' ? 'All' : f} <span className="opacity-70">({counts[f === 'all' ? 'all' : f]})</span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading patient bookings…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100">
            <p className="text-5xl mb-4">📋</p>
            <p className="font-bold text-gray-700">No bookings yet</p>
            <p className="text-sm text-gray-400 mt-1">Patient bookings appear here in real time</p>
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Desktop header */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-3.5 bg-gray-50/80 border-b border-gray-100">
              {['Patient', 'Hospital', 'Doctor · Room', 'Amount', 'Status', 'Time'].map((h) => (
                <div key={h} className={`text-[10px] font-black text-gray-400 uppercase tracking-wider ${h === 'Patient' ? 'col-span-3' : h === 'Time' ? 'col-span-1' : 'col-span-2'}`}>
                  {h}
                </div>
              ))}
            </div>

            <div className="divide-y divide-gray-50">
              {filtered.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelected(b)}
                  className="grid grid-cols-2 md:grid-cols-12 gap-3 px-5 md:px-6 py-4 hover:bg-blue-50/30 cursor-pointer transition-colors items-center group"
                >
                  {/* Patient */}
                  <div className="col-span-1 md:col-span-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                        {b.patients?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{b.patients?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{b.patients?.email}</p>
                      </div>
                    </div>
                  </div>
                  {/* Hospital */}
                  <div className="hidden md:block md:col-span-2">
                    <p className="text-sm font-semibold text-gray-700 truncate">{b.hospitals?.name}</p>
                    <p className="text-xs text-gray-400">{b.hospitals?.city}</p>
                  </div>
                  {/* Doctor + Room */}
                  <div className="hidden md:block md:col-span-2">
                    <p className="text-sm text-gray-700 truncate">{b.doctors?.name}</p>
                    <p className="text-xs text-gray-400">{b.room_type}</p>
                  </div>
                  {/* Amount */}
                  <div className="hidden md:block md:col-span-2">
                    <p className="text-sm font-black text-gray-900">{formatAmount(Number(b.price_usd), currency)}</p>
                  </div>
                  {/* Status */}
                  <div className="col-span-1 md:col-span-2 flex items-center justify-end md:justify-start">
                    <StatusBadge status={b.status} />
                  </div>
                  {/* Time */}
                  <div className="hidden md:block md:col-span-1">
                    <p className="text-xs text-gray-400">{timeAgo(b.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-lg font-black text-gray-900">Booking Details</h2>
                <p className="text-xs font-mono text-gray-400">{selected.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-lg transition"
              >×</button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Patient card */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4">
                <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-lg flex-shrink-0">
                  {selected.patients?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-gray-900">{selected.patients?.name}</p>
                  <p className="text-sm text-gray-500">{selected.patients?.email}</p>
                </div>
              </div>

              {/* Booking info grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Hospital',   value: selected.hospitals?.name },
                  { label: 'City',       value: selected.hospitals?.city },
                  { label: 'Doctor',     value: selected.doctors?.name },
                  { label: 'Experience', value: `${selected.doctors?.experience_years} years` },
                  { label: 'Room Type',  value: selected.room_type },
                  { label: 'Procedure',  value: 'Total Knee Replacement' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>

              {/* Amount + Status */}
              <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <div>
                  <p className="text-xs text-blue-500 font-bold uppercase tracking-wide">Total Amount</p>
                  <p className="text-2xl font-black text-blue-700">{formatAmount(Number(selected.price_usd), currency)}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              {/* Booked time */}
              <p className="text-xs text-gray-400 text-center">
                Booked {new Date(selected.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>

            {/* Task section */}
            <div className="p-5 border-t border-gray-100 flex-shrink-0">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-3">Vendor Task</p>
              {selected.vendor_tasks?.[0]?.completed ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-emerald-800 text-sm">Visa Invite Letter Sent</p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      {selected.vendor_tasks[0].completed_at
                        ? new Date(selected.vendor_tasks[0].completed_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                        : 'Completed'}
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleMarkComplete(selected.vendor_tasks[0]?.id)}
                  disabled={taskLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-200"
                >
                  {taskLoading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating…</>
                  ) : (
                    <>✉️ Mark: Visa Invite Letter Sent</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
