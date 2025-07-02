/**
 * Basic Authentication Test
 * Tests signup and login functionality without OTP
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

// Generate unique test user data
const timestamp = Date.now();
const TEST_USER = {
    username: `basictest${timestamp}`,
    email: `basictest${timestamp}@example.com`,
    password: 'TestPassword123!'
};

async function testBasicAuth() {
    console.log('🔐 Starting Basic Authentication Test...\n');

    try {
        // Step 1: Register user
        console.log('📝 Step 1: Registering test user...');
        const registerResponse = await fetch(`${BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(TEST_USER)
        });

        const registerData = await registerResponse.json();
        console.log('Register Response:', registerData);

        if (!registerData.success) {
            throw new Error(`Registration failed: ${registerData.message}`);
        }
        console.log('✅ User registered successfully\n');

        // Step 2: Login with correct credentials
        console.log('🔑 Step 2: Testing login with correct credentials...');
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: TEST_USER.username,
                password: TEST_USER.password
            })
        });

        const loginData = await loginResponse.json();
        console.log('Login Response:', loginData);

        if (!loginData.success) {
            throw new Error(`Login failed: ${loginData.message}`);
        }
        console.log('✅ Login successful\n');

        // Step 3: Test JWT token with protected route
        if (loginData.token) {
            console.log('🎫 Step 3: Testing JWT token with protected route...');
            const protectedResponse = await fetch(`${BASE_URL}/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${loginData.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const protectedData = await protectedResponse.json();
            console.log('Protected Route Response:', protectedData);

            if (protectedData.status === 'error') {
                throw new Error(`JWT token invalid: ${protectedData.message}`);
            }
            console.log('✅ JWT token is valid and working\n');
        }

        // Step 4: Test login with wrong password
        console.log('❌ Step 4: Testing login with wrong password...');
        const wrongPasswordResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: TEST_USER.username,
                password: 'WrongPassword123!'
            })
        });

        const wrongPasswordData = await wrongPasswordResponse.json();
        console.log('Wrong Password Response:', wrongPasswordData);

        if (wrongPasswordData.success) {
            throw new Error('Login should have failed with wrong password');
        }
        console.log('✅ Wrong password correctly rejected\n');

        console.log('🎉 All Basic Authentication Tests Passed!');
        console.log('✅ User registration works correctly');
        console.log('✅ User login works correctly');
        console.log('✅ JWT token authentication works correctly');
        console.log('✅ Wrong password is correctly rejected');

    } catch (error) {
        console.error('❌ Basic Authentication Test Failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testBasicAuth();
