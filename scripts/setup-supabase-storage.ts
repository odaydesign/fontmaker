import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const BUCKETS = [
  {
    id: 'fonts',
    name: 'fonts',
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'application/octet-stream']
  },
  {
    id: 'source-images',
    name: 'source-images',
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg']
  },
  {
    id: 'character-images',
    name: 'character-images',
    public: true,
    fileSizeLimit: 1048576, // 1MB
    allowedMimeTypes: ['image/png']
  }
]

async function setupStorage() {
  console.log('🔧 Setting up Supabase storage buckets...\n')

  // List existing buckets
  const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    console.error('❌ Error listing buckets:', listError.message)
    return
  }

  console.log(`📦 Found ${existingBuckets?.length || 0} existing buckets`)

  for (const bucket of BUCKETS) {
    const exists = existingBuckets?.some(b => b.id === bucket.id)

    if (exists) {
      console.log(`✅ Bucket "${bucket.id}" already exists`)
    } else {
      console.log(`📦 Creating bucket "${bucket.id}"...`)

      const { data, error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes
      })

      if (error) {
        console.error(`❌ Error creating bucket "${bucket.id}":`, error.message)
      } else {
        console.log(`✅ Successfully created bucket "${bucket.id}"`)
      }
    }
  }

  console.log('\n✅ Storage setup complete!')
}

setupStorage().catch(console.error)
