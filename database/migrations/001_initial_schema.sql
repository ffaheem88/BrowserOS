-- BrowserOS Complete Initial Database Schema
-- Migration 001: Consolidated schema for all tables
-- Created: 2025-11-05
-- Consolidates: original migrations 001, 002, 003, and 004

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS AND AUTHENTICATION
-- ============================================================================

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
  deleted_at TIMESTAMP,
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes on email for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(email) WHERE deleted_at IS NULL;

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

-- ============================================================================
-- DESKTOP STATE AND WINDOW MANAGEMENT
-- ============================================================================

-- Desktop state table
-- Stores overall desktop configuration per user with optimistic locking
CREATE TABLE desktop_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  wallpaper VARCHAR(500) DEFAULT '/assets/wallpapers/default.jpg',
  theme VARCHAR(20) NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  taskbar_position VARCHAR(20) NOT NULL DEFAULT 'bottom' CHECK (taskbar_position IN ('top', 'bottom', 'left', 'right')),
  taskbar_autohide BOOLEAN DEFAULT FALSE,
  pinned_apps TEXT[] DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Ensure one desktop state per user
  UNIQUE(user_id)
);

-- Performance indexes for desktop_states
CREATE INDEX idx_desktop_states_user_id ON desktop_states(user_id);

-- Window states table
-- Stores individual window positions and states with optimistic locking
CREATE TABLE window_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  desktop_state_id UUID NOT NULL REFERENCES desktop_states(id) ON DELETE CASCADE,
  app_id VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  -- Position and size stored as composite types
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  -- Window state
  state VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (state IN ('normal', 'minimized', 'maximized', 'fullscreen')),
  z_index INTEGER NOT NULL DEFAULT 0,
  focused BOOLEAN DEFAULT FALSE,
  resizable BOOLEAN DEFAULT TRUE,
  movable BOOLEAN DEFAULT TRUE,
  -- Application-specific state (for app data persistence)
  app_state JSONB DEFAULT '{}',
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes for window_states
CREATE INDEX idx_window_states_desktop ON window_states(desktop_state_id);
CREATE INDEX idx_window_states_user ON window_states(user_id);
CREATE INDEX idx_window_states_focused ON window_states(user_id, focused) WHERE focused = TRUE;
CREATE INDEX idx_window_states_zindex ON window_states(desktop_state_id, z_index);
CREATE INDEX idx_window_states_app ON window_states(user_id, app_id);

-- ============================================================================
-- VIRTUAL FILE SYSTEM
-- ============================================================================

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

-- ============================================================================
-- APPLICATIONS
-- ============================================================================

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content JSONB NOT NULL,
  category VARCHAR(50),
  tags TEXT[],
  color VARCHAR(7),
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Create indexes for notes
CREATE INDEX idx_notes_user_id ON notes(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notes_category ON notes(user_id, category) WHERE deleted_at IS NULL;
CREATE INDEX idx_notes_pinned ON notes(user_id, pinned) WHERE deleted_at IS NULL AND pinned = TRUE;
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);

-- Calendar events table
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  reminder INTEGER,
  recurrence JSONB,
  color VARCHAR(7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for calendar queries
CREATE INDEX idx_calendar_user_time ON calendar_events(user_id, start_time);
CREATE INDEX idx_calendar_time_range ON calendar_events(start_time, end_time);

-- Applications catalog table
CREATE TABLE applications (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL,
  description TEXT,
  author VARCHAR(100),
  icon_url TEXT,
  manifest JSONB NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for published apps
CREATE INDEX idx_applications_published ON applications(published) WHERE published = TRUE;

-- User installed applications table
CREATE TABLE user_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_id VARCHAR(50) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  settings JSONB DEFAULT '{}',
  UNIQUE(user_id, app_id)
);

-- Create index for user apps
CREATE INDEX idx_user_applications_user_id ON user_applications(user_id);

-- ============================================================================
-- RESOURCE SHARING
-- ============================================================================

-- Shared resources table
CREATE TABLE shared_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(20) NOT NULL CHECK (permission IN ('read', 'write', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(resource_type, resource_id, shared_with_user_id)
);

-- Create indexes for sharing lookups
CREATE INDEX idx_shared_resources ON shared_resources(resource_type, resource_id);
CREATE INDEX idx_shared_with_user ON shared_resources(shared_with_user_id);
CREATE INDEX idx_shared_owner ON shared_resources(owner_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vfs_nodes_updated_at BEFORE UPDATE ON vfs_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_desktop_states_updated_at BEFORE UPDATE ON desktop_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_window_states_updated_at BEFORE UPDATE ON window_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to increment version on desktop_states update (optimistic locking)
CREATE OR REPLACE FUNCTION increment_desktop_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_desktop_version_trigger BEFORE UPDATE ON desktop_states
  FOR EACH ROW EXECUTE FUNCTION increment_desktop_version();

-- Function to ensure only one window can be focused per user
CREATE OR REPLACE FUNCTION ensure_single_focused_window()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.focused = TRUE THEN
    -- Unfocus all other windows for this user
    UPDATE window_states
    SET focused = FALSE
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND focused = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_focused_window_trigger
  BEFORE INSERT OR UPDATE ON window_states
  FOR EACH ROW
  WHEN (NEW.focused = TRUE)
  EXECUTE FUNCTION ensure_single_focused_window();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DOCUMENTATION COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts and authentication information';
COMMENT ON TABLE sessions IS 'Active user sessions with refresh tokens';
COMMENT ON TABLE desktop_states IS 'User desktop configuration with version control for optimistic locking';
COMMENT ON TABLE window_states IS 'Individual window positions and states for user sessions';
COMMENT ON TABLE vfs_nodes IS 'Virtual file system nodes (files and directories)';
COMMENT ON TABLE notes IS 'User notes with rich text content';
COMMENT ON TABLE calendar_events IS 'Calendar events and reminders';
COMMENT ON TABLE applications IS 'Available applications catalog';
COMMENT ON TABLE user_applications IS 'Applications installed by users';
COMMENT ON TABLE shared_resources IS 'Shared resources (files, notes, etc.) between users';

COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp (NULL means active user)';
COMMENT ON COLUMN desktop_states.version IS 'Version number for optimistic locking - increments on each update';
COMMENT ON COLUMN desktop_states.settings IS 'Additional user settings stored as JSON (language, notifications, etc.)';
COMMENT ON COLUMN desktop_states.pinned_apps IS 'Array of app IDs pinned to taskbar';
COMMENT ON COLUMN window_states.app_state IS 'Application-specific state data (scroll position, form data, etc.)';
COMMENT ON COLUMN window_states.z_index IS 'Window stacking order - higher numbers appear on top';
COMMENT ON COLUMN window_states.focused IS 'Whether this window currently has focus (only one per user)';
COMMENT ON COLUMN vfs_nodes.storage_key IS 'S3 object key for file content (null for directories)';
COMMENT ON COLUMN vfs_nodes.deleted_at IS 'Soft delete timestamp (NULL means active)';
COMMENT ON COLUMN notes.content IS 'Rich text content stored as JSON (TipTap/ProseMirror format)';
COMMENT ON COLUMN calendar_events.recurrence IS 'Recurrence rule in JSON format';
COMMENT ON COLUMN applications.manifest IS 'Application manifest with permissions, entry points, etc.';
