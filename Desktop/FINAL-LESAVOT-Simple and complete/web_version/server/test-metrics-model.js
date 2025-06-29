/**
 * Test script for Metrics Model with PostgreSQL
 */

const database = require('./utils/database');
const Metrics = require('./models/Metrics');
const User = require('./models/User');

async function testMetricsModel() {
  let testUserId = null;

  try {
    console.log('🔄 Starting Metrics Model Tests...\n');

    // Connect to database
    await database.connect();
    await database.initializeSchema();

    // Create a test user for foreign key constraints
    console.log('👤 Creating test user...');
    const testUser = new User({
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@lesavot.com`,
      password: 'testpassword123'
    });
    await testUser.save();
    testUserId = testUser.id;
    console.log(`✅ Test user created with ID: ${testUserId}\n`);

    // Test 1: Record page view
    console.log('📄 Testing page view recording...');
    const pageView = await Metrics.recordPageView(
      testUserId, // userId
      '/dashboard',
      'session123',
      '192.168.1.1',
      'Mozilla/5.0 Test Browser',
      'https://google.com'
    );
    console.log('✅ Page view recorded successfully');
    console.log(`   ID: ${pageView.id}`);
    console.log(`   URL: ${pageView.metadata.url}`);
    console.log(`   User Agent: ${pageView.metadata.userAgent}`);

    // Test 2: Record user action
    console.log('\n👤 Testing user action recording...');
    const userAction = await Metrics.recordUserAction(
      testUserId, // userId
      'button_click',
      'ui',
      { buttonId: 'embed-btn', page: '/steganography' },
      'session123'
    );
    console.log('✅ User action recorded successfully');
    console.log(`   ID: ${userAction.id}`);
    console.log(`   Action: ${userAction.metricName}`);
    console.log(`   Category: ${userAction.metadata.category}`);

    // Test 3: Record operation metrics
    console.log('\n⚙️ Testing operation metrics recording...');
    const operation = await Metrics.recordOperation(
      testUserId, // userId
      'embed',
      'image',
      2500, // duration in ms
      true,
      { algorithm: 'lsb', fileSize: 1024000 }
    );
    console.log('✅ Operation metrics recorded successfully');
    console.log(`   ID: ${operation.id}`);
    console.log(`   Operation: ${operation.metricName}`);
    console.log(`   Duration: ${operation.metricValue}ms`);
    console.log(`   Success: ${operation.metadata.success}`);

    // Test 4: Record performance metrics
    console.log('\n⚡ Testing performance metrics recording...');
    const performance = await Metrics.recordPerformance(
      'api',
      'database_query',
      150, // duration in ms
      { query: 'SELECT * FROM users', rows: 5 }
    );
    console.log('✅ Performance metrics recorded successfully');
    console.log(`   ID: ${performance.id}`);
    console.log(`   Action: ${performance.metricName}`);
    console.log(`   Duration: ${performance.metricValue}ms`);

    // Test 5: Record error metrics
    console.log('\n❌ Testing error metrics recording...');
    const testError = new Error('Test database connection failed');
    testError.name = 'DatabaseError';
    const errorMetric = await Metrics.recordError(
      testError,
      testUserId, // userId
      'database',
      'connection_error',
      { connectionString: 'postgresql://...' }
    );
    console.log('✅ Error metrics recorded successfully');
    console.log(`   ID: ${errorMetric.id}`);
    console.log(`   Error: ${errorMetric.metadata.errorName}`);
    console.log(`   Message: ${errorMetric.metadata.errorMessage}`);

    // Test 6: Find metrics by ID
    console.log('\n🔍 Testing metrics lookup...');
    const foundMetric = await Metrics.findById(pageView.id);
    if (foundMetric && foundMetric.id === pageView.id) {
      console.log('✅ Find by ID successful');
      console.log(`   Found metric type: ${foundMetric.metricType}`);
    } else {
      throw new Error('Find by ID failed');
    }

    // Test 7: Find metrics by user ID
    console.log('\n👥 Testing user metrics lookup...');
    const userMetrics = await Metrics.findByUserId(testUserId, 10);
    if (userMetrics.length >= 4) {
      console.log('✅ Find by user ID successful');
      console.log(`   Found ${userMetrics.length} metrics for user`);
    } else {
      throw new Error('Find by user ID failed');
    }

    // Test 8: Get user activity
    console.log('\n📊 Testing user activity stats...');
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    const endDate = new Date();
    const activity = await Metrics.getUserActivity(testUserId, startDate, endDate);
    console.log('✅ User activity retrieved successfully');
    console.log(`   Activity records: ${activity.length}`);
    if (activity.length > 0) {
      console.log(`   Sample: ${activity[0].metric_type} - ${activity[0].count} occurrences`);
    }

    // Test 9: Get operation stats
    console.log('\n📈 Testing operation statistics...');
    const opStats = await Metrics.getOperationStats(startDate, endDate);
    console.log('✅ Operation statistics retrieved successfully');
    console.log(`   Operation types: ${opStats.length}`);
    if (opStats.length > 0) {
      console.log(`   Sample: ${opStats[0].operation_type} - ${opStats[0].count} operations`);
    }

    // Test 10: Get page view stats
    console.log('\n📄 Testing page view statistics...');
    const pageStats = await Metrics.getPageViewStats(startDate, endDate);
    console.log('✅ Page view statistics retrieved successfully');
    console.log(`   Pages tracked: ${pageStats.length}`);
    if (pageStats.length > 0) {
      console.log(`   Sample: ${pageStats[0].url} - ${pageStats[0].views} views`);
    }

    // Test 11: Get error stats
    console.log('\n🚨 Testing error statistics...');
    const errorStats = await Metrics.getErrorStats(startDate, endDate);
    console.log('✅ Error statistics retrieved successfully');
    console.log(`   Error types: ${errorStats.length}`);
    if (errorStats.length > 0) {
      console.log(`   Sample: ${errorStats[0].error_name} - ${errorStats[0].count} occurrences`);
    }

    // Test 12: Get performance stats
    console.log('\n⚡ Testing performance statistics...');
    const perfStats = await Metrics.getPerformanceStats('api', startDate, endDate);
    console.log('✅ Performance statistics retrieved successfully');
    console.log(`   Performance metrics: ${perfStats.length}`);
    if (perfStats.length > 0) {
      console.log(`   Sample: ${perfStats[0].action} - avg ${perfStats[0].avg_duration}ms`);
    }

    // Test 13: Object conversion
    console.log('\n🔄 Testing object conversion...');
    const obj = pageView.toObject();
    if (obj.id && obj.metricType && obj.metadata) {
      console.log('✅ Object conversion successful');
      console.log(`   Object keys: ${Object.keys(obj).join(', ')}`);
    } else {
      throw new Error('Object conversion failed');
    }

    // Test 14: Cleanup test (don't actually delete recent data)
    console.log('\n🧹 Testing cleanup functionality...');
    const cleanedCount = await Metrics.cleanupOldMetrics(365); // Only very old data
    console.log(`✅ Cleanup completed (${cleanedCount} old metrics removed)`);

    console.log('\n🎉 All Metrics Model tests completed successfully!');

  } catch (error) {
    console.error('❌ Metrics Model test failed:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  } finally {
    // Clean up test user
    if (testUserId) {
      try {
        await database.query('DELETE FROM users WHERE id = $1', [testUserId]);
        console.log('🧹 Test user cleaned up');
      } catch (cleanupError) {
        console.error('⚠️ Failed to clean up test user:', cleanupError.message);
      }
    }

    // Close database connection
    await database.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  testMetricsModel()
    .then(() => {
      console.log('\n✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = testMetricsModel;
