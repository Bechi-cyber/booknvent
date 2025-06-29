-- LESAVOT PostgreSQL Database Schema
-- This file contains the complete database schema for the LESAVOT steganography platform

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table - stores user account information
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP,
    last_login TIMESTAMP,
    password_reset_token VARCHAR(64),
    password_reset_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT users_username_length CHECK (LENGTH(username) >= 3),
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_failed_attempts_positive CHECK (failed_login_attempts >= 0)
);

-- Sessions table - handles OTP and authentication sessions
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('otp', 'auth')),
    otp_code VARCHAR(10),
    is_verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT sessions_expires_future CHECK (expires_at > created_at),
    CONSTRAINT sessions_otp_required CHECK (
        (session_type = 'otp' AND otp_code IS NOT NULL) OR 
        (session_type = 'auth' AND otp_code IS NULL)
    )
);

-- Steganography operations table - tracks all embed/extract operations
CREATE TABLE IF NOT EXISTS steganography_operations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('embed', 'extract')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    input_file_path VARCHAR(500),
    output_file_path VARCHAR(500),
    message TEXT,
    password VARCHAR(255),
    file_size BIGINT,
    processing_time_ms INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT stego_file_size_positive CHECK (file_size IS NULL OR file_size > 0),
    CONSTRAINT stego_processing_time_positive CHECK (processing_time_ms IS NULL OR processing_time_ms >= 0),
    CONSTRAINT stego_embed_message_required CHECK (
        (operation_type = 'embed' AND message IS NOT NULL) OR 
        (operation_type = 'extract')
    )
);

-- Metrics table - stores analytics and performance data
CREATE TABLE IF NOT EXISTS metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT metrics_type_not_empty CHECK (LENGTH(metric_type) > 0),
    CONSTRAINT metrics_name_not_empty CHECK (LENGTH(metric_name) > 0)
);

-- Files table - stores file metadata and references
CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT files_size_positive CHECK (file_size > 0),
    CONSTRAINT files_hash_format CHECK (LENGTH(file_hash) = 64),
    CONSTRAINT files_filename_not_empty CHECK (LENGTH(filename) > 0)
);

-- Create indexes for optimal query performance

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

-- Sessions table indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_sessions_username ON sessions(username);

-- Steganography operations indexes
CREATE INDEX IF NOT EXISTS idx_stego_user_id ON steganography_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_stego_created_at ON steganography_operations(created_at);
CREATE INDEX IF NOT EXISTS idx_stego_operation_type ON steganography_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_stego_status ON steganography_operations(status);
CREATE INDEX IF NOT EXISTS idx_stego_updated_at ON steganography_operations(updated_at);

-- Metrics table indexes
CREATE INDEX IF NOT EXISTS idx_metrics_user_id ON metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_type ON metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_metrics_type_name ON metrics(metric_type, metric_name);

-- Files table indexes
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_hash ON files(file_hash);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_mime_type ON files(mime_type);

-- Create triggers for automatic timestamp updates

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stego_updated_at 
    BEFORE UPDATE ON steganography_operations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries

-- User statistics view
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.created_at,
    u.last_login,
    COUNT(so.id) as total_operations,
    COUNT(CASE WHEN so.operation_type = 'embed' THEN 1 END) as embed_operations,
    COUNT(CASE WHEN so.operation_type = 'extract' THEN 1 END) as extract_operations,
    COUNT(CASE WHEN so.status = 'completed' THEN 1 END) as successful_operations,
    COUNT(CASE WHEN so.status = 'failed' THEN 1 END) as failed_operations,
    AVG(so.processing_time_ms) as avg_processing_time,
    SUM(so.file_size) as total_file_size_processed
FROM users u
LEFT JOIN steganography_operations so ON u.id = so.user_id
GROUP BY u.id, u.username, u.email, u.created_at, u.last_login;

-- Recent operations view
CREATE OR REPLACE VIEW recent_operations AS
SELECT 
    so.id,
    so.user_id,
    u.username,
    so.operation_type,
    so.status,
    so.file_size,
    so.processing_time_ms,
    so.created_at,
    so.updated_at
FROM steganography_operations so
JOIN users u ON so.user_id = u.id
ORDER BY so.created_at DESC;

-- System metrics view
CREATE OR REPLACE VIEW system_metrics AS
SELECT 
    metric_type,
    metric_name,
    COUNT(*) as metric_count,
    AVG(metric_value) as avg_value,
    MIN(metric_value) as min_value,
    MAX(metric_value) as max_value,
    MIN(timestamp) as first_recorded,
    MAX(timestamp) as last_recorded
FROM metrics
GROUP BY metric_type, metric_name
ORDER BY metric_type, metric_name;

COMMENT ON TABLE users IS 'User accounts and authentication information';
COMMENT ON TABLE sessions IS 'OTP and authentication session management';
COMMENT ON TABLE steganography_operations IS 'Steganography embed and extract operations';
COMMENT ON TABLE metrics IS 'Application analytics and performance metrics';
COMMENT ON TABLE files IS 'File metadata and storage references';
