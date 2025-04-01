'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function SupabaseDirectTest() {
  const [result, setResult] = useState<string>('Testing...');
  const [error, setError] = useState<string | null>(null);
  const [supaInfo, setSupaInfo] = useState<{url: string, hasKey: boolean}>({ 
    url: '', 
    hasKey: false 
  });

  useEffect(() => {
    async function testSupabase() {
      try {
        // Get environment variables directly
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        
        setSupaInfo({
          url: supabaseUrl,
          hasKey: !!supabaseAnonKey
        });

        if (!supabaseUrl || !supabaseAnonKey) {
          setError('Missing Supabase credentials in environment variables');
          return;
        }

        // Create a fresh client instance directly
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { 
            persistSession: false,
            autoRefreshToken: false,
            debug: true
          }
        });

        // Test auth service
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Auth error: ${sessionError.message}`);
        }
        
        setResult(`Connection successful! Auth service working.\n\nSession: ${sessionData.session ? 'Active' : 'None'}`);
        
        // Try a simple database query
        try {
          const { error: dbError } = await supabase.from('fonts').select('count').limit(1);
          
          if (dbError) {
            setResult(prev => prev + `\n\nDatabase query error: ${dbError.message}`);
          } else {
            setResult(prev => prev + '\n\nDatabase connection successful!');
          }
        } catch (dbErr) {
          setResult(prev => prev + `\n\nDatabase error: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`);
        }
        
      } catch (error) {
        console.error('Supabase test error:', error);
        setError(error instanceof Error ? error.message : String(error));
      }
    }

    testSupabase();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Direct Test</h1>
      
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <h2 className="font-medium mb-2">Supabase Config:</h2>
        <p>URL: {supaInfo.url ? supaInfo.url.substring(0, 20) + '...' : 'Not set'}</p>
        <p>Has Key: {supaInfo.hasKey ? 'Yes' : 'No'}</p>
      </div>
      
      {error ? (
        <div className="p-4 bg-red-100 text-red-800 rounded mb-4">
          <h2 className="font-bold">Error:</h2>
          <p className="whitespace-pre-wrap">{error}</p>
        </div>
      ) : (
        <div className="p-4 bg-green-100 text-green-800 rounded mb-4">
          <h2 className="font-bold">Result:</h2>
          <p className="whitespace-pre-wrap">{result}</p>
        </div>
      )}
      
      <div className="mt-6 border-t pt-4">
        <h2 className="font-bold mb-3">Troubleshooting Steps:</h2>
        <ol className="list-decimal ml-5 space-y-2">
          <li>Verify your Supabase project is active at <a href="https://supabase.com/dashboard" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Supabase Dashboard</a></li>
          <li>Check that you&apos;ve copied the correct URL and anon key from Project Settings {'->'} API</li>
          <li>Ensure your database tables exist (you may need to run migrations)</li>
          <li>Check the browser console for more detailed error messages</li>
          <li>Restart your development server after updating environment variables</li>
        </ol>
      </div>
    </div>
  );
} 