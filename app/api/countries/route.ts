import { ok, err } from '@/lib/api'

// Popular countries shown first (in this order)
const POPULAR = ['NG','US','GB','IN','CA','AU','AE','SA','KE','ZA','GH','PK','BD']

export async function GET() {
  try {
    const res = await fetch(
      'https://restcountries.com/v3.1/all?fields=name,cca2,idd',
      {
        // Cache for 24 hours — the list never changes
        next: { revalidate: 86400 },
      }
    )

    if (!res.ok) throw new Error(`restcountries returned ${res.status}`)

    const raw: {
      name:  { common: string }
      cca2:  string
      idd:   { root?: string; suffixes?: string[] }
    }[] = await res.json()

    const countries = raw
      .filter((c) => c.idd?.root && c.cca2)
      .map((c) => {
        const root   = c.idd.root ?? ''
        // Only append suffix when there is exactly one (avoids "+1-242" style)
        const suffix = c.idd.suffixes?.length === 1 ? c.idd.suffixes[0] : ''
        return {
          name: c.name.common,
          code: c.cca2,
          dial: root + suffix,
        }
      })
      // Drop entries with no useful dial code
      .filter((c) => c.dial && c.dial.length > 1)
      // Sort: popular first (by POPULAR order), then A-Z
      .sort((a, b) => {
        const ai = POPULAR.indexOf(a.code)
        const bi = POPULAR.indexOf(b.code)
        if (ai !== -1 && bi !== -1) return ai - bi
        if (ai !== -1) return -1
        if (bi !== -1) return 1
        return a.name.localeCompare(b.name)
      })

    // Append "Other" at the very end
    countries.push({ name: 'Other', code: '', dial: '+' })

    return ok(countries)
  } catch (e) {
    console.error('restcountries fetch failed:', e)
    // Return empty array — the frontend falls back to FALLBACK_COUNTRIES
    return err('Could not fetch country list', 502)
  }
}
