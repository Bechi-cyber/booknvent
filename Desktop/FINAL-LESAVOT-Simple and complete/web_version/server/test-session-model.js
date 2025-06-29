/**
 * Session Model Test Script for PostgreSQL
 * 
 * This script tests the Session model with PostgreSQL database operations
 */

require('dotenv').config();
const database = require('./utils/database');
const Session = require('./models/Session');
const User = require('./models/User');

// Test configuration
const TEST_SESSIONS = [
  {
    username: 'testuser1_' + Date.now(),
    sessionType: 'otp',
    otpCode: '123456'
  },
  {
    username: 'testuser2_' + Date.now(),
    sessionType: 'auth'
    // userId will be set to null for this test
  }
];

/**
 * Main test function
 */
async function runSessionModelTests() {
  console.log('🔄 Starting Session Model Tests...\n');
  
  try {
    // Connect to database
    await database.connect();
    await database.initializeSchema();
    
    // Test 1: Session Creation
    const sessions = await testSessionCreation();
    
    // Test 2: OTP Session Operations
    await testOtpSessionOperations();
    
    // Test 3: Auth Session Operations
    await testAuthSessionOperations();
    
    // Test 4: Session Lookup Methods
    await testSessionLookupMethods(sessions[0]);
    
    // Test 5: Session Management Operations
    await testSessionManagementOperations();
    
    // Test 6: Session Validation and Expiry
    await testSessionValidationAndExpiry();
    
    // Test 7: Cleanup
    await testCleanup();
    
    console.log('\n🎉 All Session Model tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Session Model test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await database.close();
    console.log('🔌 Database connection closed');
  }
}

/**
 * Test session creation
 */
async function testSessionCreation() {
  console.log('📝 Testing session creation...');
  
  const createdSessions = [];
  
  try {
    for (let i = 0; i < TEST_SESSIONS.length; i++) {
      const sessionData = TEST_SESSIONS[i];
      sessionData.expiresAt = new Date(Date.now() + 300000); // 5 minutes from now
      
      const session = new Session(sessionData);
      
      // Save session
      const saved = await session.save();
      if (saved && session.id) {
        console.log(`✅ Session ${i + 1} created with ID: ${session.id}`);
        console.log(`   Session ID: ${session.sessionId}`);
        console.log(`   Username: ${session.username}`);
        console.log(`   Type: ${session.sessionType}`);
        console.log(`   Expires: ${session.expiresAt}`);
        createdSessions.push(session);
      } else {
        throw new Error(`Failed to create session ${i + 1}`);
      }
    }
    
    return createdSessions;
    
  } catch (error) {
    console.error('❌ Session creation test failed:', error.message);
    throw error;
  }
}

/**
 * Test OTP session operations
 */
async function testOtpSessionOperations() {
  console.log('\n🔐 Testing OTP session operations...');
  
  try {
    const username = 'otptest_' + Date.now();
    const otp = '789012';
    
    // Test OTP session creation
    const otpSession = await Session.createOtpSession(username, otp, 300);
    if (otpSession && otpSession.id) {
      console.log('✅ OTP session created successfully');
      console.log(`   Session ID: ${otpSession.sessionId}`);
      console.log(`   OTP Code: ${otpSession.otpCode}`);
    } else {
      throw new Error('Failed to create OTP session');
    }
    
    // Test OTP verification with correct code
    const verifiedSession = await Session.verifyOtp(username, otp);
    if (verifiedSession && verifiedSession.isVerified) {
      console.log('✅ OTP verification successful');
    } else {
      throw new Error('OTP verification failed');
    }
    
    // Test OTP verification with incorrect code
    const failedVerification = await Session.verifyOtp(username, '000000');
    if (!failedVerification) {
      console.log('✅ Incorrect OTP correctly rejected');
    } else {
      throw new Error('Incorrect OTP should have been rejected');
    }
    
    // Test OTP verification with already used code
    const reusedVerification = await Session.verifyOtp(username, otp);
    if (!reusedVerification) {
      console.log('✅ Already used OTP correctly rejected');
    } else {
      throw new Error('Already used OTP should have been rejected');
    }
    
  } catch (error) {
    console.error('❌ OTP session operations test failed:', error.message);
    throw error;
  }
}

/**
 * Test auth session operations
 */
async function testAuthSessionOperations() {
  console.log('\n🔑 Testing auth session operations...');

  try {
    const username = 'authtest_' + Date.now();

    // Create a test user first
    const testUser = new User({
      username: username,
      email: username + '@lesavot.com',
      password: 'TestPassword123!'
    });
    await testUser.hashPassword(testUser.password);
    await testUser.save();

    // Test auth session creation
    const authSession = await Session.createAuthSession(testUser.id, username, 24);
    if (authSession && authSession.id) {
      console.log('✅ Auth session created successfully');
      console.log(`   Session ID: ${authSession.sessionId}`);
      console.log(`   User ID: ${authSession.userId}`);
      console.log(`   Verified: ${authSession.isVerified}`);
    } else {
      throw new Error('Failed to create auth session');
    }

    // Test session validity
    if (authSession.isValid()) {
      console.log('✅ Auth session is valid');
    } else {
      throw new Error('Auth session should be valid');
    }

    // Test session extension
    const extended = await authSession.extend(48);
    if (extended) {
      console.log('✅ Auth session extended successfully');
      console.log(`   New expiry: ${authSession.expiresAt}`);
    } else {
      throw new Error('Failed to extend auth session');
    }

    // Clean up test user
    await testUser.delete();
    
  } catch (error) {
    console.error('❌ Auth session operations test failed:', error.message);
    throw error;
  }
}

/**
 * Test session lookup methods
 */
async function testSessionLookupMethods(session) {
  console.log('\n🔍 Testing session lookup methods...');
  
  try {
    // Test find by session ID
    const sessionBySessionId = await Session.findBySessionId(session.sessionId);
    if (sessionBySessionId && sessionBySessionId.id === session.id) {
      console.log('✅ Find by session ID successful');
    } else {
      throw new Error('Find by session ID failed');
    }
    
    // Test find by username
    const sessionsByUsername = await Session.findByUsername(session.username);
    if (sessionsByUsername.length > 0) {
      console.log(`✅ Find by username successful (found ${sessionsByUsername.length} sessions)`);
    } else {
      throw new Error('Find by username failed');
    }
    
    // Test find by username and type
    const sessionsByUsernameAndType = await Session.findByUsername(session.username, session.sessionType);
    if (sessionsByUsernameAndType.length > 0) {
      console.log(`✅ Find by username and type successful (found ${sessionsByUsernameAndType.length} sessions)`);
    } else {
      throw new Error('Find by username and type failed');
    }
    
    // Test find by ID
    const sessionById = await Session.findById(session.id);
    if (sessionById && sessionById.id === session.id) {
      console.log('✅ Find by ID successful');
    } else {
      throw new Error('Find by ID failed');
    }
    
    // Test non-existent session
    const nonExistentSession = await Session.findBySessionId('nonexistent_session_12345');
    if (!nonExistentSession) {
      console.log('✅ Non-existent session lookup correctly returned null');
    } else {
      throw new Error('Non-existent session lookup should return null');
    }
    
  } catch (error) {
    console.error('❌ Session lookup methods test failed:', error.message);
    throw error;
  }
}

/**
 * Test session management operations
 */
async function testSessionManagementOperations() {
  console.log('\n👥 Testing session management operations...');
  
  try {
    const username = 'mgmttest_' + Date.now();

    // Create a test user first
    const testUser = new User({
      username: username,
      email: username + '@lesavot.com',
      password: 'TestPassword123!'
    });
    await testUser.hashPassword(testUser.password);
    await testUser.save();

    // Create multiple sessions for the user
    await Session.createOtpSession(username, '111111', 300);
    await Session.createOtpSession(username, '222222', 300);
    await Session.createAuthSession(testUser.id, username, 24);
    
    // Test get active sessions count
    const activeCount = await Session.getActiveSessionsCount(username);
    if (activeCount >= 3) {
      console.log(`✅ Active sessions count: ${activeCount}`);
    } else {
      throw new Error(`Expected at least 3 active sessions, got ${activeCount}`);
    }
    
    // Test invalidate all user sessions
    const invalidatedCount = await Session.invalidateAllUserSessions(username);
    if (invalidatedCount >= 3) {
      console.log(`✅ Invalidated ${invalidatedCount} user sessions`);
    } else {
      throw new Error(`Expected to invalidate at least 3 sessions, got ${invalidatedCount}`);
    }
    
    // Verify sessions are invalidated
    const remainingCount = await Session.getActiveSessionsCount(username);
    if (remainingCount === 0) {
      console.log('✅ All user sessions successfully invalidated');
    } else {
      throw new Error(`Expected 0 remaining sessions, got ${remainingCount}`);
    }
    
    // Test safe object conversion
    const testSession = await Session.createOtpSession('safetest_' + Date.now(), '333333', 300);
    const safeObject = testSession.toSafeObject();
    if (safeObject.id && safeObject.sessionId && safeObject.username && !safeObject.otpCode) {
      console.log('✅ Safe object conversion successful (OTP code hidden)');
    } else {
      throw new Error('Safe object conversion failed');
    }

    // Clean up test user
    await testUser.delete();

  } catch (error) {
    console.error('❌ Session management operations test failed:', error.message);
    throw error;
  }
}

/**
 * Test session validation and expiry
 */
async function testSessionValidationAndExpiry() {
  console.log('\n⏰ Testing session validation and expiry...');
  
  try {
    const username = 'expirytest_' + Date.now();
    
    // Create an expired session (expires 1 second ago)
    const expiredSession = new Session({
      username,
      sessionType: 'otp',
      otpCode: '444444',
      expiresAt: new Date(Date.now() - 1000)
    });
    await expiredSession.save();
    
    // Test session validity
    if (!expiredSession.isValid()) {
      console.log('✅ Expired session correctly identified as invalid');
    } else {
      throw new Error('Expired session should be invalid');
    }
    
    // Create a test user for valid session
    const testUser = new User({
      username: username + '_valid',
      email: username + '_valid@lesavot.com',
      password: 'TestPassword123!'
    });
    await testUser.hashPassword(testUser.password);
    await testUser.save();

    // Create a valid session
    const validSession = new Session({
      username,
      sessionType: 'auth',
      userId: testUser.id,
      expiresAt: new Date(Date.now() + 300000)
    });
    await validSession.save();

    // Clean up test user
    await testUser.delete();
    
    if (validSession.isValid()) {
      console.log('✅ Valid session correctly identified as valid');
    } else {
      throw new Error('Valid session should be valid');
    }
    
    // Test cleanup of expired sessions
    const cleanedCount = await Session.cleanupExpiredSessions();
    if (cleanedCount >= 1) {
      console.log(`✅ Cleaned up ${cleanedCount} expired sessions`);
    } else {
      console.log('✅ No expired sessions to clean up');
    }
    
  } catch (error) {
    console.error('❌ Session validation and expiry test failed:', error.message);
    throw error;
  }
}

/**
 * Test cleanup
 */
async function testCleanup() {
  console.log('\n🧹 Testing cleanup...');
  
  try {
    // Clean up all test sessions
    const cleanedCount = await database.query(`
      DELETE FROM sessions 
      WHERE username LIKE '%test%' OR username LIKE '%Test%'
    `);
    
    console.log(`✅ Cleaned up ${cleanedCount.rowCount} test sessions`);
    
  } catch (error) {
    console.error('❌ Cleanup test failed:', error.message);
    throw error;
  }
}

// Run the tests
if (require.main === module) {
  runSessionModelTests();
}
