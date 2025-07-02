/**
 * Regular Login Test
 * Tests the regular login endpoint to ensure basic auth is working
 */

const fetch = require('node-fetch');

const BASE_URL = 'https://lasavot-backend.onrender.com/api';

async function testRegularLogin() {
    console.log('🔐 Testing Regular Login Endpoint...\n');

    // Create a test user first
    const timestamp = Date.now();
    const TEST_USER = {
        username: `regulartest${timestamp}`,
        email: `regulartest${timestamp}@example.com`,
        password: 'TestPassword123!'
    };

    try {
        // Step 1: Register user
        console.log('📝 Step 1: Registering test user...');
        const registerResponse = await fetch(`${BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_USER)
        });

        const registerData = await registerResponse.json();
        if (!registerData.success) {
            throw new Error(`Registration failed: ${registerData.message}`);
        }
        console.log('✅ User registration successful\n');

        // Step 2: Test regular login
        console.log('🔑 Step 2: Testing regular login...');
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: TEST_USER.username,
                password: TEST_USER.password
            })
        });

        const loginData = await loginResponse.json();
        console.log('Login response:', JSON.stringify(loginData, null, 2));

        if (loginResponse.ok && loginData.success) {
            console.log('✅ Regular login successful!');
            if (loginData.testOtp) {
                console.log(`🔑 OTP for testing: ${loginData.testOtp}`);
                
                // Step 3: Test OTP verification
                console.log('\n🔐 Step 3: Testing OTP verification...');
                const otpResponse = await fetch(`${BASE_URL}/auth/verify-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: TEST_USER.username,
                        otp: loginData.testOtp
                    })
                });

                const otpData = await otpResponse.json();
                console.log('OTP verification response:', JSON.stringify(otpData, null, 2));

                if (otpResponse.ok && otpData.success && otpData.token) {
                    console.log('✅ OTP verification successful!');
                    console.log(`🎉 Complete authentication flow working! User: ${otpData.user?.username}`);
                    console.log(`🔑 Token received: ${otpData.token.substring(0, 20)}...`);
                    return true;
                } else {
                    console.log('❌ OTP verification failed');
                    return false;
                }
            } else {
                console.log('⚠️ No test OTP provided in response');
                return false;
            }
        } else {
            console.log('❌ Regular login failed');
            console.log('Response status:', loginResponse.status);
            console.log('Response data:', loginData);
            return false;
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        return false;
    }
}

// Run the test
testRegularLogin().then(success => {
    if (success) {
        console.log('\n🎉 Regular login test PASSED!');
        process.exit(0);
    } else {
        console.log('\n❌ Regular login test FAILED!');
        process.exit(1);
    }
});
