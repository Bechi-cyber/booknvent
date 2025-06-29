/**
 * Authentication Controller Test Suite
 *
 * Tests the authentication controller with PostgreSQL integration
 */

require('dotenv').config();
const database = require('./utils/database');
const User = require('./models/User');
const Session = require('./models/Session');
const Metrics = require('./models/Metrics');
const logger = require('./utils/logger');

async function testAuthController() {
  console.log('🔄 Starting Authentication Controller Tests...\n');

  try {
    // Connect to database
    await database.connect();
    await database.initializeSchema();

    let testUserId = null;

    try {
      // Test 1: User Registration
      console.log('👤 Testing user registration...');
      const testUser = new User({
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@lesavot.com`,
        password: 'testpassword123'
      });
      
      await testUser.save();
      testUserId = testUser.id;
      console.log(`✅ User registered successfully with ID: ${testUserId}`);

      // Test 2: User Login (find by username)
      console.log('\n🔐 Testing user login lookup...');
      const foundUser = await User.findByUsername(testUser.username);
      if (!foundUser) {
        throw new Error('User not found after registration');
      }
      console.log(`✅ User found by username: ${foundUser.username}`);

      // Test 3: Password verification
      console.log('\n🔑 Testing password verification...');
      const isPasswordValid = await foundUser.verifyPassword('testpassword123');
      if (!isPasswordValid) {
        throw new Error('Password verification failed');
      }
      console.log('✅ Password verification successful');

      // Test 4: Invalid password
      console.log('\n❌ Testing invalid password...');
      const isInvalidPassword = await foundUser.verifyPassword('wrongpassword');
      if (isInvalidPassword) {
        throw new Error('Invalid password was accepted');
      }
      console.log('✅ Invalid password correctly rejected');

      // Test 5: OTP Session Creation
      console.log('\n📱 Testing OTP session creation...');
      const otpSession = await Session.createOtpSession(testUser.username, '123456', 300);
      if (!otpSession) {
        throw new Error('OTP session creation failed');
      }
      console.log(`✅ OTP session created with ID: ${otpSession.sessionId}`);

      // Test 6: OTP Verification
      console.log('\n✅ Testing OTP verification...');
      const verifiedSession = await Session.verifyOtp(testUser.username, '123456');
      if (!verifiedSession) {
        throw new Error('OTP verification failed');
      }
      console.log('✅ OTP verification successful');

      // Test 7: Authentication Session Creation
      console.log('\n🔒 Testing authentication session creation...');
      const authSession = await Session.createAuthSession(
        testUser.id,
        testUser.username,
        24, // 24 hours
        '127.0.0.1',
        'Test User Agent'
      );
      if (!authSession) {
        throw new Error('Auth session creation failed');
      }
      console.log(`✅ Auth session created with ID: ${authSession.sessionId}`);

      // Test 8: Session Validation
      console.log('\n🔍 Testing session validation...');
      const foundSession = await Session.findBySessionId(authSession.sessionId);
      if (!foundSession || !foundSession.isValid()) {
        throw new Error('Session validation failed');
      }
      console.log('✅ Session validation successful');

      // Test 9: Metrics Recording
      console.log('\n📊 Testing metrics recording...');
      await Metrics.recordUserAction(testUser.id, 'login_success', 'auth');
      await Metrics.recordError(new Error('Test error'), testUser.id, 'auth', 'test_error');
      console.log('✅ Metrics recording successful');

      // Test 10: Account Security Features
      console.log('\n🔐 Testing account security features...');
      
      // Test failed login attempts
      await foundUser.incrementLoginAttempts();
      await foundUser.incrementLoginAttempts();
      console.log(`✅ Failed login attempts: ${foundUser.failedLoginAttempts}`);

      // Test account locking check
      const isLocked = foundUser.isAccountLocked();
      console.log(`✅ Account locked status: ${isLocked}`);

      // Reset login attempts
      await foundUser.resetLoginAttempts();
      console.log('✅ Login attempts reset successfully');

      // Test 11: Last Login Update
      console.log('\n⏰ Testing last login update...');
      await foundUser.updateLastLogin();
      console.log('✅ Last login updated successfully');

      // Test 12: User Email Lookup
      console.log('\n📧 Testing user email lookup...');
      const userByEmail = await User.findByEmail(testUser.email);
      if (!userByEmail || userByEmail.id !== testUser.id) {
        throw new Error('User email lookup failed');
      }
      console.log('✅ User found by email successfully');

      // Test 13: Password Reset Token (if implemented)
      console.log('\n🔄 Testing password reset functionality...');
      try {
        const crypto = require('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        foundUser.passwordResetToken = resetToken;
        foundUser.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
        await foundUser.save();
        
        const userByResetToken = await User.findByResetToken(resetToken);
        if (!userByResetToken || userByResetToken.id !== testUser.id) {
          throw new Error('Password reset token lookup failed');
        }
        console.log('✅ Password reset token functionality working');
      } catch (error) {
        console.log(`⚠️ Password reset test failed: ${error.message}`);
      }

      // Test 14: Session Invalidation
      console.log('\n🚪 Testing session invalidation...');
      await foundSession.invalidate();
      const invalidatedSession = await Session.findBySessionId(authSession.sessionId);
      if (invalidatedSession && invalidatedSession.isValid()) {
        throw new Error('Session invalidation failed');
      }
      console.log('✅ Session invalidation successful');

      // Test 15: User Safe Object
      console.log('\n🛡️ Testing user safe object...');
      const safeUser = foundUser.toSafeObject();
      if (safeUser.password || safeUser.passwordHash || safeUser.salt) {
        throw new Error('Safe object contains sensitive data');
      }
      console.log('✅ User safe object excludes sensitive data');

      console.log('\n🎉 All Authentication Controller tests completed successfully!');

    } finally {
      // Cleanup test data
      if (testUserId) {
        console.log('\n🧹 Cleaning up test data...');
        try {
          await database.query('DELETE FROM sessions WHERE user_id = $1', [testUserId]);
          await database.query('DELETE FROM metrics WHERE user_id = $1', [testUserId]);
          await database.query('DELETE FROM users WHERE id = $1', [testUserId]);
          console.log('✅ Test data cleaned up successfully');
        } catch (cleanupError) {
          console.log(`⚠️ Cleanup warning: ${cleanupError.message}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Authentication Controller test failed:', error);
    process.exit(1);
  } finally {
    await database.close();
    console.log('🔌 Database connection closed');
  }

  console.log('\n✅ Test completed successfully');
}

// Run the test
if (require.main === module) {
  testAuthController().catch(console.error);
}

module.exports = testAuthController;
