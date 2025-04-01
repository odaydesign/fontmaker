import Link from 'next/link';

export default function SupabaseDiagnostics() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">HappyFont Supabase Diagnostics</h1>
        <Link 
          href="/"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
        >
          Back to Home
        </Link>
      </div>
      
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h2 className="text-xl font-semibold mb-3">Supabase Connection Status</h2>
        <p className="mb-3">
          Use these diagnostic tools to check your Supabase connection and set up the required database resources.
        </p>
        <ol className="list-decimal ml-5 space-y-2">
          <li>Start with the Minimal Connection Test</li>
          <li>Run the Database Setup tool to create required tables</li>
          <li>Test authentication with the Auth Test page</li>
        </ol>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          href="/supabase-minimal-test"
          className="block p-6 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-bold mb-2">Minimal Connection Test</h2>
          <p className="text-gray-600 mb-4">
            Basic test to check if your Supabase connection is working. Simplest possible test.
          </p>
          <span className="inline-block bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm font-medium">
            Start Here →
          </span>
        </Link>
        
        <Link 
          href="/supabase-direct-test"
          className="block p-6 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-bold mb-2">Detailed Connection Test</h2>
          <p className="text-gray-600 mb-4">
            More comprehensive connection test with additional diagnostic information.
          </p>
          <span className="inline-block bg-green-100 text-green-800 py-1 px-3 rounded-full text-sm font-medium">
            Advanced Test
          </span>
        </Link>
        
        <Link 
          href="/supabase-setup"
          className="block p-6 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-bold mb-2">Database Setup</h2>
          <p className="text-gray-600 mb-4">
            Creates necessary tables and storage buckets for the application.
          </p>
          <span className="inline-block bg-purple-100 text-purple-800 py-1 px-3 rounded-full text-sm font-medium">
            Setup Tool
          </span>
        </Link>
        
        <Link 
          href="/supabase-test"
          className="block p-6 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-bold mb-2">Auth Test</h2>
          <p className="text-gray-600 mb-4">
            Test Supabase authentication with sign-in and sign-up functionality.
          </p>
          <span className="inline-block bg-yellow-100 text-yellow-800 py-1 px-3 rounded-full text-sm font-medium">
            Authentication Test
          </span>
        </Link>
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h2 className="font-semibold mb-2">Environment Check</h2>
        <p className="text-sm text-gray-600">
          Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 
            (process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20) + '...') : 
            'Not set (check your .env file)'}
        </p>
        <p className="text-sm text-gray-600">
          Environment: {process.env.NODE_ENV}
        </p>
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          After completing setup, you can return to the <Link href="/" className="text-blue-600 hover:underline">main application</Link>.
        </p>
      </div>
    </div>
  );
} 