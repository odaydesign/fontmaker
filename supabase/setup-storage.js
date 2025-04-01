// Script to set up Supabase storage buckets
// Run this script with your Supabase service key
// node setup-storage.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service key with admin privileges

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables');
  process.exit(1);
}

// Create Supabase client with service key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Bucket configuration
const buckets = [
  {
    name: 'fonts',
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'application/octet-stream']
  },
  {
    name: 'source-images',
    public: true,
    fileSizeLimit: 20971520, // 20MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml']
  },
  {
    name: 'character-images',
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml']
  }
];

// Create buckets
async function createBuckets() {
  try {
    for (const bucket of buckets) {
      console.log(`Creating bucket: ${bucket.name}...`);
      
      // Check if bucket exists
      const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        throw new Error(`Error checking for existing buckets: ${listError.message}`);
      }
      
      const bucketExists = existingBuckets.some(b => b.name === bucket.name);
      
      if (bucketExists) {
        console.log(`Bucket ${bucket.name} already exists, updating...`);
        
        // Update bucket
        const { error: updateError } = await supabase.storage.updateBucket(
          bucket.name,
          {
            public: bucket.public,
            fileSizeLimit: bucket.fileSizeLimit,
            allowedMimeTypes: bucket.allowedMimeTypes
          }
        );
        
        if (updateError) {
          throw new Error(`Error updating bucket ${bucket.name}: ${updateError.message}`);
        }
        
        console.log(`Bucket ${bucket.name} updated successfully`);
      } else {
        // Create bucket
        const { error: createError } = await supabase.storage.createBucket(
          bucket.name,
          {
            public: bucket.public,
            fileSizeLimit: bucket.fileSizeLimit,
            allowedMimeTypes: bucket.allowedMimeTypes
          }
        );
        
        if (createError) {
          throw new Error(`Error creating bucket ${bucket.name}: ${createError.message}`);
        }
        
        console.log(`Bucket ${bucket.name} created successfully`);
      }
    }
    
    console.log('All buckets created/updated successfully');
  } catch (error) {
    console.error('Error setting up buckets:', error);
    process.exit(1);
  }
}

// Run the script
createBuckets(); 