-- BrowserOS Default Applications Seed Data
-- Seed 001: Pre-installed system applications
-- Created: 2025-10-02

-- Insert default system applications
INSERT INTO applications (id, name, version, description, author, icon_url, manifest, published) VALUES
(
  'file-manager',
  'File Manager',
  '1.0.0',
  'Browse and manage your files and folders',
  'BrowserOS',
  '/icons/apps/file-manager.svg',
  '{
    "permissions": ["filesystem.read", "filesystem.write"],
    "window_config": {
      "default_size": {"width": 800, "height": 600},
      "min_size": {"width": 400, "height": 300},
      "resizable": true,
      "maximizable": true
    },
    "entry_point": "/apps/file-manager"
  }'::jsonb,
  true
),
(
  'text-editor',
  'Text Editor',
  '1.0.0',
  'Create and edit text files',
  'BrowserOS',
  '/icons/apps/text-editor.svg',
  '{
    "permissions": ["filesystem.read", "filesystem.write"],
    "window_config": {
      "default_size": {"width": 700, "height": 500},
      "min_size": {"width": 400, "height": 300},
      "resizable": true,
      "maximizable": true
    },
    "entry_point": "/apps/text-editor"
  }'::jsonb,
  true
),
(
  'settings',
  'Settings',
  '1.0.0',
  'Customize your BrowserOS experience',
  'BrowserOS',
  '/icons/apps/settings.svg',
  '{
    "permissions": ["settings.read", "settings.write"],
    "window_config": {
      "default_size": {"width": 900, "height": 650},
      "min_size": {"width": 600, "height": 400},
      "resizable": true,
      "maximizable": true
    },
    "entry_point": "/apps/settings"
  }'::jsonb,
  true
),
(
  'task-manager',
  'Task Manager',
  '1.0.0',
  'View and manage running applications',
  'BrowserOS',
  '/icons/apps/task-manager.svg',
  '{
    "permissions": ["system.read", "applications.manage"],
    "window_config": {
      "default_size": {"width": 700, "height": 500},
      "min_size": {"width": 500, "height": 400},
      "resizable": true,
      "maximizable": true
    },
    "entry_point": "/apps/task-manager"
  }'::jsonb,
  true
),
(
  'notes',
  'Notes',
  '1.0.0',
  'Take notes with rich text formatting',
  'BrowserOS',
  '/icons/apps/notes.svg',
  '{
    "permissions": ["notes.read", "notes.write"],
    "window_config": {
      "default_size": {"width": 600, "height": 500},
      "min_size": {"width": 400, "height": 300},
      "resizable": true,
      "maximizable": true
    },
    "entry_point": "/apps/notes"
  }'::jsonb,
  true
),
(
  'calendar',
  'Calendar',
  '1.0.0',
  'Organize your schedule and events',
  'BrowserOS',
  '/icons/apps/calendar.svg',
  '{
    "permissions": ["calendar.read", "calendar.write"],
    "window_config": {
      "default_size": {"width": 900, "height": 700},
      "min_size": {"width": 600, "height": 500},
      "resizable": true,
      "maximizable": true
    },
    "entry_point": "/apps/calendar"
  }'::jsonb,
  true
),
(
  'browser',
  'Web Browser',
  '1.0.0',
  'Browse the internet securely',
  'BrowserOS',
  '/icons/apps/browser.svg',
  '{
    "permissions": ["network.access", "filesystem.write"],
    "window_config": {
      "default_size": {"width": 1000, "height": 700},
      "min_size": {"width": 600, "height": 400},
      "resizable": true,
      "maximizable": true
    },
    "entry_point": "/apps/browser"
  }'::jsonb,
  true
);

-- Comments
COMMENT ON TABLE applications IS 'These are the default system applications available to all users';
