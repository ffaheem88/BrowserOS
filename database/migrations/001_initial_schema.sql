-- BrowserOS Initial Database Schema
-- Migration 001: Core Tables for Authentication and State Management
-- Created: 2025-10-02

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for session queries
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Desktop states table
CREATE TABLE desktop_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  state JSONB NOT NULL,
  last_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, version)
);

-- Create index for user desktop state lookups
CREATE INDEX idx_desktop_states_user_id ON desktop_states(user_id);
CREATE INDEX idx_desktop_states_last_saved ON desktop_states(user_id, last_saved DESC);

-- Virtual File System nodes table
CREATE TABLE vfs_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES vfs_nodes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('file', 'directory')),
  size BIGINT DEFAULT 0,
  mime_type VARCHAR(100),
  storage_key TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT unique_user_parent_name UNIQUE(user_id, parent_id, name)
);

-- Create indexes for VFS operations
CREATE INDEX idx_vfs_user_parent ON vfs_nodes(user_id, parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_vfs_storage_key ON vfs_nodes(storage_key) WHERE storage_key IS NOT NULL;
CREATE INDEX idx_vfs_type ON vfs_nodes(user_id, type) WHERE deleted_at IS NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on users
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at on vfs_nodes
CREATE TRIGGER update_vfs_nodes_updated_at BEFORE UPDATE ON vfs_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts and authentication information';
COMMENT ON TABLE sessions IS 'Active user sessions with refresh tokens';
COMMENT ON TABLE desktop_states IS 'Persisted desktop state for each user with version history';
COMMENT ON TABLE vfs_nodes IS 'Virtual file system nodes (files and directories)';

COMMENT ON COLUMN desktop_states.version IS 'Incremental version number for state history and conflict resolution';
COMMENT ON COLUMN desktop_states.state IS 'JSON blob containing complete desktop state (windows, settings, etc.)';
COMMENT ON COLUMN vfs_nodes.storage_key IS 'S3 object key for file content (null for directories)';
COMMENT ON COLUMN vfs_nodes.deleted_at IS 'Soft delete timestamp (NULL means active)';
