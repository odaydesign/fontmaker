'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function SupabaseSetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [supabaseInfo, setSupabaseInfo] = useState({
    url: '',
    hasAnonKey: false
  });

  // Define the tables we need
  const requiredTables = [
    {
      name: 'fonts',
      sql: `
        CREATE TABLE IF NOT EXISTS fonts (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          "userId" UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'source_images',
      sql: `
        CREATE TABLE IF NOT EXISTS source_images (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "fontId" UUID REFERENCES fonts(id) ON DELETE CASCADE,
          url TEXT NOT NULL,
          "fileName" TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'character_mappings',
      sql: `
        CREATE TABLE IF NOT EXISTS character_mappings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          "fontId" UUID REFERENCES fonts(id) ON DELETE CASCADE,
          character TEXT NOT NULL,
          "imageUrl" TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    }
  ];

  // Storage buckets needed
  const requiredBuckets = ['fonts', 'source-images', 'character-images'];

  const checkCredentials = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    setSupabaseInfo({
      url: supabaseUrl,
      hasAnonKey: !!supabaseAnonKey
    });
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return false;
    }
    
    const isPlaceholderUrl = supabaseUrl.includes('example.supabase.co') || supabaseUrl.includes('your-project-id');
    const isPlaceholderKey = supabaseAnonKey.includes('placeholder') || supabaseAnonKey.includes('your-anon-key');
    
    return !isPlaceholderUrl && !isPlaceholderKey;
  };

  const handleSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check credentials first
      if (!checkCredentials()) {
        setError('Invalid Supabase credentials. Please update your .env file with valid values.');
        setLoading(false);
        return;
      }
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      
      // Create a client instance
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      const setupResult = {
        success: true,
        message: 'Setup completed',
        details: {
          tables: {} as Record<string, boolean>,
          buckets: {} as Record<string, boolean>
        }
      };
      
      // Check if tables exist by querying them
      for (const table of requiredTables) {
        try {
          const { error } = await supabase.from(table.name).select('id').limit(1);
          
          // If table doesn't exist, we'll get an error
          if (error && error.message.includes('does not exist')) {
            setupResult.details.tables[table.name] = false;
            setupResult.message = 'Tables need to be created. Please run the SQL script in your Supabase dashboard.';
            setupResult.success = false;
          } else {
            setupResult.details.tables[table.name] = true;
          }
        } catch (err) {
          setupResult.details.tables[table.name] = false;
          setupResult.success = false;
        }
      }
      
      // Check if buckets exist
      for (const bucket of requiredBuckets) {
        try {
          const { data, error } = await supabase.storage.getBucket(bucket);
          
          if (error) {
            setupResult.details.buckets[bucket] = false;
          } else {
            setupResult.details.buckets[bucket] = true;
          }
        } catch (err) {
          setupResult.details.buckets[bucket] = false;
          setupResult.success = false;
        }
      }
      
      setResult(setupResult);
      
      if (!setupResult.success) {
        setError('Some resources need to be created. See the SQL setup instructions below.');
      }
    } catch (err) {
      console.error('Setup error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Supabase Setup</h1>
      
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h2 className="text-xl font-semibold mb-2">What This Does</h2>
        <p className="mb-4">
          This utility will check if your Supabase project has the required database tables and storage buckets.
          If they don&apos;t exist, it will provide SQL scripts to create them.
        </p>
        <ul className="list-disc ml-6 space-y-1">
          <li>Tables: fonts, source_images, character_mappings</li>
          <li>Storage Buckets: fonts, source-images, character-images</li>
        </ul>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold">Supabase Credentials</h3>
          <p>URL: {supabaseInfo.url ? `${supabaseInfo.url.substring(0, 20)}...` : 'Not set'}</p>
          <p>Has Anon Key: {supabaseInfo.hasAnonKey ? 'Yes' : 'No'}</p>
        </div>
      </div>
      
      <div className="flex justify-center mb-8">
        <button
          onClick={handleSetup}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check Setup'}
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded">
          <h3 className="font-bold text-red-800 mb-2">Error</h3>
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      {result && (
        <div className="border rounded-md overflow-hidden">
          <div className={`p-4 ${result.success ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <h3 className="font-bold text-lg mb-2">Setup Result</h3>
            <p>{result.message}</p>
          </div>
          
          <div className="p-4 border-t">
            <h4 className="font-semibold mb-3">Database Tables</h4>
            <ul className="space-y-2">
              {Object.entries(result.details.tables).map(([table, exists]) => (
                <li key={table} className="flex items-center">
                  <span className={`inline-block w-6 h-6 rounded-full mr-2 flex items-center justify-center ${exists ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                    {exists ? '✓' : '✗'}
                  </span>
                  <span>{table}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-4 border-t">
            <h4 className="font-semibold mb-3">Storage Buckets</h4>
            <ul className="space-y-2">
              {Object.entries(result.details.buckets).map(([bucket, exists]) => (
                <li key={bucket} className="flex items-center">
                  <span className={`inline-block w-6 h-6 rounded-full mr-2 flex items-center justify-center ${exists ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                    {exists ? '✓' : '✗'}
                  </span>
                  <span>{bucket}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {!result.success && (
            <div className="p-4 border-t">
              <h4 className="font-semibold mb-3">SQL Setup Script</h4>
              <p className="mb-3">Run this SQL in your Supabase SQL Editor:</p>
              <div className="bg-gray-800 text-white p-4 rounded overflow-auto text-sm font-mono">
                <pre>
                  {`-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

${requiredTables.map(table => table.sql).join('\n')}

-- Create storage buckets if they don't exist
${requiredBuckets.map(bucket => 
  `SELECT CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM storage.buckets WHERE name = '${bucket}'
    ) 
    THEN (SELECT storage.create_bucket('${bucket}', {'public': false}))
  END;`
).join('\n\n')}`}
                </pre>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                After running the SQL, come back and click &quot;Check Setup&quot; again to verify.
              </p>
            </div>
          )}
          
          <div className="p-4 border-t bg-gray-50">
            <h4 className="font-semibold mb-2">What Next?</h4>
            <ol className="list-decimal ml-5 space-y-1">
              <li>If setup was successful, try using the application features</li>
              <li>If you see errors, check the Supabase dashboard for more details</li>
              <li>Make sure your tables have the correct permissions set</li>
              <li>Test authentication using the <a href="/supabase-direct-test" className="text-blue-600 underline">direct test page</a></li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
} 