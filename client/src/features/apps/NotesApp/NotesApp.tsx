/**
 * Notes Application
 * Simple notepad for quick text notes
 */

import { useState, useEffect } from 'react';
import { AppComponentProps } from '../../../types/desktop';

export function NotesApp({ appId }: AppComponentProps) {
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved content on mount
  useEffect(() => {
    const savedContent = localStorage.getItem(`notes-${appId}-content`);
    if (savedContent) {
      setContent(savedContent);
    }
  }, [appId]);

  // Auto-save content
  useEffect(() => {
    if (content === '') return;

    const timeoutId = setTimeout(() => {
      setIsSaving(true);
      localStorage.setItem(`notes-${appId}-content`, content);
      setLastSaved(new Date());
      setIsSaving(false);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [content, appId]);

  const handleClear = () => {
    if (content && !window.confirm('Are you sure you want to clear all content?')) {
      return;
    }
    setContent('');
    localStorage.removeItem(`notes-${appId}-content`);
    setLastSaved(null);
  };

  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `note-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            Export
          </button>
        </div>

        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
          {isSaving && <span className="text-blue-600 dark:text-blue-400">Saving...</span>}
          {lastSaved && !isSaving && (
            <span>Saved at {lastSaved.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {/* Text Editor */}
      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your notes..."
          className="w-full h-full p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <span>{wordCount} words</span>
        <span>{charCount} characters</span>
      </div>
    </div>
  );
}

// App metadata for registration
export const NotesAppManifest = {
  id: 'notes',
  name: 'Notes',
  version: '1.0.0',
  description: 'Simple notepad for quick text notes',
  author: 'BrowserOS',
  icon: '📝',
  category: 'Productivity',
  permissions: [],
  windowConfig: {
    defaultSize: { width: 600, height: 500 },
    minSize: { width: 400, height: 300 },
    resizable: true,
    maximizable: true
  },
  component: NotesApp
};
