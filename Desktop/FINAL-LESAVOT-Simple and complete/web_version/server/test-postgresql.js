/**
 * PostgreSQL Connection and Database Test Script
 * 
 * This script tests the PostgreSQL connection, schema creation,
 * and basic CRUD operations for the LESAVOT application.
 */

require('dotenv').config();
const database = require('./utils/database');
const bcrypt = require('bcrypt');

// Test configuration
const TEST_CONFIG = {
  testUser: {
    username: 'testuser_' + Date.now(),
    email: 'test_' + Date.now() + '@lesavot.com',
    password: 'TestPassword123!'
  },
  testMessage: 'This is a test steganography message for PostgreSQL testing.',
  saltRounds: 12
};

/**
 * Main test function
 */
async function runTests() {
  console.log('🔄 Starting PostgreSQL Database Tests...\n');
  
  try {
    // Test 1: Database Connection
    await testDatabaseConnection();
    
    // Test 2: Schema Initialization
    await testSchemaInitialization();
    
    // Test 3: User Operations
    const userId = await testUserOperations();
    
    // Test 4: Session Operations
    await testSessionOperations(userId);
    
    // Test 5: Steganography Operations
    await testSteganographyOperations(userId);
    
    // Test 6: Metrics Operations
    await testMetricsOperations(userId);
    
    // Test 7: File Operations
    await testFileOperations(userId);
    
    // Test 8: Database Statistics
    await testDatabaseStats();
    
    // Test 9: Cleanup
    await testCleanup(userId);
    
    console.log('\n🎉 All PostgreSQL tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await database.close();
    console.log('🔌 Database connection closed');
  }
}

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  console.log('📡 Testing database connection...');
  
  try {
    await database.connect();
    console.log('✅ Database connection successful');
    
    // Test basic query
    const result = await database.query('SELECT NOW() as current_time, version() as pg_version');
    console.log(`✅ Query test successful - Time: ${result.rows[0].current_time}`);
    console.log(`✅ PostgreSQL version: ${result.rows[0].pg_version.split(' ')[0]}`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

/**
 * Test schema initialization
 */
async function testSchemaInitialization() {
  console.log('\n🏗️ Testing schema initialization...');
  
  try {
    // Check if tables exist
    const tablesResult = await database.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const expectedTables = ['users', 'sessions', 'steganography_operations', 'metrics', 'files'];
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    console.log(`✅ Found ${existingTables.length} tables:`, existingTables);
    
    // Check if all expected tables exist
    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        throw new Error(`Table '${table}' is missing`);
      }
    }
    
    // Check indexes
    const indexesResult = await database.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY tablename, indexname
    `);
    
    console.log(`✅ Found ${indexesResult.rows.length} indexes`);
    
  } catch (error) {
    console.error('❌ Schema initialization test failed:', error.message);
    throw error;
  }
}

/**
 * Test user operations (CRUD)
 */
async function testUserOperations() {
  console.log('\n👤 Testing user operations...');
  
  try {
    // Create test user
    const salt = await bcrypt.genSalt(TEST_CONFIG.saltRounds);
    const passwordHash = await bcrypt.hash(TEST_CONFIG.testUser.password, salt);
    
    const insertResult = await database.query(`
      INSERT INTO users (username, email, password_hash, salt)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, created_at
    `, [TEST_CONFIG.testUser.username, TEST_CONFIG.testUser.email, passwordHash, salt]);
    
    const userId = insertResult.rows[0].id;
    console.log(`✅ User created with ID: ${userId}`);
    console.log(`✅ Username: ${insertResult.rows[0].username}`);
    console.log(`✅ Email: ${insertResult.rows[0].email}`);
    
    // Read user
    const selectResult = await database.query(`
      SELECT id, username, email, is_active, failed_login_attempts, created_at
      FROM users WHERE id = $1
    `, [userId]);
    
    if (selectResult.rows.length === 1) {
      console.log('✅ User read successfully');
      console.log(`✅ User is active: ${selectResult.rows[0].is_active}`);
    } else {
      throw new Error('User not found after creation');
    }
    
    // Update user
    await database.query(`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, failed_login_attempts = 0
      WHERE id = $1
    `, [userId]);
    
    console.log('✅ User updated successfully');
    
    // Verify password
    const userResult = await database.query(`
      SELECT password_hash FROM users WHERE id = $1
    `, [userId]);
    
    const isValidPassword = await bcrypt.compare(TEST_CONFIG.testUser.password, userResult.rows[0].password_hash);
    if (isValidPassword) {
      console.log('✅ Password verification successful');
    } else {
      throw new Error('Password verification failed');
    }
    
    return userId;
    
  } catch (error) {
    console.error('❌ User operations test failed:', error.message);
    throw error;
  }
}

/**
 * Test session operations
 */
async function testSessionOperations(userId) {
  console.log('\n🔐 Testing session operations...');
  
  try {
    // Create OTP session
    const otpSessionId = 'otp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    const otpResult = await database.query(`
      INSERT INTO sessions (session_id, user_id, username, session_type, otp_code, expires_at)
      VALUES ($1, $2, $3, 'otp', $4, $5)
      RETURNING id, session_id, session_type
    `, [otpSessionId, userId, TEST_CONFIG.testUser.username, otpCode, expiresAt]);
    
    console.log(`✅ OTP session created: ${otpResult.rows[0].session_id}`);
    console.log(`✅ OTP code: ${otpCode}`);
    
    // Verify OTP session
    const verifyResult = await database.query(`
      SELECT id, otp_code, expires_at, is_verified
      FROM sessions 
      WHERE session_id = $1 AND session_type = 'otp'
    `, [otpSessionId]);
    
    if (verifyResult.rows.length === 1 && verifyResult.rows[0].otp_code === otpCode) {
      console.log('✅ OTP session verification successful');
    } else {
      throw new Error('OTP session verification failed');
    }
    
    // Mark OTP as verified
    await database.query(`
      UPDATE sessions 
      SET is_verified = true 
      WHERE session_id = $1
    `, [otpSessionId]);
    
    // Create auth session
    const authSessionId = 'auth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const authExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    await database.query(`
      INSERT INTO sessions (session_id, user_id, username, session_type, expires_at, is_verified)
      VALUES ($1, $2, $3, 'auth', $4, true)
    `, [authSessionId, userId, TEST_CONFIG.testUser.username, authExpiresAt]);
    
    console.log(`✅ Auth session created: ${authSessionId}`);
    
    // Clean up expired sessions (simulate)
    const cleanupResult = await database.query(`
      DELETE FROM sessions 
      WHERE expires_at < CURRENT_TIMESTAMP
    `);
    
    console.log(`✅ Cleaned up ${cleanupResult.rowCount} expired sessions`);
    
  } catch (error) {
    console.error('❌ Session operations test failed:', error.message);
    throw error;
  }
}

/**
 * Test steganography operations
 */
async function testSteganographyOperations(userId) {
  console.log('\n🖼️ Testing steganography operations...');
  
  try {
    // Create embed operation
    const embedResult = await database.query(`
      INSERT INTO steganography_operations 
      (user_id, operation_type, status, input_file_path, message, file_size, metadata)
      VALUES ($1, 'embed', 'pending', '/test/input.png', $2, 1024000, $3)
      RETURNING id, operation_type, status, created_at
    `, [userId, TEST_CONFIG.testMessage, JSON.stringify({ test: true, algorithm: 'LSB' })]);
    
    const embedId = embedResult.rows[0].id;
    console.log(`✅ Embed operation created with ID: ${embedId}`);
    
    // Update operation status to processing
    await database.query(`
      UPDATE steganography_operations 
      SET status = 'processing', output_file_path = '/test/output.png'
      WHERE id = $1
    `, [embedId]);
    
    // Complete the operation
    const processingTime = Math.floor(Math.random() * 5000) + 1000; // 1-6 seconds
    await database.query(`
      UPDATE steganography_operations 
      SET status = 'completed', processing_time_ms = $1
      WHERE id = $2
    `, [processingTime, embedId]);
    
    console.log(`✅ Embed operation completed in ${processingTime}ms`);
    
    // Create extract operation
    const extractResult = await database.query(`
      INSERT INTO steganography_operations 
      (user_id, operation_type, status, input_file_path, file_size)
      VALUES ($1, 'extract', 'completed', '/test/output.png', 1024000)
      RETURNING id, operation_type
    `, [userId]);
    
    console.log(`✅ Extract operation created with ID: ${extractResult.rows[0].id}`);
    
    // Query user's operations
    const userOpsResult = await database.query(`
      SELECT operation_type, status, COUNT(*) as count
      FROM steganography_operations 
      WHERE user_id = $1
      GROUP BY operation_type, status
      ORDER BY operation_type, status
    `, [userId]);
    
    console.log('✅ User operations summary:');
    userOpsResult.rows.forEach(row => {
      console.log(`   ${row.operation_type} (${row.status}): ${row.count}`);
    });
    
  } catch (error) {
    console.error('❌ Steganography operations test failed:', error.message);
    throw error;
  }
}

/**
 * Test metrics operations
 */
async function testMetricsOperations(userId) {
  console.log('\n📊 Testing metrics operations...');

  try {
    // Record various metrics
    const metrics = [
      { type: 'page_view', name: 'home_page', value: 1 },
      { type: 'page_view', name: 'embed_page', value: 1 },
      { type: 'user_action', name: 'file_upload', value: 1 },
      { type: 'operation', name: 'embed_success', value: 1 },
      { type: 'performance', name: 'processing_time', value: 2500 },
      { type: 'error', name: 'file_too_large', value: 1 }
    ];

    for (const metric of metrics) {
      await database.query(`
        INSERT INTO metrics (user_id, metric_type, metric_name, metric_value, metadata)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, metric.type, metric.name, metric.value, JSON.stringify({ test: true })]);
    }

    console.log(`✅ Recorded ${metrics.length} metrics`);

    // Query metrics summary
    const summaryResult = await database.query(`
      SELECT metric_type, COUNT(*) as count, AVG(metric_value) as avg_value
      FROM metrics
      WHERE user_id = $1
      GROUP BY metric_type
      ORDER BY metric_type
    `, [userId]);

    console.log('✅ Metrics summary:');
    summaryResult.rows.forEach(row => {
      console.log(`   ${row.metric_type}: ${row.count} records, avg: ${parseFloat(row.avg_value).toFixed(2)}`);
    });

    // Test system-wide metrics (without user filter)
    await database.query(`
      INSERT INTO metrics (metric_type, metric_name, metric_value, metadata)
      VALUES ('system', 'total_users', 1, '{"test": true}')
    `);

    console.log('✅ System metrics recorded');

  } catch (error) {
    console.error('❌ Metrics operations test failed:', error.message);
    throw error;
  }
}

