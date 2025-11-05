-- BrowserOS Application and Sharing Schema
-- Migration 002: Application system and resource sharing
-- Created: 2025-10-02

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

-- Trigger to automatically update updated_at on notes
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at on calendar_events
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at on applications
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE notes IS 'User notes with rich text content';
COMMENT ON TABLE calendar_events IS 'Calendar events and reminders';
COMMENT ON TABLE applications IS 'Available applications catalog';
COMMENT ON TABLE user_applications IS 'Applications installed by users';
COMMENT ON TABLE shared_resources IS 'Shared resources (files, notes, etc.) between users';

COMMENT ON COLUMN notes.content IS 'Rich text content stored as JSON (TipTap/ProseMirror format)';
COMMENT ON COLUMN calendar_events.recurrence IS 'Recurrence rule in JSON format';
COMMENT ON COLUMN applications.manifest IS 'Application manifest with permissions, entry points, etc.';
