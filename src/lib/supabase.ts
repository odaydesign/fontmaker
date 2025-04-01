import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Extract project reference from URL for storage key
const projectRef = supabaseUrl.match(/(?:https?:\/\/)?([^.]+)\.supabase\.co/)?.[1] || 'default';

// Check if credentials look like placeholders
const isPlaceholderUrl = 
  !supabaseUrl || 
  supabaseUrl.includes('example.supabase.co') || 
  supabaseUrl.includes('your-') || 
  supabaseUrl === 'https://xxxxxxxxxxxx.supabase.co';

const isPlaceholderKey = 
  !supabaseAnonKey || 
  supabaseAnonKey.includes('placeholder') || 
  supabaseAnonKey.includes('your-') || 
  supabaseAnonKey === 'eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' ||
  supabaseAnonKey === 'your-actual-anon-key';

const isDevelopment = process.env.NODE_ENV === 'development';

// In development, we'll still create a client even with placeholder credentials
// But we'll log warnings
if (isPlaceholderUrl || isPlaceholderKey) {
  if (isDevelopment) {
    console.error(
      'Supabase credentials appear to be placeholder values. Please replace them with actual values from your Supabase project.'
    );
    console.log('In development mode, a client will be created but functionality will be limited.');
  } else {
    // In production, don't even try to create a client with bad credentials
    throw new Error(
      'Invalid Supabase credentials. Please set proper NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    );
  }
} else {
  console.log(`Supabase initialized with URL: ${supabaseUrl.substring(0, 20)}...`);
  console.log(`Using storage key prefix: sb-${projectRef}`);
}

// Create a singleton instance of Supabase client with debug mode if not in production
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    debug: isDevelopment,
    autoRefreshToken: true,
    persistSession: true,
    storageKey: `sb-${projectRef}-auth-token`
  }
});

// Create a mock client for development when using placeholder credentials
const mockMethods = {
  async mockResponse(success = true) {
    if (isPlaceholderUrl || isPlaceholderKey) {
      return {
        data: success ? {} : null,
        error: success ? null : { 
          message: 'Development mode - using placeholder credentials' 
        }
      };
    }
    return null; // let the real client handle it
  }
};

// Test the connection
(async () => {
  try {
    const { error } = await supabase.from('fonts').select('*', { count: 'exact', head: true });
    if (error) {
      console.error('Error connecting to Supabase database:', error.message);
    } else {
      console.log('Successfully connected to Supabase');
    }
  } catch (err) {
    console.error('Failed to test Supabase connection:', err);
  }
})();

// Helper functions for authentication
export const signIn = async (email: string, password: string) => {
  try {
    // In development with placeholder credentials, return mock response
    const mockResult = await mockMethods.mockResponse(false);
    if (mockResult) return mockResult;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Supabase sign in error:', error);
    }
    return { data, error };
  } catch (err) {
    console.error('Unexpected error during sign in:', err);
    return { 
      data: null, 
      error: { message: 'Cannot connect to Supabase. Please check your network connection and credentials.' } 
    };
  }
};

export const signUp = async (email: string, password: string, metadata?: { username?: string; displayName?: string }) => {
  try {
    // In development with placeholder credentials, return mock response
    const mockResult = await mockMethods.mockResponse(false);
    if (mockResult) return mockResult;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    if (error) {
      console.error('Supabase sign up error:', error);
    } else {
      console.log('Sign up successful, confirmation email may have been sent');
    }
    return { data, error };
  } catch (err) {
    console.error('Unexpected error during sign up:', err);
    return { 
      data: null, 
      error: { message: 'Cannot connect to Supabase. Please check your network connection and credentials.' } 
    };
  }
};

export const signOut = async () => {
  // In development with placeholder credentials, return mock response
  const mockResult = await mockMethods.mockResponse(true);
  if (mockResult) return mockResult;
  
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getSession = async () => {
  try {
    // In development with placeholder credentials, return mock response
    const mockResult = await mockMethods.mockResponse(true);
    if (mockResult) return { session: null, error: null };
    
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Supabase get session error:', error);
    }
    return { session: data.session, error };
  } catch (err) {
    console.error('Unexpected error getting session:', err);
    return { 
      session: null, 
      error: { message: 'An unexpected error occurred getting session' }
    };
  }
};

// Helper functions for storage
export const uploadFile = async (
  bucket: string,
  filePath: string,
  file: File | Blob
) => {
  try {
    // In development with placeholder credentials, return mock response
    const mockResult = await mockMethods.mockResponse(false);
    if (mockResult) return mockResult;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true,
      });
    if (error) {
      console.error(`Error uploading to ${bucket}/${filePath}:`, error);
    }
    return { data, error };
  } catch (err) {
    console.error('Unexpected error during file upload:', err);
    return { 
      data: null, 
      error: { message: 'An unexpected error occurred during file upload' }
    };
  }
};

export const getPublicUrl = (bucket: string, filePath: string) => {
  // For development with placeholder credentials
  if (isPlaceholderUrl || isPlaceholderKey) {
    return `/mock-url/${bucket}/${filePath}`;
  }
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
};

export const getFontCount = async (): Promise<number> => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  // Get only the count, not the data
  const { count, error } = await supabase.from('fonts').select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error getting font count:', error.message);
    return 0;
  }

  return count ?? 0; // Return 0 if count is null
};

export default supabase; 