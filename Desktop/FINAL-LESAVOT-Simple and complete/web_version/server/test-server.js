/**
 * Test Server for Frontend-Backend Integration Testing
 * 
 * This server mocks database responses to test the authentication flow
 * without requiring a live database connection.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const app = express();

// Configure CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'https://lasavot.onrender.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());
app.use(morgan('combined'));

// Mock user data
const mockUsers = {
  'testuser': {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: '$2b$12$mockhashedpassword', // Mock bcrypt hash
    fullName: 'Test User',
    isAccountLocked: () => false,
    verifyPassword: async (password) => password === 'testpass123'
  }
};

// Mock OTP sessions
const mockOtpSessions = {};

// Generate OTP
function generateOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

// Mock JWT token generation
function generateMockToken(user) {
  return `mock-jwt-token-${user.id}-${Date.now()}`;
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Test server is running',
    database: 'mocked',
    timestamp: new Date().toISOString()
  });
});

// Sign up endpoint
app.post('/api/v1/auth/signup', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Validate input
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if user already exists
    if (mockUsers[username]) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Create mock user
    mockUsers[username] = {
      id: Object.keys(mockUsers).length + 1,
      username,
      email,
      password: `$2b$12$mock${password}hash`,
      fullName,
      isAccountLocked: () => false,
      verifyPassword: async (pass) => pass === password
    };

    console.log(`✅ Mock user created: ${username}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: mockUsers[username].id,
        username,
        email,
        fullName
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login endpoint
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { username, password, resendOtp } = req.body;

    // Validate input
    if (!username || (!password && !resendOtp)) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user
    const user = mockUsers[username];
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // For resend OTP, check if there's an active session
    if (resendOtp) {
      if (!mockOtpSessions[username]) {
        return res.status(400).json({
          success: false,
          message: 'No active OTP session found. Please login again.'
        });
      }
    } else {
      // Verify password for initial login
      const isPasswordValid = await user.verifyPassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }
    }

    // Generate OTP
    const otp = generateOTP(6);
    const expirySeconds = 300; // 5 minutes

    // Store OTP session
    mockOtpSessions[username] = {
      otp,
      expiresAt: new Date(Date.now() + expirySeconds * 1000),
      user
    };

    console.log(`📧 Mock OTP generated for ${username}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent to email. Please verify.',
      expiresIn: expirySeconds,
      requiresOtp: true,
      // For testing purposes, include the OTP in response
      testOtp: otp
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// OTP verification endpoint
app.post('/api/v1/auth/verify-otp', async (req, res) => {
  try {
    const { username, otp } = req.body;

    // Validate input
    if (!username || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Username and OTP are required'
      });
    }

    // Check OTP session
    const otpSession = mockOtpSessions[username];
    if (!otpSession) {
      return res.status(400).json({
        success: false,
        message: 'No active OTP session found'
      });
    }

    // Check if OTP is expired
    if (new Date() > otpSession.expiresAt) {
      delete mockOtpSessions[username];
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Verify OTP
    if (otpSession.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Generate tokens
    const token = generateMockToken(otpSession.user);
    const refreshToken = `refresh-${token}`;

    // Clean up OTP session
    delete mockOtpSessions[username];

    console.log(`✅ OTP verified for ${username}, tokens generated`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: otpSession.user.id,
        username: otpSession.user.username,
        email: otpSession.user.email,
        fullName: otpSession.user.fullName
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📡 CORS enabled for frontend origins`);
  console.log(`🔧 Database mocked for testing`);
  console.log(`\n📋 Test credentials:`);
  console.log(`   Username: testuser`);
  console.log(`   Password: testpass123`);
  console.log(`\n🌐 Health check: http://localhost:${PORT}/api/health`);
});
