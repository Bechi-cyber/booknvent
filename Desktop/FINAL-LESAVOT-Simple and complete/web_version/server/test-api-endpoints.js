/**
 * Test API Endpoints
 * 
 * This script tests the authentication endpoints to verify they're working correctly.
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🧪 Testing ${name}...`);
  console.log(`📡 ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    return { response, data };
  } catch (error) {
    console.error(`❌ Error testing ${name}:`, error.message);
    return { error };
  }
}

async function runTests() {
  console.log('🚀 Starting API Endpoint Tests...\n');
  
  // Test 1: Health check
  await testEndpoint('Health Check', `${API_BASE}/health`);
  
  // Test 2: Sign up
  const signupResult = await testEndpoint('Sign Up', `${API_BASE}/v1/auth/signup`, {
    method: 'POST',
    body: JSON.stringify({
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'testpass123',
      fullName: 'Test User 2'
    })
  });
  
  // Test 3: Login (should generate OTP)
  const loginResult = await testEndpoint('Login', `${API_BASE}/v1/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      username: 'testuser',
      password: 'testpass123'
    })
  });
  
  // Test 4: OTP Verification (if login was successful)
  if (loginResult.data && loginResult.data.testOtp) {
    await testEndpoint('OTP Verification', `${API_BASE}/v1/auth/verify-otp`, {
      method: 'POST',
      body: JSON.stringify({
        username: 'testuser',
        otp: loginResult.data.testOtp
      })
    });
  }
  
  // Test 5: Resend OTP
  const resendResult = await testEndpoint('Resend OTP', `${API_BASE}/v1/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      username: 'testuser',
      resendOtp: true
    })
  });
  
  // Test 6: Verify resent OTP
  if (resendResult.data && resendResult.data.testOtp) {
    await testEndpoint('Verify Resent OTP', `${API_BASE}/v1/auth/verify-otp`, {
      method: 'POST',
      body: JSON.stringify({
        username: 'testuser',
        otp: resendResult.data.testOtp
      })
    });
  }
  
  console.log('\n✅ API Endpoint Tests Completed!');
}

// Run tests
runTests().catch(console.error);
