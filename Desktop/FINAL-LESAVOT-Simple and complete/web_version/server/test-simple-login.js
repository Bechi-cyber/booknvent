/**
 * Simple Login Test
 * Tests the new simple login endpoint with a test user
 */

const fetch = require('node-fetch');

const BASE_URL = 'https://lasavot-backend.onrender.com/api';

async function testSimpleLogin() {
    console.log('🔐 Testing Simple Login Endpoint...\n');

    // Create a test user first
    const timestamp = Date.now();
    const TEST_USER = {
        username: `simpletest${timestamp}`,
        email: `simpletest${timestamp}@example.com`,
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

        // Step 2: Test simple login
        console.log('🔑 Step 2: Testing simple login...');
        const loginResponse = await fetch(`${BASE_URL}/auth/simple-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: TEST_USER.username,
                password: TEST_USER.password
            })
        });

        const loginData = await loginResponse.json();
        console.log('Login response:', JSON.stringify(loginData, null, 2));

        if (loginResponse.ok && loginData.success && loginData.token) {
            console.log('✅ Simple login successful!');
            console.log(`🎉 Authentication system is working! User: ${loginData.user?.username}`);
            console.log(`🔑 Token received: ${loginData.token.substring(0, 20)}...`);
            return true;
        } else {
            console.log('❌ Simple login failed');
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
testSimpleLogin().then(success => {
    if (success) {
        console.log('\n🎉 Simple login test PASSED!');
        process.exit(0);
    } else {
        console.log('\n❌ Simple login test FAILED!');
        process.exit(1);
    }
});
