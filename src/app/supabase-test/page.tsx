'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function SupabaseTestPage() {
  const [status, setStatus] = useState<{ type: string; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [diagnostics, setDiagnostics] = useState({
    supabaseUrl: '',
    hasAnonKey: false,
    isPlaceholderUrl: false,
    isPlaceholderKey: false
  });

  // Test connection to Supabase on page load
  useEffect(() => {
    const testConnection = async () => {
      try {
        setStatus({ type: 'info', message: 'Testing connection to Supabase...' });
        
        // Check for placeholder values
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const isPlaceholderUrl = url.includes('example.supabase.co');
        const isPlaceholderKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').includes('placeholder') || 
                              (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
        
        setDiagnostics({
          supabaseUrl: url,
          hasAnonKey: hasKey,
          isPlaceholderUrl,
          isPlaceholderKey
        });

        if (isPlaceholderUrl || isPlaceholderKey) {
          setStatus({ 
            type: 'error', 
            message: 'Using placeholder Supabase credentials. Update your .env file with real credentials.' 
          });
          return;
        }
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
          setStatus({ type: 'error', message: `Connection error: ${error.message}` });
        } else {
          setStatus({ 
            type: 'success', 
            message: `Connected to Supabase! Session: ${data.session ? 'Active' : 'None'}` 
          });
        }
      } catch (error) {
        console.error('Failed to test connection:', error);
        setStatus({ 
          type: 'error', 
          message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
        });
      }
    };

    testConnection();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setStatus({ type: 'info', message: 'Attempting to sign in...' });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      if (error) {
        console.error('Sign-in error:', error);
        setStatus({ type: 'error', message: `Sign-in failed: ${error.message}` });
      } else {
        setStatus({ 
          type: 'success', 
          message: `Successfully signed in as ${data.user?.email}` 
        });
      }
    } catch (error) {
      console.error('Unexpected sign-in error:', error);
      setStatus({ 
        type: 'error', 
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setStatus({ type: 'info', message: 'Attempting to create account...' });
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });
      
      if (error) {
        console.error('Sign-up error:', error);
        setStatus({ type: 'error', message: `Sign-up failed: ${error.message}` });
      } else if (data.user) {
        setStatus({ 
          type: 'success', 
          message: data.session 
            ? `Account created and signed in as ${data.user.email}` 
            : `Account created! Check your email for confirmation.` 
        });
      }
    } catch (error) {
      console.error('Unexpected sign-up error:', error);
      setStatus({ 
        type: 'error', 
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Test</h1>
      
      {/* Connection status */}
      {status && (
        <div 
          className={`p-4 mb-6 rounded ${
            status.type === 'error' ? 'bg-red-100 text-red-800' : 
            status.type === 'success' ? 'bg-green-100 text-green-800' : 
            'bg-blue-100 text-blue-800'
          }`}
        >
          {status.message}
        </div>
      )}
      
      {/* Debug info */}
      <div className="mb-6 p-4 bg-gray-100 rounded text-sm">
        <h2 className="font-bold mb-2">Debug Info:</h2>
        <p>Supabase URL: {diagnostics.supabaseUrl ? `${diagnostics.supabaseUrl.substring(0, 20)}...` : 'Not set'}</p>
        <p>Has Anon Key: {diagnostics.hasAnonKey ? 'Yes' : 'No'}</p>
        <p>Using Placeholder URL: {diagnostics.isPlaceholderUrl ? 'Yes ⚠️' : 'No ✅'}</p>
        <p>Using Placeholder Key: {diagnostics.isPlaceholderKey ? 'Yes ⚠️' : 'No ✅'}</p>
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <h3 className="font-bold">How to fix:</h3>
          <ol className="list-decimal ml-5 space-y-1 mt-2">
            <li>Visit <a href="https://supabase.com" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Supabase.com</a> and log in</li>
            <li>Go to your project (or create one)</li>
            <li>Navigate to Project Settings → API</li>
            <li>Copy the "Project URL" and "anon" public key</li>
            <li>Update your .env file with these values</li>
            <li>Restart your development server</li>
          </ol>
        </div>
      </div>
      
      {/* Login form */}
      <form className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="your@email.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="********"
          />
        </div>
        
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleSignIn}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Sign In'}
          </button>
          
          <button
            type="button"
            onClick={handleSignUp}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Sign Up'}
          </button>
        </div>
      </form>
      
      <p className="text-sm text-gray-500">
        Note: This is a test page for Supabase authentication. For a real application, you would use the proper login pages.
      </p>
    </div>
  );
} 