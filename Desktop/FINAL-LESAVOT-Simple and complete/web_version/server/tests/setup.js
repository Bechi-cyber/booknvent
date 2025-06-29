/**
 * Test Setup (Supabase logic removed)
 *
 * This file previously set up the testing environment using Supabase.
 * All Supabase-specific logic has been removed for database-agnostic refactoring.
 */

const dotenv = require('dotenv');
const path = require('path');

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../.env.test') });

// Mock logger to prevent console output during tests
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  stream: {
    write: jest.fn()
  }
}));

// Global setup before all tests
beforeAll(async () => {
  // Placeholder: Add your test database cleanup/setup logic here
});

// Global teardown after all tests
afterAll(async () => {
  // Placeholder: Add your test database cleanup logic here
});

// Export test utilities (empty for now)
module.exports = {};
