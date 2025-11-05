-- BrowserOS Desktop State Schema
-- Migration 003: Desktop state persistence with window management
-- Created: 2025-10-06

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

-- Performance indexes for desktop_states
-- Primary lookup: by user_id (covered by UNIQUE constraint index)
CREATE INDEX idx_desktop_states_user_id ON desktop_states(user_id);

-- Performance indexes for window_states
-- Most common query: get all windows for a user's desktop
CREATE INDEX idx_window_states_desktop ON window_states(desktop_state_id);
CREATE INDEX idx_window_states_user ON window_states(user_id);

-- Query optimization: find focused window quickly
CREATE INDEX idx_window_states_focused ON window_states(user_id, focused)
  WHERE focused = TRUE;

-- Query optimization: z-index ordering for window layering
CREATE INDEX idx_window_states_zindex ON window_states(desktop_state_id, z_index);

-- Query optimization: find windows by app_id
CREATE INDEX idx_window_states_app ON window_states(user_id, app_id);

-- Trigger to automatically update updated_at on desktop_states
CREATE TRIGGER update_desktop_states_updated_at BEFORE UPDATE ON desktop_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at on window_states
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

-- Function to cleanup orphaned focused windows
-- Ensures only one window can be focused per user
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

-- Comments for documentation
COMMENT ON TABLE desktop_states IS 'User desktop configuration with version control for optimistic locking';
COMMENT ON TABLE window_states IS 'Individual window positions and states for user sessions';

COMMENT ON COLUMN desktop_states.version IS 'Version number for optimistic locking - increments on each update';
COMMENT ON COLUMN desktop_states.settings IS 'Additional user settings stored as JSON (language, notifications, etc.)';
COMMENT ON COLUMN window_states.app_state IS 'Application-specific state data (scroll position, form data, etc.)';
COMMENT ON COLUMN window_states.z_index IS 'Window stacking order - higher numbers appear on top';
COMMENT ON COLUMN window_states.focused IS 'Whether this window currently has focus (only one per user)';

-- Sample data for testing (optional - remove in production)
-- This will be useful for development but should be removed or commented out in production migrations
COMMENT ON COLUMN desktop_states.pinned_apps IS 'Array of app IDs pinned to taskbar';
