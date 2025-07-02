// Comprehensive OTP System Test
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
    username: 'otptest' + Date.now(),
    email: 'otptest' + Date.now() + '@example.com',
    fullName: 'OTP Test User',
    password: 'TestPassword123!'
};

async function testOTPSystem() {
    console.log('🔐 Starting Comprehensive OTP System Test...\n');
    
    try {
        // Step 1: Register a test user
        console.log('📝 Step 1: Registering test user...');
        const registerResponse = await fetch(`${BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_USER)
        });
        
        const registerData = await registerResponse.json();
        console.log('Register Response:', registerData);
        
        if (!registerResponse.ok) {
            throw new Error(`Registration failed: ${registerData.message}`);
        }
        console.log('✅ User registered successfully\n');
        
        // Step 2: Attempt login to trigger OTP
        console.log('🔑 Step 2: Attempting login to trigger OTP...');
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: TEST_USER.username,
                password: TEST_USER.password
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('Login Response:', loginData);
        
        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginData.message}`);
        }
        
        if (!loginData.requiresOtp) {
            throw new Error('Expected OTP requirement but got direct login');
        }
        console.log('✅ OTP requirement triggered successfully\n');
        
        // Step 3: Test invalid OTP
        console.log('❌ Step 3: Testing invalid OTP...');
        const invalidOtpResponse = await fetch(`${BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: TEST_USER.username,
                otp: '000000'
            })
        });
        
        const invalidOtpData = await invalidOtpResponse.json();
        console.log('Invalid OTP Response:', invalidOtpData);
        
        if (invalidOtpResponse.ok) {
            throw new Error('Invalid OTP was accepted - this is a security issue!');
        }
        console.log('✅ Invalid OTP correctly rejected\n');
        
        // Step 4: Get the actual OTP from login response (development mode)
        console.log('🔍 Step 4: Retrieving actual OTP...');

        if (!loginData.testOtp) {
            throw new Error('No test OTP provided in login response (development mode should include testOtp)');
        }

        const actualOtp = loginData.testOtp;
        console.log(`Found test OTP: ${actualOtp}`);
        console.log(`OTP expires in: ${loginData.expiresIn} seconds`);
        console.log('✅ OTP retrieved from login response\n');
        
        // Step 5: Test valid OTP
        console.log('✅ Step 5: Testing valid OTP...');
        const validOtpResponse = await fetch(`${BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: TEST_USER.username,
                otp: actualOtp
            })
        });
        
        const validOtpData = await validOtpResponse.json();
        console.log('Valid OTP Response:', validOtpData);
        
        if (!validOtpResponse.ok) {
            throw new Error(`Valid OTP was rejected: ${validOtpData.message}`);
        }
        
        if (!validOtpData.token) {
            throw new Error('No JWT token returned after successful OTP verification');
        }
        console.log('✅ Valid OTP accepted and JWT token received\n');
        
        // Step 6: Test OTP reuse (should fail)
        console.log('🔒 Step 6: Testing OTP reuse prevention...');
        const reuseOtpResponse = await fetch(`${BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: TEST_USER.username,
                otp: actualOtp
            })
        });
        
        const reuseOtpData = await reuseOtpResponse.json();
        console.log('OTP Reuse Response:', reuseOtpData);
        
        if (reuseOtpResponse.ok) {
            throw new Error('OTP reuse was allowed - this is a security issue!');
        }
        console.log('✅ OTP reuse correctly prevented\n');
        
        // Step 7: Test JWT token validity
        console.log('🎫 Step 7: Testing JWT token validity...');
        const protectedResponse = await fetch(`${BASE_URL}/auth/me`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${validOtpData.token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const protectedData = await protectedResponse.json();
        console.log('Protected Route Response:', protectedData);
        
        if (!protectedResponse.ok) {
            throw new Error(`JWT token invalid: ${protectedData.message}`);
        }
        console.log('✅ JWT token is valid and working\n');
        
        // Cleanup: Delete test user via API
        console.log('🧹 Cleanup: Removing test user...');
        // Note: In production, you'd want a proper cleanup endpoint or admin functionality
        console.log('✅ Test user will be cleaned up automatically (or manually if needed)\n');
        
        console.log('🎉 ALL OTP SYSTEM TESTS PASSED! 🎉');
        console.log('\n📋 Test Summary:');
        console.log('✅ User registration works');
        console.log('✅ OTP generation and requirement works');
        console.log('✅ Invalid OTP rejection works');
        console.log('✅ Valid OTP acceptance works');
        console.log('✅ JWT token generation works');
        console.log('✅ OTP reuse prevention works');
        console.log('✅ JWT token validation works');
        console.log('\n🔐 OTP System is functioning correctly!');
        
    } catch (error) {
        console.error('❌ OTP System Test Failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        // Cleanup on error
        console.log('🧹 Test user cleanup may be needed manually');
        
        process.exit(1);
    }
}

// Run the test
testOTPSystem();
