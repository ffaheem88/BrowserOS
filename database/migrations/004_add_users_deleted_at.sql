-- BrowserOS Users Soft Delete Support
-- Migration 004: Add deleted_at column to users table
-- Created: 2025-11-05

-- Add deleted_at column to users table for soft delete support
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;

-- Create index for active users queries (WHERE deleted_at IS NULL)
CREATE INDEX idx_users_deleted_at ON users(email) WHERE deleted_at IS NULL;

-- Comments for documentation
COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp (NULL means active user)';
