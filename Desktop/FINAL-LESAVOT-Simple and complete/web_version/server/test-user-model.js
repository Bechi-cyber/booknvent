/**
 * User Model Test Script for PostgreSQL
 * 
 * This script tests the User model with PostgreSQL database operations
 */

require('dotenv').config();
const database = require('./utils/database');
const User = require('./models/User');

// Test configuration
const TEST_USERS = [
  {
    username: 'testuser1_' + Date.now(),
    email: 'testuser1_' + Date.now() + '@lesavot.com',
    password: 'TestPassword123!'
  },
  {
    username: 'testuser2_' + Date.now(),
    email: 'testuser2_' + Date.now() + '@lesavot.com',
    password: 'AnotherPassword456!'
  }
];

/**
 * Main test function
 */
async function runUserModelTests() {
  console.log('🔄 Starting User Model Tests...\n');
  
  try {
    // Connect to database
    await database.connect();
    await database.initializeSchema();
    
    // Test 1: User Creation
    const users = await testUserCreation();
    
    // Test 2: User Authentication
    await testUserAuthentication(users[0]);
    
    // Test 3: User Lookup Methods
    await testUserLookupMethods(users[0]);
    
    // Test 4: Login Attempts and Account Locking
    await testLoginAttemptsAndLocking(users[1]);
    
    // Test 5: User Management Operations
    await testUserManagementOperations();
    
    // Test 6: Validation and Edge Cases
    await testValidationAndEdgeCases();
    
    // Test 7: Cleanup
    await testCleanup(users);
    
    console.log('\n🎉 All User Model tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ User Model test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await database.close();
    console.log('🔌 Database connection closed');
  }
}

/**
 * Test user creation
 */
async function testUserCreation() {
  console.log('👤 Testing user creation...');
  
  const createdUsers = [];
  
  try {
    for (let i = 0; i < TEST_USERS.length; i++) {
      const userData = TEST_USERS[i];
      const user = new User(userData);
      
      // Test password hashing
      await user.hashPassword(userData.password);
      console.log(`✅ Password hashed for user ${i + 1}`);
      
      // Save user
      const saved = await user.save();
      if (saved && user.id) {
        console.log(`✅ User ${i + 1} created with ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Active: ${user.isActive}`);
        createdUsers.push(user);
      } else {
        throw new Error(`Failed to create user ${i + 1}`);
      }
    }
    
    return createdUsers;
    
  } catch (error) {
    console.error('❌ User creation test failed:', error.message);
    throw error;
  }
}

/**
 * Test user authentication
 */
async function testUserAuthentication(user) {
  console.log('\n🔐 Testing user authentication...');
  
  try {
    // Test correct password
    const correctPassword = TEST_USERS[0].password;
    const isValidCorrect = await user.verifyPassword(correctPassword);
    if (isValidCorrect) {
      console.log('✅ Correct password verification successful');
    } else {
      throw new Error('Correct password verification failed');
    }
    
    // Test incorrect password
    const incorrectPassword = 'WrongPassword123!';
    const isValidIncorrect = await user.verifyPassword(incorrectPassword);
    if (!isValidIncorrect) {
      console.log('✅ Incorrect password verification successful (correctly rejected)');
    } else {
      throw new Error('Incorrect password verification failed (should have been rejected)');
    }
    
    // Test last login update
    await user.updateLastLogin();
    console.log('✅ Last login updated successfully');
    
  } catch (error) {
    console.error('❌ User authentication test failed:', error.message);
    throw error;
  }
}

/**
 * Test user lookup methods
 */
async function testUserLookupMethods(user) {
  console.log('\n🔍 Testing user lookup methods...');
  
  try {
    // Test find by username
    const userByUsername = await User.findByUsername(user.username);
    if (userByUsername && userByUsername.id === user.id) {
      console.log('✅ Find by username successful');
    } else {
      throw new Error('Find by username failed');
    }
    
    // Test find by email
    const userByEmail = await User.findByEmail(user.email);
    if (userByEmail && userByEmail.id === user.id) {
      console.log('✅ Find by email successful');
    } else {
      throw new Error('Find by email failed');
    }
    
    // Test find by ID
    const userById = await User.findById(user.id);
    if (userById && userById.id === user.id) {
      console.log('✅ Find by ID successful');
    } else {
      throw new Error('Find by ID failed');
    }
    
    // Test non-existent user
    const nonExistentUser = await User.findByUsername('nonexistent_user_12345');
    if (!nonExistentUser) {
      console.log('✅ Non-existent user lookup correctly returned null');
    } else {
      throw new Error('Non-existent user lookup should return null');
    }
    
  } catch (error) {
    console.error('❌ User lookup methods test failed:', error.message);
    throw error;
  }
}

/**
 * Test login attempts and account locking
 */
async function testLoginAttemptsAndLocking(user) {
  console.log('\n🔒 Testing login attempts and account locking...');
  
  try {
    // Test initial state
    if (!user.isAccountLocked()) {
      console.log('✅ Account initially not locked');
    } else {
      throw new Error('Account should not be locked initially');
    }
    
    // Test incrementing login attempts
    for (let i = 1; i <= 3; i++) {
      await user.incrementLoginAttempts();
      console.log(`✅ Login attempt ${i} incremented (total: ${user.failedLoginAttempts})`);
    }
    
    // Test account not locked yet (less than 5 attempts)
    if (!user.isAccountLocked()) {
      console.log('✅ Account not locked with 3 failed attempts');
    } else {
      throw new Error('Account should not be locked with only 3 attempts');
    }
    
    // Increment to 5 attempts (should lock account)
    await user.incrementLoginAttempts();
    await user.incrementLoginAttempts();
    
    if (user.isAccountLocked()) {
      console.log('✅ Account locked after 5 failed attempts');
      console.log(`   Locked until: ${user.accountLockedUntil}`);
    } else {
      throw new Error('Account should be locked after 5 failed attempts');
    }
    
    // Test reset login attempts
    await user.resetLoginAttempts();
    if (!user.isAccountLocked() && user.failedLoginAttempts === 0) {
      console.log('✅ Login attempts reset successfully');
    } else {
      throw new Error('Login attempts reset failed');
    }
    
  } catch (error) {
    console.error('❌ Login attempts and locking test failed:', error.message);
    throw error;
  }
}

/**
 * Test user management operations
 */
async function testUserManagementOperations() {
  console.log('\n👥 Testing user management operations...');
  
  try {
    // Test get all users
    const allUsers = await User.findAll(10, 0);
    if (allUsers.length >= 2) {
      console.log(`✅ Found ${allUsers.length} users`);
    } else {
      throw new Error('Should find at least 2 test users');
    }
    
    // Test get user count
    const userCount = await User.getCount();
    if (userCount >= 2) {
      console.log(`✅ User count: ${userCount}`);
    } else {
      throw new Error('User count should be at least 2');
    }
    
    // Test username existence check
    const usernameExists = await User.usernameExists(TEST_USERS[0].username);
    if (usernameExists) {
      console.log('✅ Username existence check successful');
    } else {
      throw new Error('Username existence check failed');
    }
    
    // Test email existence check
    const emailExists = await User.emailExists(TEST_USERS[0].email);
    if (emailExists) {
      console.log('✅ Email existence check successful');
    } else {
      throw new Error('Email existence check failed');
    }
    
    // Test safe object conversion
    const user = allUsers[0];
    const safeObject = user.toSafeObject();
    if (safeObject.id && safeObject.username && !safeObject.passwordHash && !safeObject.salt) {
      console.log('✅ Safe object conversion successful');
    } else {
      throw new Error('Safe object conversion failed');
    }
    
  } catch (error) {
    console.error('❌ User management operations test failed:', error.message);
    throw error;
  }
}

/**
 * Test validation and edge cases
 */
async function testValidationAndEdgeCases() {
  console.log('\n⚠️ Testing validation and edge cases...');
  
  try {
    // Test duplicate username
    try {
      const duplicateUser = new User({
        username: TEST_USERS[0].username,
        email: 'different_' + Date.now() + '@lesavot.com',
        password: 'Password123!'
      });
      await duplicateUser.hashPassword(duplicateUser.password);
      await duplicateUser.save();
      throw new Error('Should not allow duplicate username');
    } catch (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        console.log('✅ Duplicate username correctly rejected');
      } else {
        throw error;
      }
    }
    
    // Test duplicate email
    try {
      const duplicateEmailUser = new User({
        username: 'different_' + Date.now(),
        email: TEST_USERS[0].email,
        password: 'Password123!'
      });
      await duplicateEmailUser.hashPassword(duplicateEmailUser.password);
      await duplicateEmailUser.save();
      throw new Error('Should not allow duplicate email');
    } catch (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        console.log('✅ Duplicate email correctly rejected');
      } else {
        throw error;
      }
    }
    
    // Test empty constructor
    const emptyUser = new User();
    if (emptyUser.isActive === true && emptyUser.failedLoginAttempts === 0) {
      console.log('✅ Empty constructor sets default values correctly');
    } else {
      throw new Error('Empty constructor default values incorrect');
    }
    
  } catch (error) {
    console.error('❌ Validation and edge cases test failed:', error.message);
    throw error;
  }
}

/**
 * Test cleanup
 */
async function testCleanup(users) {
  console.log('\n🧹 Testing cleanup...');
  
  try {
    let deletedCount = 0;
    for (const user of users) {
      const deleted = await user.delete();
      if (deleted) {
        deletedCount++;
        console.log(`✅ User ${user.username} deleted successfully`);
      }
    }
    
    if (deletedCount === users.length) {
      console.log(`✅ All ${deletedCount} test users cleaned up successfully`);
    } else {
      throw new Error(`Only ${deletedCount} of ${users.length} users were deleted`);
    }
    
  } catch (error) {
    console.error('❌ Cleanup test failed:', error.message);
    throw error;
  }
}

// Run the tests
if (require.main === module) {
  runUserModelTests();
}
