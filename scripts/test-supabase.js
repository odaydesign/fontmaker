// Test script for Supabase connection
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if credentials are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase URL or anonymous key missing!');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey.substring(0, 10) + '...');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test authentication
async function testAuth() {
  try {
    console.log('\n🔒 Testing Supabase Auth...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth Error:', error.message);
      return false;
    }
    
    console.log('✅ Auth Service is working');
    console.log('   Current session:', data.session ? 'Active' : 'None');
    return true;
  } catch (error) {
    console.error('❌ Auth Test Error:', error.message);
    return false;
  }
}

// Test database
async function testDatabase() {
  try {
    console.log('\n📊 Testing Supabase Database...');
    
    // Try to access the RLS tables we created
    const { data: fontsData, error: fontsError } = await supabase
      .from('fonts')
      .select('count(*)', { count: 'exact', head: true });
    
    if (fontsError) {
      if (fontsError.code === 'PGRST116') {
        console.log('⚠️ Table "fonts" exists but returned no rows (expected for new setup)');
      } else if (fontsError.code === '42P01') {
        console.error('❌ Table "fonts" does not exist! Did you run the schema.sql script?');
        return false;
      } else {
        console.error('❌ Database Error:', fontsError.message);
        console.error('   Error Code:', fontsError.code);
        return false;
      }
    } else {
      console.log('✅ Successfully connected to "fonts" table');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database Test Error:', error.message);
    return false;
  }
}

// Test storage
async function testStorage() {
  try {
    console.log('\n📦 Testing Supabase Storage...');
    
    // List buckets
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      console.error('❌ Storage Error:', bucketsError.message);
      return false;
    }
    
    const requiredBuckets = ['fonts', 'source-images', 'character-images'];
    const existingBuckets = buckets.map(b => b.name);
    
    console.log('   Found buckets:', existingBuckets.join(', ') || 'None');
    
    const missingBuckets = requiredBuckets.filter(name => !existingBuckets.includes(name));
    
    if (missingBuckets.length > 0) {
      console.warn('⚠️ Missing required buckets:', missingBuckets.join(', '));
      console.warn('   Run the setup-storage.js script to create these buckets');
    } else {
      console.log('✅ All required storage buckets are present');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Storage Test Error:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🔍 Testing Supabase Connection...\n');

  const authSuccess = await testAuth();
  const dbSuccess = await testDatabase();
  const storageSuccess = await testStorage();
  
  console.log('\n📝 Summary:');
  console.log(`   Auth: ${authSuccess ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Database: ${dbSuccess ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Storage: ${storageSuccess ? '✅ Working' : '❌ Failed'}`);
  
  if (authSuccess && dbSuccess && storageSuccess) {
    console.log('\n🎉 All Supabase services are working properly!');
  } else {
    console.log('\n⚠️ Some Supabase services have issues. Check the logs above for details.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Unexpected error during tests:', error);
  process.exit(1);
}); 