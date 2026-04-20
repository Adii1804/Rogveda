import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = 'https://qfqppgvdodwwtjndgkjp.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcXBwZ3Zkb2R3d3RqbmRna2pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY3ODYxMiwiZXhwIjoyMDkyMjU0NjEyfQ.5jDYI4joKGHgLgSRbGdr2mw9ZR9c_-P0-y_fz70BSK0'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const IMAGES = [
  { file: 'apollo.jpg',  hospitalId: 'a1000000-0000-0000-0000-000000000001', name: 'Apollo Spectra' },
  { file: 'max.jpg',     hospitalId: 'a1000000-0000-0000-0000-000000000002', name: 'Max Saket'      },
  { file: 'fortis.jpg',  hospitalId: 'a1000000-0000-0000-0000-000000000003', name: 'Fortis Gurgaon' },
]

async function run() {
  // 1. Create bucket if it doesn't exist
  console.log('Creating storage bucket...')
  const { error: bucketErr } = await supabase.storage.createBucket('hospitals', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  })
  if (bucketErr && !bucketErr.message.includes('already exists')) {
    console.error('Bucket error:', bucketErr.message)
    process.exit(1)
  }
  console.log('✓ Bucket ready\n')

  // 2. Upload each image and update DB
  for (const { file, hospitalId, name } of IMAGES) {
    const filePath = resolve(__dirname, '../public', file)
    const fileBuffer = readFileSync(filePath)

    console.log(`Uploading ${file}...`)
    const { error: uploadErr } = await supabase.storage
      .from('hospitals')
      .upload(file, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadErr) {
      console.error(`  ✗ Upload failed: ${uploadErr.message}`)
      continue
    }

    // 3. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('hospitals')
      .getPublicUrl(file)

    // 4. Update hospital record
    const { error: updateErr } = await supabase
      .from('hospitals')
      .update({ image_url: publicUrl })
      .eq('id', hospitalId)

    if (updateErr) {
      console.error(`  ✗ DB update failed: ${updateErr.message}`)
    } else {
      console.log(`  ✓ ${name} → ${publicUrl}`)
    }
  }

  console.log('\n✅ All done! Images are now stored in Supabase.')
}

run()
