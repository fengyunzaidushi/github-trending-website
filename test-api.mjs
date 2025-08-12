#!/usr/bin/env node

// Simple test script to validate API endpoints
const baseUrl = 'http://localhost:3000';

async function testEndpoint(path, description) {
  try {
    console.log(`\n🔍 Testing ${description}...`);
    const response = await fetch(`${baseUrl}${path}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${description}: Success`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Data length: ${data.data?.length || 'N/A'}`);
    } else {
      console.log(`❌ ${description}: Failed`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error}`);
    }
  } catch (error) {
    console.log(`💥 ${description}: Exception`);
    console.log(`   Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting API endpoint tests...');
  
  await testEndpoint('/api/test', 'Connection Test');
  await testEndpoint('/api/trending', 'Trending Repositories');
  await testEndpoint('/api/languages', 'Language Statistics');
  await testEndpoint('/api/search?q=react', 'Search Function');
  await testEndpoint('/api/db-info', 'Database Info');
  
  console.log('\n📊 Test completed!');
}

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };