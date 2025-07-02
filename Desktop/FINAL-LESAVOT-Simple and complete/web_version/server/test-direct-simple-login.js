/**
 * Direct Simple Login Test
 * Tests the simple login endpoint directly with minimal setup
 */

const fetch = require('node-fetch');

async function testDirectSimpleLogin() {
    console.log('🔐 Testing Simple Login Endpoint Directly...\n');

    const BASE_URL = 'https://lasavot-backend.onrender.com/api';
    
    // Test with a simple request
    try {
        console.log('🔑 Testing simple login endpoint availability...');
        const response = await fetch(`${BASE_URL}/auth/simple-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'testuser',
                password: 'testpass'
            })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('Response body:', responseText);

        try {
            const data = JSON.parse(responseText);
            console.log('Parsed JSON:', JSON.stringify(data, null, 2));
        } catch (e) {
            console.log('Response is not JSON');
        }

        if (response.status === 404) {
            console.log('❌ Simple login endpoint not found - route may not be deployed yet');
        } else if (response.status === 401) {
            console.log('✅ Simple login endpoint exists and correctly rejects invalid credentials');
        } else {
            console.log(`ℹ️ Unexpected status: ${response.status}`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

// Run the test
testDirectSimpleLogin();
