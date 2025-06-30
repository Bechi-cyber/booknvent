# LESAVOT Backend API

Backend API for the LESAVOT Steganography Platform built with Node.js, Express, and PostgreSQL.

## Features

- **Authentication System**: JWT-based authentication with OTP verification
- **Steganography Operations**: Save and retrieve steganography operation history
- **PostgreSQL Integration**: Full database integration with connection pooling
- **Security**: Rate limiting, CORS, helmet security headers
- **Logging**: Comprehensive logging with Winston
- **Health Checks**: Built-in health check endpoint

## Deployment on Render

### Prerequisites

1. A Render account
2. A GitHub repository with this backend code
3. PostgreSQL database (can be created on Render)

### Environment Variables Required

Set these environment variables in your Render dashboard:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=<your-postgresql-connection-string>
JWT_SECRET=<generate-a-secure-random-string>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=<your-frontend-url>
EMAIL_USER=<optional-for-otp-emails>
EMAIL_PASSWORD=<optional-for-otp-emails>
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### Render Deployment Settings

**Service Type**: Web Service
**Language**: Node
**Build Command**: `npm install`
**Start Command**: `npm start`
**Health Check Path**: `/api/health`

### Database Setup

1. Create a PostgreSQL database on Render
2. Use the connection string as your `DATABASE_URL`
3. The application will automatically initialize the database schema on startup

## API Endpoints

### Health Check
- `GET /api/health` - Health check endpoint

### Authentication
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/login` - User login (sends OTP)
- `POST /api/v1/auth/verify-otp` - Verify OTP and get JWT token
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/refresh-token` - Refresh JWT token
- `POST /api/v1/auth/logout` - User logout

### Steganography Operations
- `POST /api/v1/steganography/history` - Save steganography operation
- `GET /api/v1/steganography/history` - Get user's operation history

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env` file

3. Start development server:
   ```bash
   npm run dev
   ```

## Testing

Run the integration tests:
```bash
node test-frontend-backend-integration.js
```

## Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User accounts
- `sessions` - User sessions
- `steganography_operations` - Operation history
- `metrics` - Application metrics
