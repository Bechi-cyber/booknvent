/**
 * Database Integration Tests
 * 
 * Tests MongoDB connection, collections, and CRUD operations
 */

const database = require('../utils/database');
const User = require('../models/User');
const Session = require('../models/Session');
const SteganographyOperation = require('../models/SteganographyOperation');
const Metrics = require('../models/Metrics');

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    process.env.MONGODB_DB_NAME = 'lesavot_test_db';
    await database.connect();
  });

  afterAll(async () => {
    // Clean up test database
    if (database.isConnectedToDatabase()) {
      const collections = ['users', 'sessions', 'steganography_operations', 'metrics', 'history', 'files'];
      for (const collectionName of collections) {
        try {
          const collection = database.getCollection(collectionName);
          await collection.deleteMany({});
        } catch (error) {
          console.warn(`Could not clean collection ${collectionName}:`, error.message);
        }
      }
      await database.close();
    }
  });

  describe('Database Connection', () => {
    test('should connect to MongoDB', async () => {
      expect(database.isConnectedToDatabase()).toBe(true);
    });

    test('should get database statistics', async () => {
      const stats = await database.getStats();
      expect(stats).toHaveProperty('database');
      expect(stats).toHaveProperty('collections');
      expect(stats.database).toBe('lesavot_test_db');
    });
  });

  describe('User Model Tests', () => {
    let testUser;

    test('should create a new user', async () => {
      testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });

      const result = await testUser.save();
      expect(result).toBe(true);
      expect(testUser._id).toBeDefined();
    });

    test('should find user by username', async () => {
      const foundUser = await User.findByUsername('testuser');
      expect(foundUser).toBeTruthy();
      expect(foundUser.email).toBe('test@example.com');
      expect(foundUser.firstName).toBe('Test');
    });

    test('should find user by email', async () => {
      const foundUser = await User.findByEmail('test@example.com');
      expect(foundUser).toBeTruthy();
      expect(foundUser.username).toBe('testuser');
    });

    test('should verify password', async () => {
      const user = await User.findByUsername('testuser');
      const isValid = await user.verifyPassword('password123');
      expect(isValid).toBe(true);
      
      const isInvalid = await user.verifyPassword('wrongpassword');
      expect(isInvalid).toBe(false);
    });

    test('should update last login', async () => {
      const user = await User.findByUsername('testuser');
      const oldLastLogin = user.lastLogin;
      
      await user.updateLastLogin();
      
      const updatedUser = await User.findByUsername('testuser');
      expect(updatedUser.lastLogin).not.toBe(oldLastLogin);
    });

    test('should handle login attempts', async () => {
      const user = await User.findByUsername('testuser');
      
      await user.incrementLoginAttempts();
      const updatedUser = await User.findByUsername('testuser');
      expect(updatedUser.securitySettings.loginAttempts).toBe(1);
      
      await user.resetLoginAttempts();
      const resetUser = await User.findByUsername('testuser');
      expect(resetUser.securitySettings.loginAttempts).toBe(0);
    });
  });

  describe('Session Model Tests', () => {
    let testSession;

    test('should create OTP session', async () => {
      testSession = await Session.createOtpSession('testuser', '123456', 300);
      expect(testSession).toBeTruthy();
      expect(testSession.sessionType).toBe('otp');
      expect(testSession.data.otp).toBe('123456');
    });

    test('should verify OTP', async () => {
      const session = await Session.verifyOtp('testuser', '123456');
      expect(session).toBeTruthy();
      expect(session.username).toBe('testuser');
    });

    test('should create auth session', async () => {
      const user = await User.findByUsername('testuser');
      const authSession = await Session.createAuthSession(
        user._id,
        user.username,
        24,
        '127.0.0.1',
        'Test User Agent'
      );
      
      expect(authSession).toBeTruthy();
      expect(authSession.sessionType).toBe('auth');
      expect(authSession.userId.toString()).toBe(user._id.toString());
    });

    test('should find session by session ID', async () => {
      const user = await User.findByUsername('testuser');
      const authSession = await Session.createAuthSession(user._id, user.username, 1);
      
      const foundSession = await Session.findBySessionId(authSession.sessionId);
      expect(foundSession).toBeTruthy();
      expect(foundSession.sessionId).toBe(authSession.sessionId);
    });

    test('should invalidate session', async () => {
      const user = await User.findByUsername('testuser');
      const authSession = await Session.createAuthSession(user._id, user.username, 1);
      
      await authSession.invalidate();
      
      const foundSession = await Session.findBySessionId(authSession.sessionId);
      expect(foundSession).toBe(null);
    });
  });

  describe('SteganographyOperation Model Tests', () => {
    let testOperation;
    let testUser;

    beforeAll(async () => {
      testUser = await User.findByUsername('testuser');
    });

    test('should create steganography operation', async () => {
      testOperation = new SteganographyOperation({
        userId: testUser._id,
        operationType: 'embed',
        mediaType: 'image',
        algorithm: 'lsb',
        inputFile: {
          name: 'test.png',
          size: 1024,
          type: 'image/png'
        },
        secretMessage: 'This is a secret message'
      });

      const result = await testOperation.save();
      expect(result).toBe(true);
      expect(testOperation._id).toBeDefined();
    });

    test('should find operations by user ID', async () => {
      const operations = await SteganographyOperation.findByUserId(testUser._id);
      expect(operations).toHaveLength(1);
      expect(operations[0].operationType).toBe('embed');
    });

    test('should update operation status', async () => {
      await testOperation.updateStatus('completed');
      
      const updatedOperation = await SteganographyOperation.findById(testOperation._id);
      expect(updatedOperation.status).toBe('completed');
      expect(updatedOperation.completedAt).toBeDefined();
    });

    test('should get user statistics', async () => {
      const stats = await SteganographyOperation.getUserStats(testUser._id);
      expect(stats.totalOperations).toBe(1);
      expect(stats.completedOperations).toBe(1);
      expect(stats.embedOperations).toBe(1);
    });
  });

  describe('Metrics Model Tests', () => {
    let testUser;

    beforeAll(async () => {
      testUser = await User.findByUsername('testuser');
    });

    test('should record page view', async () => {
      const metric = await Metrics.recordPageView(
        testUser._id,
        '/dashboard',
        'session123',
        '127.0.0.1',
        'Test User Agent'
      );
      
      expect(metric).toBeTruthy();
      expect(metric.metricType).toBe('page_view');
      expect(metric.url).toBe('/dashboard');
    });

    test('should record user action', async () => {
      const metric = await Metrics.recordUserAction(
        testUser._id,
        'button_click',
        'ui',
        { buttonName: 'embed' }
      );
      
      expect(metric).toBeTruthy();
      expect(metric.metricType).toBe('user_action');
      expect(metric.action).toBe('button_click');
    });

    test('should record operation metrics', async () => {
      const metric = await Metrics.recordOperation(
        testUser._id,
        'embed',
        'image',
        1500,
        true,
        { algorithm: 'lsb' }
      );
      
      expect(metric).toBeTruthy();
      expect(metric.metricType).toBe('operation');
      expect(metric.duration).toBe(1500);
    });

    test('should record error metrics', async () => {
      const error = new Error('Test error');
      const metric = await Metrics.recordError(error, testUser._id, 'api', 'test_error');
      
      expect(metric).toBeTruthy();
      expect(metric.metricType).toBe('error');
      expect(metric.data.errorMessage).toBe('Test error');
    });
  });
});
