'use server';

import { createClient } from '@supabase/supabase-js';

// This file runs only on the server, so we can use service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Define the tables we need
const requiredTables = [
  {
    name: 'fonts',
    columns: `
      id uuid primary key default uuid_generate_v4(),
      name text not null,
      userId uuid references auth.users(id),
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now()
    `
  },
  {
    name: 'source_images',
    columns: `
      id uuid primary key default uuid_generate_v4(),
      fontId uuid references fonts(id) on delete cascade,
      url text not null,
      fileName text not null,
      created_at timestamp with time zone default now()
    `
  },
  {
    name: 'character_mappings',
    columns: `
      id uuid primary key default uuid_generate_v4(),
      fontId uuid references fonts(id) on delete cascade,
      character text not null,
      imageUrl text not null,
      created_at timestamp with time zone default now()
    `
  }
];

/**
 * Check if a table exists in the database
 */
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.rpc('check_table_exists', { table_name: tableName });
    if (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
    return data === true;
  } catch (err) {
    console.error(`Error in checkTableExists for ${tableName}:`, err);
    return false;
  }
}

/**
 * Create a table if it doesn't exist
 */
export async function createTableIfNotExists(tableName: string, columnsDefinition: string): Promise<boolean> {
  try {
    // First check if the table exists
    const tableExists = await checkTableExists(tableName);
    
    if (tableExists) {
      console.log(`Table ${tableName} already exists`);
      return true;
    }
    
    // Create the table
    const { error } = await supabaseAdmin.rpc('create_table', { 
      table_name: tableName,
      columns_def: columnsDefinition
    });
    
    if (error) {
      console.error(`Error creating table ${tableName}:`, error);
      return false;
    }
    
    console.log(`Table ${tableName} created successfully`);
    return true;
  } catch (err) {
    console.error(`Error in createTableIfNotExists for ${tableName}:`, err);
    return false;
  }
}

/**
 * Check required tables and create them if they don't exist
 */
export async function setupRequiredTables(): Promise<{
  success: boolean;
  message: string;
  tablesStatus: Record<string, boolean>;
}> {
  const tablesStatus: Record<string, boolean> = {};
  
  try {
    // Check if extensions function is available
    const { error: extensionError } = await supabaseAdmin.rpc('create_extension_if_not_exists', { 
      extension_name: 'uuid-ossp' 
    });
    
    if (extensionError) {
      return {
        success: false,
        message: `Error setting up extensions: ${extensionError.message}`,
        tablesStatus
      };
    }
    
    // Check each table and create if needed
    for (const table of requiredTables) {
      const exists = await checkTableExists(table.name);
      tablesStatus[table.name] = exists;
      
      if (!exists) {
        const created = await createTableIfNotExists(table.name, table.columns);
        tablesStatus[table.name] = created;
        
        if (!created) {
          return {
            success: false,
            message: `Failed to create table ${table.name}`,
            tablesStatus
          };
        }
      }
    }
    
    return {
      success: true,
      message: 'All required tables are set up',
      tablesStatus
    };
  } catch (err) {
    return {
      success: false,
      message: `Error setting up tables: ${err instanceof Error ? err.message : String(err)}`,
      tablesStatus
    };
  }
}

// Storage buckets needed
const requiredBuckets = ['fonts', 'source-images', 'character-images'];

/**
 * Check if a storage bucket exists
 */
export async function checkBucketExists(bucketName: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.storage.getBucket(bucketName);
    if (error) {
      return false;
    }
    return !!data;
  } catch (err) {
    console.error(`Error checking if bucket ${bucketName} exists:`, err);
    return false;
  }
}

/**
 * Create a storage bucket if it doesn't exist
 */
export async function createBucketIfNotExists(bucketName: string): Promise<boolean> {
  try {
    // First check if the bucket exists
    const bucketExists = await checkBucketExists(bucketName);
    
    if (bucketExists) {
      console.log(`Bucket ${bucketName} already exists`);
      return true;
    }
    
    // Create the bucket
    const { error } = await supabaseAdmin.storage.createBucket(bucketName, {
      public: false,
      fileSizeLimit: 10485760, // 10MB
    });
    
    if (error) {
      console.error(`Error creating bucket ${bucketName}:`, error);
      return false;
    }
    
    console.log(`Bucket ${bucketName} created successfully`);
    return true;
  } catch (err) {
    console.error(`Error in createBucketIfNotExists for ${bucketName}:`, err);
    return false;
  }
}

/**
 * Check required storage buckets and create them if they don't exist
 */
export async function setupRequiredBuckets(): Promise<{
  success: boolean;
  message: string;
  bucketsStatus: Record<string, boolean>;
}> {
  const bucketsStatus: Record<string, boolean> = {};
  
  try {
    // Check each bucket and create if needed
    for (const bucket of requiredBuckets) {
      const exists = await checkBucketExists(bucket);
      bucketsStatus[bucket] = exists;
      
      if (!exists) {
        const created = await createBucketIfNotExists(bucket);
        bucketsStatus[bucket] = created;
        
        if (!created) {
          return {
            success: false,
            message: `Failed to create bucket ${bucket}`,
            bucketsStatus
          };
        }
      }
    }
    
    return {
      success: true,
      message: 'All required buckets are set up',
      bucketsStatus
    };
  } catch (err) {
    return {
      success: false,
      message: `Error setting up buckets: ${err instanceof Error ? err.message : String(err)}`,
      bucketsStatus
    };
  }
}

/**
 * Run all setup operations
 */
export async function setupSupabase(): Promise<{
  success: boolean;
  message: string;
  details: {
    tables: Record<string, boolean>;
    buckets: Record<string, boolean>;
  }
}> {
  try {
    const tablesResult = await setupRequiredTables();
    const bucketsResult = await setupRequiredBuckets();
    
    return {
      success: tablesResult.success && bucketsResult.success,
      message: tablesResult.success && bucketsResult.success 
        ? 'Setup completed successfully' 
        : `Setup issues: ${!tablesResult.success ? tablesResult.message : ''} ${!bucketsResult.success ? bucketsResult.message : ''}`,
      details: {
        tables: tablesResult.tablesStatus,
        buckets: bucketsResult.bucketsStatus
      }
    };
  } catch (err) {
    return {
      success: false,
      message: `Error during setup: ${err instanceof Error ? err.message : String(err)}`,
      details: {
        tables: {},
        buckets: {}
      }
    };
  }
} 