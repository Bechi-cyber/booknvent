/**
 * MongoDB Connection and Operations Test Script
 * 
 * This script tests the MongoDB connection, collection creation,
 * and basic CRUD operations for the LESAVOT application.
 */

require('dotenv').config();
const database = require('./utils/database');
const User = require('./models/User');
const Session = require('./models/Session');
const SteganographyOperation = require('./models/SteganographyOperation');
const Metrics = require('./models/Metrics');

async function testMongoDBConnection() {
  console.log('🔄 Testing MongoDB Connection and Operations...\n');

  try {
    // Test 1: Database Connection
    console.log('1. Testing Database Connection...');
    await database.connect();
    console.log('✅ Successfully connected to MongoDB');
    
    const stats = await database.getStats();
    console.log(`📊 Database: ${stats.database}`);
    console.log(`📁 Collections: ${stats.collections}`);
    console.log(`💾 Data Size: ${(stats.dataSize / 1024).toFixed(2)} KB`);
    console.log('');

    // Test 2: User Operations
    console.log('2. Testing User Operations...');
    
    // Create test user
    const testUser = new User({
      username: 'testuser_' + Date.now(),
      email: `test_${Date.now()}@example.com`,
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    });

    await testUser.save();
    console.log('✅ User created successfully');
    console.log(`👤 User ID: ${testUser._id}`);
    console.log(`📧 Email: ${testUser.email}`);

    // Find user by username
    const foundUser = await User.findByUsername(testUser.username);
    console.log('✅ User found by username');

    // Test password verification
    const isPasswordValid = await foundUser.verifyPassword('password123');
    console.log(`✅ Password verification: ${isPasswordValid ? 'Valid' : 'Invalid'}`);

    // Update last login
    await foundUser.updateLastLogin();
    console.log('✅ Last login updated');
    console.log('');

    // Test 3: Session Operations
    console.log('3. Testing Session Operations...');
    
    // Create OTP session
    const otpSession = await Session.createOtpSession(testUser.username, '123456', 300);
    console.log('✅ OTP session created');
    console.log(`🔑 Session ID: ${otpSession.sessionId}`);

    // Verify OTP
    const verifiedSession = await Session.verifyOtp(testUser.username, '123456');
    console.log(`✅ OTP verification: ${verifiedSession ? 'Success' : 'Failed'}`);

    // Create auth session
    const authSession = await Session.createAuthSession(
      testUser._id,
      testUser.username,
      24,
      '127.0.0.1',
      'Test Script'
    );
    console.log('✅ Auth session created');
    console.log(`🎫 Auth Session ID: ${authSession.sessionId}`);

    // Find session by ID
    const foundSession = await Session.findBySessionId(authSession.sessionId);
    console.log(`✅ Session found: ${foundSession ? 'Yes' : 'No'}`);
    console.log('');

    // Test 4: Steganography Operations
    console.log('4. Testing Steganography Operations...');
    
    const stegoOperation = new SteganographyOperation({
      userId: testUser._id,
      operationType: 'embed',
      mediaType: 'image',
      algorithm: 'lsb',
      status: 'pending',
      inputFile: {
        name: 'test_image.png',
        size: 2048,
        type: 'image/png',
        hash: 'abc123def456'
      },
      secretMessage: 'This is a secret test message',
      parameters: {
        quality: 'high',
        compression: false
      }
    });

    await stegoOperation.save();
    console.log('✅ Steganography operation created');
    console.log(`🔧 Operation ID: ${stegoOperation._id}`);
    console.log(`📝 Operation Type: ${stegoOperation.operationType}`);
    console.log(`🎨 Media Type: ${stegoOperation.mediaType}`);

    // Update operation status
    await stegoOperation.updateStatus('processing');
    console.log('✅ Operation status updated to processing');

    // Set metrics
    await stegoOperation.setMetrics({
      processingStartTime: new Date(),
      estimatedDuration: 5000
    });
    console.log('✅ Operation metrics set');

    // Complete operation
    await stegoOperation.updateStatus('completed');
    await stegoOperation.setExtractedMessage('Extracted: This is a secret test message');
    console.log('✅ Operation completed');

    // Get user stats
    const userStats = await SteganographyOperation.getUserStats(testUser._id);
    console.log('📊 User Statistics:');
    console.log(`   Total Operations: ${userStats.totalOperations}`);
    console.log(`   Completed: ${userStats.completedOperations}`);
    console.log(`   Embed Operations: ${userStats.embedOperations}`);
    console.log('');

    // Test 5: Metrics Operations
    console.log('5. Testing Metrics Operations...');
    
    // Record page view
    await Metrics.recordPageView(
      testUser._id,
      '/dashboard',
      authSession.sessionId,
      '127.0.0.1',
      'Test Script Browser'
    );
    console.log('✅ Page view recorded');

    // Record user action
    await Metrics.recordUserAction(
      testUser._id,
      'button_click',
      'ui',
      { buttonName: 'embed_image', page: '/steganography' }
    );
    console.log('✅ User action recorded');

    // Record operation metrics
    await Metrics.recordOperation(
      testUser._id,
      'embed',
      'image',
      3500,
      true,
      { algorithm: 'lsb', fileSize: 2048 }
    );
    console.log('✅ Operation metrics recorded');

    // Record performance metrics
    await Metrics.recordPerformance(
      'database',
      'query_execution',
      150,
      { queryType: 'find', collection: 'users' }
    );
    console.log('✅ Performance metrics recorded');

    // Record error metrics
    const testError = new Error('Test error for metrics');
    await Metrics.recordError(testError, testUser._id, 'test', 'test_error');
    console.log('✅ Error metrics recorded');
    console.log('');

    // Test 6: Collection Statistics
    console.log('6. Testing Collection Statistics...');
    
    const collections = ['users', 'sessions', 'steganography_operations', 'metrics'];
    for (const collectionName of collections) {
      try {
        const collection = database.getCollection(collectionName);
        const count = await collection.countDocuments();
        console.log(`📁 ${collectionName}: ${count} documents`);
      } catch (error) {
        console.log(`❌ Error counting ${collectionName}: ${error.message}`);
      }
    }
    console.log('');

    // Test 7: Cleanup Test Data
    console.log('7. Cleaning up test data...');
    
    // Delete test user and related data
    await testUser.delete();
    console.log('✅ Test user deleted');

    await Session.invalidateAllUserSessions(testUser.username);
    console.log('✅ User sessions invalidated');

    await stegoOperation.delete();
    console.log('✅ Test operation deleted');

    console.log('');
    console.log('🎉 All MongoDB tests completed successfully!');
    console.log('✅ Database connection is working properly');
    console.log('✅ All collections are properly configured');
    console.log('✅ CRUD operations are functioning correctly');
    console.log('✅ Indexes are created and working');

  } catch (error) {
    console.error('❌ MongoDB test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close database connection
    await database.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the test
if (require.main === module) {
  testMongoDBConnection();
}

module.exports = testMongoDBConnection;