/**
 * Test file operations
 */
async function testFileOperations(userId) {
  console.log('\n📁 Testing file operations...');

  try {
    // Create test file records
    const files = [
      {
        filename: 'test_image_' + Date.now() + '.png',
        originalName: 'my_secret_image.png',
        filePath: '/uploads/images/test_image.png',
        fileSize: 1024000,
        fileHash: 'a'.repeat(64), // 64-character hash
        mimeType: 'image/png'
      },
      {
        filename: 'test_audio_' + Date.now() + '.wav',
        originalName: 'secret_audio.wav',
        filePath: '/uploads/audio/test_audio.wav',
        fileSize: 2048000,
        fileHash: 'b'.repeat(64),
        mimeType: 'audio/wav'
      }
    ];

    const fileIds = [];
    for (const file of files) {
      const result = await database.query(`
        INSERT INTO files (user_id, filename, original_name, file_path, file_size, file_hash, mime_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, filename
      `, [userId, file.filename, file.originalName, file.filePath, file.fileSize, file.fileHash, file.mimeType]);

      fileIds.push(result.rows[0].id);
      console.log(`✅ File created: ${result.rows[0].filename} (ID: ${result.rows[0].id})`);
    }

    // Query user's files
    const userFilesResult = await database.query(`
      SELECT filename, original_name, file_size, mime_type, created_at
      FROM files
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    console.log(`✅ User has ${userFilesResult.rows.length} files:`);
    userFilesResult.rows.forEach(file => {
      console.log(`   ${file.original_name} (${file.mime_type}) - ${file.file_size} bytes`);
    });

    // Test file hash lookup
    const hashResult = await database.query(`
      SELECT id, filename FROM files WHERE file_hash = $1
    `, ['a'.repeat(64)]);

    if (hashResult.rows.length > 0) {
      console.log(`✅ File hash lookup successful: ${hashResult.rows[0].filename}`);
    }

  } catch (error) {
    console.error('❌ File operations test failed:', error.message);
    throw error;
  }
}

/**
 * Test database statistics
 */
async function testDatabaseStats() {
  console.log('\n📈 Testing database statistics...');

  try {
    const stats = await database.getStats();

    console.log('✅ Database statistics:');
    console.log(`   Database: ${stats.database}`);
    console.log(`   Database size: ${stats.database_size}`);
    console.log(`   Tables: ${stats.tables.length}`);

    stats.tables.forEach(table => {
      console.log(`     ${table.tablename}: ${table.size}`);
    });

    console.log('✅ Connection pool stats:');
    console.log(`   Total connections: ${stats.pool_stats.total_count}`);
    console.log(`   Idle connections: ${stats.pool_stats.idle_count}`);
    console.log(`   Waiting connections: ${stats.pool_stats.waiting_count}`);

    console.log('✅ Active connections:');
    console.log(`   Total: ${stats.connections.total_connections}`);
    console.log(`   Active: ${stats.connections.active_connections}`);
    console.log(`   Idle: ${stats.connections.idle_connections}`);

  } catch (error) {
    console.error('❌ Database statistics test failed:', error.message);
    throw error;
  }
}

/**
 * Test cleanup - remove test data
 */
async function testCleanup(userId) {
  console.log('\n🧹 Testing cleanup operations...');

  try {
    // Delete in correct order due to foreign key constraints
    const metricsResult = await database.query('DELETE FROM metrics WHERE user_id = $1', [userId]);
    console.log(`✅ Deleted ${metricsResult.rowCount} metrics records`);

    const filesResult = await database.query('DELETE FROM files WHERE user_id = $1', [userId]);
    console.log(`✅ Deleted ${filesResult.rowCount} file records`);

    const stegoResult = await database.query('DELETE FROM steganography_operations WHERE user_id = $1', [userId]);
    console.log(`✅ Deleted ${stegoResult.rowCount} steganography operations`);

    const sessionsResult = await database.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    console.log(`✅ Deleted ${sessionsResult.rowCount} session records`);

    const userResult = await database.query('DELETE FROM users WHERE id = $1', [userId]);
    console.log(`✅ Deleted ${userResult.rowCount} user record`);

    // Clean up system metrics
    const systemMetricsResult = await database.query('DELETE FROM metrics WHERE metric_type = $1', ['system']);
    console.log(`✅ Deleted ${systemMetricsResult.rowCount} system metrics`);

  } catch (error) {
    console.error('❌ Cleanup test failed:', error.message);
    throw error;
  }
}

// Run the tests
if (require.main === module) {
  runTests();
}
