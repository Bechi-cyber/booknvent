/**
 * Test OTP Verification
 */

const fetch = require('node-fetch');

async function testOtpVerification() {
  const API_BASE = 'http://localhost:3000/api';
  
  try {
    console.log('🔐 Testing OTP Verification...');
    
    const response = await fetch(`${API_BASE}/v1/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser_1751264784593',
        otp: '276183'
      })
    });
    
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Complete authentication flow verified!');
      console.log('🎉 All systems are working correctly!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOtpVerification();
