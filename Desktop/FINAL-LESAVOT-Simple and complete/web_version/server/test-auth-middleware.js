/**
 * Test Authentication Middleware
 */

require('dotenv').config();
const { protect } = require('./middleware/auth');
const { generateToken } = require('./utils/jwt');

// Mock request and response objects
function createMockReq(token = null) {
  return {
    headers: {
      authorization: token ? `Bearer ${token}` : undefined
    }
  };
}

function createMockRes() {
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.responseData = data;
      return this;
    },
    statusCode: 200,
    responseData: null
  };
  return res;
}

function createMockNext() {
  let called = false;
  let error = null;
  
  const next = function(err) {
    called = true;
    error = err;
  };
  
  next.wasCalled = () => called;
  next.getError = () => error;
  
  return next;
}

async function testAuthMiddleware() {
  console.log('🔍 Testing Authentication Middleware...\n');
  
  // Test 1: No token
  console.log('Test 1: No authorization header');
  const req1 = createMockReq();
  const res1 = createMockRes();
  const next1 = createMockNext();
  
  await protect(req1, res1, next1);
  
  if (res1.statusCode === 401) {
    console.log('✅ Correctly rejected request without token');
  } else {
    console.log('❌ Failed to reject request without token');
    console.log('   Status:', res1.statusCode);
    console.log('   Response:', res1.responseData);
  }
  
  // Test 2: Invalid token
  console.log('\nTest 2: Invalid token');
  const req2 = createMockReq('invalid-token');
  const res2 = createMockRes();
  const next2 = createMockNext();
  
  await protect(req2, res2, next2);
  
  if (res2.statusCode === 401) {
    console.log('✅ Correctly rejected invalid token');
  } else {
    console.log('❌ Failed to reject invalid token');
    console.log('   Status:', res2.statusCode);
    console.log('   Response:', res2.responseData);
  }
  
  // Test 3: Valid token (but user might not exist)
  console.log('\nTest 3: Valid token format');
  try {
    const validToken = generateToken(999, '1h', { username: 'testuser' });
    const req3 = createMockReq(validToken);
    const res3 = createMockRes();
    const next3 = createMockNext();
    
    await protect(req3, res3, next3);
    
    if (res3.statusCode === 401 && res3.responseData && res3.responseData.message.includes('user belonging to this token does no longer exist')) {
      console.log('✅ Correctly handled valid token with non-existent user');
    } else if (next3.wasCalled() && !next3.getError()) {
      console.log('✅ Successfully authenticated user');
      console.log('   User:', req3.user ? req3.user.username : 'No user set');
    } else {
      console.log('❌ Unexpected response for valid token');
      console.log('   Status:', res3.statusCode);
      console.log('   Response:', res3.responseData);
      console.log('   Next called:', next3.wasCalled());
      console.log('   Next error:', next3.getError());
    }
  } catch (error) {
    console.log('❌ Error generating or testing valid token:', error.message);
  }
  
  console.log('\n🏁 Authentication middleware test completed');
}

// Run the test
testAuthMiddleware().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
