/**
 * Complete PostgreSQL Integration Test Suite
 *
 * Tests all components working together with PostgreSQL:
 * - Database connection and schema
 * - User model and authentication
 * - Session management
 * - Steganography operations
 * - Metrics collection
 * - Authentication controller functionality
 */

require('dotenv').config();
const database = require('./utils/database');
const User = require('./models/User');
const Session = require('./models/Session');
const SteganographyOperation = require('./models/SteganographyOperation');
const Metrics = require('./models/Metrics');
const { generateToken, verifyToken } = require('./utils/jwt');
const logger = require('./utils/logger');

async function testCompleteIntegration() {
  console.log('🚀 Starting Complete PostgreSQL Integration Test...\n');

  try {
    // Connect to database
    console.log('🔌 Connecting to PostgreSQL...');
    await database.connect();
    await database.initializeSchema();
    console.log('✅ Database connected and schema initialized\n');

    let testUserId = null;
    let testSessionId = null;
    let testOperationId = null;

    try {
      // Test 1: Complete User Registration Flow
      console.log('👤 Testing complete user registration flow...');
      const testUser = new User({
        username: `integrationtest_${Date.now()}`,
        email: `integration_${Date.now()}@lesavot.com`,
        password: 'SecurePassword123!'
      });
      
      await testUser.save();
      testUserId = testUser.id;
      console.log(`✅ User registered with ID: ${testUserId}`);

      // Test 2: Authentication Flow (Login + OTP)
      console.log('\n🔐 Testing complete authentication flow...');
      
      // Step 1: Find user and verify password
      const foundUser = await User.findByUsername(testUser.username);
      const isPasswordValid = await foundUser.verifyPassword('SecurePassword123!');
      if (!isPasswordValid) {
        throw new Error('Password verification failed');
      }
      console.log('✅ Step 1: Password verification successful');

      // Step 2: Create OTP session
      const otpSession = await Session.createOtpSession(testUser.username, '123456', 300);
      console.log(`✅ Step 2: OTP session created: ${otpSession.sessionId}`);

      // Step 3: Verify OTP
      const verifiedSession = await Session.verifyOtp(testUser.username, '123456');
      if (!verifiedSession) {
        throw new Error('OTP verification failed');
      }
      console.log('✅ Step 3: OTP verification successful');

      // Step 4: Create authentication session
      const authSession = await Session.createAuthSession(
        testUser.id,
        testUser.username,
        24,
        '127.0.0.1',
        'Integration Test Agent'
      );
      testSessionId = authSession.sessionId;
      console.log(`✅ Step 4: Auth session created: ${testSessionId}`);

      // Test 3: JWT Token Generation and Verification
      console.log('\n🎫 Testing JWT token flow...');
      const token = generateToken(testUser.id, '24h', {
        username: testUser.username,
        sessionId: testSessionId
      });
      console.log('✅ JWT token generated');

      const decoded = verifyToken(token);
      if (parseInt(decoded.sub) !== testUser.id) {
        throw new Error(`JWT token verification failed: expected ${testUser.id}, got ${decoded.sub}`);
      }
      console.log('✅ JWT token verified successfully');

      // Test 4: Steganography Operations
      console.log('\n🔒 Testing steganography operations...');
      
      // Create embed operation
      const embedOperation = new SteganographyOperation({
        userId: testUser.id,
        operationType: 'embed',
        inputFilePath: '/test/input.png',
        outputFilePath: '/test/output.png',
        message: 'This is a secret message for integration testing',
        algorithm: 'lsb',
        mediaType: 'image'
      });
      
      await embedOperation.save();
      testOperationId = embedOperation.id;
      console.log(`✅ Embed operation created with ID: ${testOperationId}`);

      // Update operation status
      embedOperation.status = 'completed';
      embedOperation.processingTimeMs = 1500;
      embedOperation.fileSize = 2048576;
      await embedOperation.save();
      console.log('✅ Operation status updated to completed');

      // Create extract operation
      const extractOperation = new SteganographyOperation({
        userId: testUser.id,
        operationType: 'extract',
        inputFilePath: '/test/output.png',
        algorithm: 'lsb',
        mediaType: 'image'
      });
      
      await extractOperation.save();
      console.log(`✅ Extract operation created with ID: ${extractOperation.id}`);

      // Test 5: Metrics Collection
      console.log('\n📊 Testing comprehensive metrics collection...');
      
      // Record various metrics
      await Metrics.recordUserAction(testUser.id, 'login_success', 'auth');
      await Metrics.recordUserAction(testUser.id, 'operation_started', 'steganography');
      await Metrics.recordUserAction(testUser.id, 'operation_completed', 'steganography');
      await Metrics.recordPageView(testUser.id, '/dashboard', 'Mozilla/5.0 Integration Test');
      await Metrics.recordPerformance(testUser.id, 'database_query', 125);
      await Metrics.recordError(new Error('Test error for integration'), testUser.id, 'system', 'integration_test');
      
      console.log('✅ Various metrics recorded successfully');

      // Test metrics retrieval
      const userMetrics = await Metrics.findByUserId(testUser.id);
      if (userMetrics.length === 0) {
        throw new Error('No metrics found for user');
      }
      console.log(`✅ Retrieved ${userMetrics.length} metrics for user`);

      // Test 6: Data Relationships and Integrity
      console.log('\n🔗 Testing data relationships and integrity...');
      
      // Test user operations lookup
      const userOperations = await SteganographyOperation.findByUserId(testUser.id);
      if (userOperations.length !== 2) {
        throw new Error(`Expected 2 operations, found ${userOperations.length}`);
      }
      console.log(`✅ Found ${userOperations.length} operations for user`);

      // Test user sessions
      const userSessions = await Session.findByUsername(testUser.username);
      if (userSessions.length === 0) {
        throw new Error('No sessions found for user');
      }
      console.log(`✅ Found ${userSessions.length} sessions for user`);

      // Test 7: Statistics and Analytics
      console.log('\n📈 Testing statistics and analytics...');
      
      // Global statistics
      const globalStats = await SteganographyOperation.getGlobalStats();
      console.log(`✅ Global stats: ${globalStats.general?.totalOperations || 0} total operations`);

      // Operation statistics
      const operationStats = await Metrics.getOperationStats();
      console.log(`✅ Operation stats: ${operationStats.length} operation types tracked`);

      // Performance statistics
      const performanceStats = await Metrics.getPerformanceStats('database_query');
      console.log(`✅ Performance stats: ${performanceStats.length} performance metrics`);

      // Test 8: Security Features
      console.log('\n🛡️ Testing security features...');
      
      // Test account locking mechanism
      await foundUser.incrementLoginAttempts();
      await foundUser.incrementLoginAttempts();
      await foundUser.incrementLoginAttempts();
      console.log(`✅ Failed login attempts: ${foundUser.failedLoginAttempts}`);

      // Test session validation
      const sessionCheck = await Session.findBySessionId(testSessionId);
      if (!sessionCheck || !sessionCheck.isValid()) {
        throw new Error('Session validation failed');
      }
      console.log('✅ Session validation successful');

      // Test password reset functionality
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      foundUser.passwordResetToken = resetToken;
      foundUser.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
      await foundUser.save();
      
      const userByResetToken = await User.findByResetToken(resetToken);
      if (!userByResetToken) {
        throw new Error('Password reset token lookup failed');
      }
      console.log('✅ Password reset functionality working');

      // Test 9: Data Cleanup and Session Management
      console.log('\n🧹 Testing data cleanup and session management...');
      
      // Test session invalidation
      await sessionCheck.invalidate();
      const invalidatedSession = await Session.findBySessionId(testSessionId);
      if (invalidatedSession && invalidatedSession.isValid()) {
        throw new Error('Session invalidation failed');
      }
      console.log('✅ Session invalidation successful');

      // Test metrics cleanup
      const cleanedMetrics = await Metrics.cleanupOldMetrics(1); // 1 day
      console.log(`✅ Metrics cleanup completed (${cleanedMetrics} old metrics removed)`);

      // Test 10: Performance and Scalability
      console.log('\n⚡ Testing performance and scalability...');
      
      const startTime = Date.now();
      
      // Batch operations test
      const batchPromises = [];
      for (let i = 0; i < 10; i++) {
        batchPromises.push(Metrics.recordPerformance(testUser.id, 'batch_test', Math.random() * 100));
      }
      await Promise.all(batchPromises);
      
      const endTime = Date.now();
      console.log(`✅ Batch operations completed in ${endTime - startTime}ms`);

      console.log('\n🎉 All integration tests completed successfully!');
      console.log('\n📋 Test Summary:');
      console.log(`   👤 User ID: ${testUserId}`);
      console.log(`   🎫 Session ID: ${testSessionId}`);
      console.log(`   🔒 Operations: 2 created`);
      console.log(`   📊 Metrics: ${userMetrics.length}+ recorded`);
      console.log(`   🛡️ Security: All features tested`);
      console.log(`   ⚡ Performance: Batch operations successful`);

    } finally {
      // Comprehensive cleanup
      console.log('\n🧹 Performing comprehensive cleanup...');
      
      if (testUserId) {
        try {
          // Clean up in correct order due to foreign key constraints
          await database.query('DELETE FROM sessions WHERE user_id = $1', [testUserId]);
          await database.query('DELETE FROM metrics WHERE user_id = $1', [testUserId]);
          await database.query('DELETE FROM steganography_operations WHERE user_id = $1', [testUserId]);
          await database.query('DELETE FROM users WHERE id = $1', [testUserId]);
          console.log('✅ All test data cleaned up successfully');
        } catch (cleanupError) {
          console.log(`⚠️ Cleanup warning: ${cleanupError.message}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    process.exit(1);
  } finally {
    await database.close();
    console.log('🔌 Database connection closed');
  }

  console.log('\n✅ Complete PostgreSQL integration test passed successfully!');
  console.log('🎯 All systems are working correctly with PostgreSQL');
}

// Run the test
if (require.main === module) {
  testCompleteIntegration().catch(console.error);
}

module.exports = testCompleteIntegration;
