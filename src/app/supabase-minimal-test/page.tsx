'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

export default function MinimalTest() {
  const [status, setStatus] = useState('Loading...');
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<any>({});
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  useEffect(() => {
    async function testSupabase() {
      try {
        // First display the env values we're using
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        const hasKey = !!anonKey;
        
        // Check if credentials look like placeholders
        const isPlaceholderUrl = 
          !url || 
          url.includes('example.supabase.co') || 
          url.includes('your-') || 
          url === 'https://xxxxxxxxxxxx.supabase.co' ||
          url === 'https://your-actual-project-id.supabase.co';

        const isPlaceholderKey = 
          !anonKey || 
          anonKey.includes('placeholder') || 
          anonKey.includes('your-') || 
          anonKey === 'eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' ||
          anonKey === 'your-actual-anon-key';
        
        setDetails({
          url: url ? url.substring(0, 20) + '...' : 'Not set',
          hasKey,
          isPlaceholderUrl,
          isPlaceholderKey,
          isDevelopment: process.env.NODE_ENV === 'development'
        });
        
        if (isPlaceholderUrl || isPlaceholderKey) {
          setError('Using placeholder Supabase credentials. Update your .env file with real credentials.');
          setStatus('Configuration Error');
          setShowSetupGuide(true);
          return;
        }
        
        // Create the simplest client possible
        const supabase = createClient(url, anonKey, { 
          auth: { 
            persistSession: false,
            autoRefreshToken: false
          }
        });
        
        // Just try to fetch the session to test authentication
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setError(`Authentication error: ${sessionError.message}`);
          setStatus('Auth Error');
          return;
        }
        
        // Now try a simple database query
        const { error: dbError } = await supabase.from('nonexistent_table').select('id').limit(1);
        
        // We expect an error here since the table doesn't exist, but it should be a specific error
        if (dbError && dbError.message.includes("doesn't exist")) {
          // This is actually a good sign - we connected to the database
          setStatus('Connected successfully');
          setError(null);
        } else if (dbError) {
          // Unexpected error
          setError(`Database error: ${dbError.message}`);
          setStatus('Database Error');
        } else {
          // No error? That's unexpected since the table shouldn't exist
          setStatus('Connected (unexpected result)');
        }
      } catch (err) {
        console.error('Supabase minimal test error:', err);
        setStatus('Failed');
        setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    testSupabase();
  }, []);
  
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Minimal Test</h1>
      
      <div className="p-4 mb-4 bg-gray-100 rounded text-sm">
        <h2 className="font-semibold mb-2">Configuration:</h2>
        <pre className="whitespace-pre-wrap">
          {`URL: ${details.url || 'Not available'}
Has Anon Key: ${details.hasKey ? 'Yes' : 'No'}
Using placeholder URL: ${details.isPlaceholderUrl ? 'Yes ⚠️' : 'No ✅'}
Using placeholder Key: ${details.isPlaceholderKey ? 'Yes ⚠️' : 'No ✅'}
Environment: ${details.isDevelopment ? 'Development' : 'Production'}`}
        </pre>
      </div>
      
      <div className={`p-4 rounded ${
        status === 'Loading...' ? 'bg-blue-100' :
        status.includes('Connected') ? 'bg-green-100' : 'bg-red-100'
      }`}>
        <h2 className="font-bold mb-2">Status: {status}</h2>
        {error && (
          <div className="mt-2">
            <p className="font-medium">Error Details:</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{error}</p>
          </div>
        )}
      </div>
      
      {showSetupGuide && (
        <div className="mt-6 border rounded-md overflow-hidden">
          <div className="bg-blue-50 p-4 border-b">
            <h2 className="font-bold text-lg">Supabase Setup Guide</h2>
            <p className="text-sm mt-1">Follow these steps to connect your application to Supabase:</p>
          </div>
          
          <div className="p-4">
            <ol className="list-decimal ml-5 space-y-3">
              <li>
                <strong>Create a Supabase project</strong>
                <p className="text-sm mt-1">Go to <a href="https://supabase.com" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">supabase.com</a> and sign up or log in</p>
                <p className="text-sm mt-1">Click "New Project" and follow the setup wizard</p>
              </li>
              
              <li>
                <strong>Get your API credentials</strong>
                <p className="text-sm mt-1">In your Supabase dashboard, go to Project Settings → API</p>
                <p className="text-sm mt-1">Copy the "Project URL" and "anon" public key</p>
              </li>
              
              <li>
                <strong>Update your .env file</strong>
                <p className="text-sm mt-1">Open your project's .env file and update these values:</p>
                <pre className="bg-gray-800 text-white p-3 text-xs mt-2 rounded overflow-x-auto">
                  {`NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-full-anon-key`}
                </pre>
              </li>
              
              <li>
                <strong>Restart your development server</strong>
                <p className="text-sm mt-1">Stop and restart your next.js server with <code>npm run dev</code></p>
              </li>
              
              <li>
                <strong>Create database tables</strong>
                <p className="text-sm mt-1">Use the <Link href="/supabase-setup" className="text-blue-600 underline">Database Setup</Link> page to create required tables</p>
              </li>
            </ol>
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <h2 className="font-bold mb-2">Troubleshooting:</h2>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Check that your .env file has valid Supabase URL and anon key</li>
          <li>Make sure your Supabase project is active and running</li>
          <li>Try opening the Supabase URL directly in your browser to verify it works</li>
          <li>Check for CORS issues in browser console (press F12)</li>
          <li>Try restarting your development server with <code>npm run dev</code></li>
          <li><Link href="/" className="text-blue-600 underline">Return to the homepage</Link> for more diagnostic tools</li>
        </ul>
      </div>
    </div>
  );
} 