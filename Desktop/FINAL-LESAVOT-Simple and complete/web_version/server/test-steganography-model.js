/**
 * Test file for SteganographyOperation Model with PostgreSQL
 * 
 * Tests all CRUD operations and methods for the SteganographyOperation model
 */

require('dotenv').config();
const database = require('./utils/database');
const SteganographyOperation = require('./models/SteganographyOperation');
const User = require('./models/User');

// Test configuration
const TEST_OPERATIONS = [
  {
    operationType: 'embed',
    inputFilePath: '/uploads/test_image.png',
    fileSize: 1024000,
    message: 'This is a secret message for testing',
    password: 'testpass123',
    metadata: { quality: 95, compression: 'none', mediaType: 'image', algorithm: 'lsb' }
  },
  {
    operationType: 'extract',
    inputFilePath: '/uploads/test_audio.wav',
    fileSize: 2048000,
    password: 'testpass456',
    metadata: { sampleRate: 44100, channels: 2, mediaType: 'audio', algorithm: 'dct' }
  }
];

/**
 * Main test runner
 */
async function runSteganographyOperationModelTests() {
  console.log('🔄 Starting SteganographyOperation Model Tests...\n');
  
  try {
    // Connect to database
    await database.connect();
    await database.initializeSchema();
    
    // Run all tests
    await testOperationCreation();
    await testOperationLookupMethods();
    await testOperationStatusUpdates();
    await testOperationMetrics();
    await testOperationStatistics();
    await testOperationManagement();
    await testOperationValidation();
    await testCleanup();
    
    console.log('\n🎉 All SteganographyOperation Model tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ SteganographyOperation Model test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await database.close();
    console.log('🔌 Database connection closed');
  }
}

/**
 * Test operation creation
 */
async function testOperationCreation() {
  console.log('📝 Testing operation creation...');
  
  try {
    // Create a test user first
    const testUser = new User({
      username: 'stegtest_' + Date.now(),
      email: 'stegtest_' + Date.now() + '@lesavot.com',
      password: 'TestPassword123!'
    });
    await testUser.hashPassword(testUser.password);
    await testUser.save();
    
    for (let i = 0; i < TEST_OPERATIONS.length; i++) {
      const operationData = { ...TEST_OPERATIONS[i], userId: testUser.id };
      const operation = new SteganographyOperation(operationData);
      
      await operation.save();
      
      if (operation.id) {
        console.log(`✅ Operation ${i + 1} created with ID: ${operation.id}`);
        console.log(`   Type: ${operation.operationType}`);
        console.log(`   File: ${operation.inputFilePath}`);
        console.log(`   Size: ${operation.fileSize} bytes`);
        console.log(`   Status: ${operation.status}`);
        console.log(`   Created: ${operation.createdAt}`);

        // Store for later tests
        TEST_OPERATIONS[i].id = operation.id;
        TEST_OPERATIONS[i].userId = testUser.id;
      } else {
        throw new Error(`Failed to create operation ${i + 1}`);
      }
    }
    
    // Store test user for cleanup
    TEST_OPERATIONS.testUserId = testUser.id;
    
  } catch (error) {
    console.error('❌ Operation creation test failed:', error.message);
    throw error;
  }
}

/**
 * Test operation lookup methods
 */
async function testOperationLookupMethods() {
  console.log('\n🔍 Testing operation lookup methods...');
  
  try {
    const testOperationId = TEST_OPERATIONS[0].id;
    const testUserId = TEST_OPERATIONS[0].userId;
    
    // Test find by ID
    const foundById = await SteganographyOperation.findById(testOperationId);
    if (foundById && foundById.id === testOperationId) {
      console.log('✅ Find by ID successful');
    } else {
      throw new Error('Find by ID failed');
    }
    
    // Test find by user ID
    const userOperations = await SteganographyOperation.findByUserId(testUserId);
    if (userOperations.length >= 2) {
      console.log(`✅ Find by user ID successful (found ${userOperations.length} operations)`);
    } else {
      throw new Error('Find by user ID failed');
    }
    
    // Test find by status
    const pendingOperations = await SteganographyOperation.findByStatus('pending');
    if (pendingOperations.length >= 2) {
      console.log(`✅ Find by status successful (found ${pendingOperations.length} pending operations)`);
    } else {
      throw new Error('Find by status failed');
    }
    
    // Test non-existent operation
    const nonExistent = await SteganographyOperation.findById(99999);
    if (nonExistent === null) {
      console.log('✅ Non-existent operation lookup correctly returned null');
    } else {
      throw new Error('Non-existent operation lookup should return null');
    }
    
  } catch (error) {
    console.error('❌ Operation lookup methods test failed:', error.message);
    throw error;
  }
}

/**
 * Test operation status updates
 */
async function testOperationStatusUpdates() {
  console.log('\n🔄 Testing operation status updates...');
  
  try {
    const operation = await SteganographyOperation.findById(TEST_OPERATIONS[0].id);
    
    // Test status update to processing
    await operation.updateStatus('processing');
    if (operation.status === 'processing') {
      console.log('✅ Status updated to processing');
    } else {
      throw new Error('Failed to update status to processing');
    }
    
    // Test status update to completed with processing time
    await operation.updateStatus('completed');
    if (operation.status === 'completed' && operation.metadata.completedAt) {
      console.log('✅ Status updated to completed with completion time');
      console.log(`   Processing time: ${operation.processingTimeMs}ms`);
      console.log(`   Completed at: ${operation.metadata.completedAt}`);
    } else {
      throw new Error('Failed to update status to completed');
    }
    
    // Test status update with error
    const operation2 = await SteganographyOperation.findById(TEST_OPERATIONS[1].id);
    await operation2.updateStatus('failed', 'Test error message');
    if (operation2.status === 'failed' && operation2.errorMessage === 'Test error message') {
      console.log('✅ Status updated to failed with error message');
    } else {
      throw new Error('Failed to update status with error');
    }
    
  } catch (error) {
    console.error('❌ Operation status updates test failed:', error.message);
    throw error;
  }
}

/**
 * Test operation metrics and data updates
 */
async function testOperationMetrics() {
  console.log('\n📊 Testing operation metrics and data updates...');
  
  try {
    const operation = await SteganographyOperation.findById(TEST_OPERATIONS[0].id);

    // Test metadata update
    const testMetadata = {
      psnr: 45.2,
      mse: 0.003,
      ssim: 0.98,
      capacity: 1024
    };

    await operation.setMetadata(testMetadata);
    const updatedOperation = await SteganographyOperation.findById(operation.id);

    if (updatedOperation.metadata.psnr === 45.2) {
      console.log('✅ Metadata updated successfully');
      console.log(`   PSNR: ${updatedOperation.metadata.psnr}`);
      console.log(`   SSIM: ${updatedOperation.metadata.ssim}`);
    } else {
      throw new Error('Failed to update metadata');
    }
    
    // Test extracted message update
    await operation.setExtractedMessage('Extracted secret message');
    const operationWithMessage = await SteganographyOperation.findById(operation.id);

    if (operationWithMessage.metadata.extractedMessage === 'Extracted secret message') {
      console.log('✅ Extracted message updated successfully');
    } else {
      throw new Error('Failed to update extracted message');
    }

    // Test output file update
    await operation.setOutputFile('/uploads/output_image.png', 1050000);
    const operationWithOutput = await SteganographyOperation.findById(operation.id);

    if (operationWithOutput.outputFilePath === '/uploads/output_image.png' &&
        operationWithOutput.metadata.outputFileSize === 1050000) {
      console.log('✅ Output file information updated successfully');
      console.log(`   Output file: ${operationWithOutput.outputFilePath}`);
      console.log(`   Output size: ${operationWithOutput.metadata.outputFileSize} bytes`);
    } else {
      throw new Error('Failed to update output file information');
    }
    
  } catch (error) {
    console.error('❌ Operation metrics test failed:', error.message);
    throw error;
  }
}

/**
 * Test operation statistics
 */
async function testOperationStatistics() {
  console.log('\n📈 Testing operation statistics...');
  
  try {
    const testUserId = TEST_OPERATIONS[0].userId;
    
    // Test user statistics
    const userStats = await SteganographyOperation.getUserStats(testUserId);
    
    if (userStats.totalOperations >= 2) {
      console.log('✅ User statistics retrieved successfully');
      console.log(`   Total operations: ${userStats.totalOperations}`);
      console.log(`   Completed operations: ${userStats.completedOperations}`);
      console.log(`   Failed operations: ${userStats.failedOperations}`);
      console.log(`   Embed operations: ${userStats.embedOperations}`);
      console.log(`   Extract operations: ${userStats.extractOperations}`);
    } else {
      throw new Error('User statistics retrieval failed');
    }
    
    // Test global statistics
    const globalStats = await SteganographyOperation.getGlobalStats();
    
    if (globalStats.general.totalOperations >= 2) {
      console.log('✅ Global statistics retrieved successfully');
      console.log(`   Total operations: ${globalStats.general.totalOperations}`);
      console.log(`   Completed operations: ${globalStats.general.completedOperations}`);
      console.log(`   Failed operations: ${globalStats.general.failedOperations}`);
      console.log(`   Embed operations: ${globalStats.general.embedOperations}`);
      console.log(`   Extract operations: ${globalStats.general.extractOperations}`);
      console.log(`   Total file size processed: ${globalStats.general.totalFileSizeProcessed} bytes`);
    } else {
      throw new Error('Global statistics retrieval failed');
    }
    
  } catch (error) {
    console.error('❌ Operation statistics test failed:', error.message);
    throw error;
  }
}

/**
 * Test operation management operations
 */
async function testOperationManagement() {
  console.log('\n👥 Testing operation management operations...');
  
  try {
    const testUserId = TEST_OPERATIONS[0].userId;
    
    // Test safe object conversion
    const operation = await SteganographyOperation.findById(TEST_OPERATIONS[0].id);
    const safeObject = operation.toSafeObject();

    if (safeObject.message === '[HIDDEN]' && safeObject.password === '[HIDDEN]') {
      console.log('✅ Safe object conversion successful (sensitive data hidden)');
    } else {
      throw new Error('Safe object conversion failed');
    }

    // Test regular object conversion
    const regularObject = operation.toObject();
    if (regularObject.message && regularObject.message !== '[HIDDEN]') {
      console.log('✅ Regular object conversion successful (sensitive data visible)');
    } else {
      throw new Error('Regular object conversion failed');
    }
    
  } catch (error) {
    console.error('❌ Operation management operations test failed:', error.message);
    throw error;
  }
}

/**
 * Test operation validation and cleanup
 */
async function testOperationValidation() {
  console.log('\n⏰ Testing operation validation and cleanup...');
  
  try {
    // Test cleanup of old operations (should not delete recent ones)
    const deletedCount = await SteganographyOperation.cleanupOldOperations(30);
    console.log(`✅ Cleanup completed (${deletedCount} old operations removed)`);
    
    // Verify our test operations still exist
    const operation = await SteganographyOperation.findById(TEST_OPERATIONS[0].id);
    if (operation) {
      console.log('✅ Recent operations preserved during cleanup');
    } else {
      throw new Error('Recent operations should not be deleted during cleanup');
    }
    
  } catch (error) {
    console.error('❌ Operation validation test failed:', error.message);
    throw error;
  }
}

/**
 * Test cleanup
 */
async function testCleanup() {
  console.log('\n🧹 Testing cleanup...');
  
  try {
    let deletedCount = 0;
    
    // Delete test operations
    for (const testOp of TEST_OPERATIONS) {
      if (testOp.id) {
        const operation = await SteganographyOperation.findById(testOp.id);
        if (operation) {
          await operation.delete();
          deletedCount++;
        }
      }
    }
    
    // Delete test user
    if (TEST_OPERATIONS.testUserId) {
      const testUser = await User.findById(TEST_OPERATIONS.testUserId);
      if (testUser) {
        await testUser.delete();
      }
    }
    
    console.log(`✅ Cleaned up ${deletedCount} test operations`);
    
  } catch (error) {
    console.error('❌ Cleanup test failed:', error.message);
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runSteganographyOperationModelTests();
}

module.exports = { runSteganographyOperationModelTests };
