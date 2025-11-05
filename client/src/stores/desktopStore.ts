/**
 * Desktop Store
 * Manages desktop state including wallpaper, theme, icons, and taskbar configuration
 */

import { create } from 'zustand';
import { DesktopIcon, TaskbarConfig, DesktopState } from '../types/desktop';

interface DesktopStore extends DesktopState {
  // Actions
  setWallpaper: (url: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  addIcon: (icon: DesktopIcon) => void;
  removeIcon: (id: string) => void;
  updateIconPosition: (id: string, position: { x: number; y: number }) => void;
  updateTaskbarConfig: (config: Partial<TaskbarConfig>) => void;

  // Persistence
  loadDesktopState: () => Promise<void>;
  saveDesktopState: () => Promise<void>;

  // Reset
  resetDesktop: () => void;

  // Internal state
  _saveTimeout: NodeJS.Timeout | null;
}

// Default state
const getDefaultState = (): DesktopState => ({
  wallpaper: '/assets/wallpapers/default.jpg',
  theme: 'dark',
  icons: [],
  taskbar: {
    position: 'bottom',
    autohide: false,
    pinnedApps: ['file-manager', 'text-editor', 'settings']
  },
  loading: false,
  error: null
});

// Helper to debounce saves
let saveTimeout: NodeJS.Timeout | null = null;

export const useDesktopStore = create<DesktopStore>((set, get) => ({
  ...getDefaultState(),
  _saveTimeout: null,

  // Set wallpaper with auto-save
  setWallpaper: (url: string) => {
    set({ wallpaper: url });
    scheduleAutoSave(get);
  },

  // Set theme with auto-save
  setTheme: (theme: 'light' | 'dark') => {
    set({ theme });
    scheduleAutoSave(get);

    // Apply theme to document
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    }
  },

  // Toggle theme
  toggleTheme: () => {
    const currentTheme = get().theme;
    get().setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  },

  // Add desktop icon
  addIcon: (icon: DesktopIcon) => {
    set((state) => ({
      icons: [...state.icons, icon]
    }));
    scheduleAutoSave(get);
  },

  // Remove desktop icon
  removeIcon: (id: string) => {
    set((state) => ({
      icons: state.icons.filter((icon) => icon.id !== id)
    }));
    scheduleAutoSave(get);
  },

  // Update icon position
  updateIconPosition: (id: string, position: { x: number; y: number }) => {
    set((state) => ({
      icons: state.icons.map((icon) =>
        icon.id === id ? { ...icon, position } : icon
      )
    }));
    scheduleAutoSave(get);
  },

  // Update taskbar configuration
  updateTaskbarConfig: (config: Partial<TaskbarConfig>) => {
    set((state) => ({
      taskbar: { ...state.taskbar, ...config }
    }));
    scheduleAutoSave(get);
  },

  // Load desktop state from storage
  loadDesktopState: async () => {
    set({ loading: true, error: null });

    try {
      // Try localStorage first for immediate load
      const cached = localStorage.getItem('desktopState');
      if (cached) {
        const state = JSON.parse(cached);
        set({
          ...state,
          loading: false
        });

        // Apply theme to document
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(state.theme || 'dark');
        }
      } else {
        set({ loading: false });
      }

      // Fetch from backend API for latest state
      const { desktopService } = await import('../services');
      const response = await desktopService.getDesktopState();

      if (response.state) {
        set({
          wallpaper: response.state.wallpaper,
          theme: response.state.theme,
          taskbar: response.state.taskbar,
          loading: false
        });

        // Update localStorage cache
        localStorage.setItem('desktopState', JSON.stringify(response.state));

        // Apply theme again if needed
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(response.state.theme || 'dark');
        }
      }
      // const response = await fetch('/api/desktop/state');
      // const data = await response.json();
      // set({ ...data, loading: false });

    } catch (error) {
      console.error('Failed to load desktop state:', error);
      set({
        error: 'Failed to load desktop state',
        loading: false
      });
    }
  },

  // Save desktop state
  saveDesktopState: async () => {
    try {
      const state = get();
      const stateToSave = {
        wallpaper: state.wallpaper,
        theme: state.theme,
        icons: state.icons,
        taskbar: state.taskbar
      };

      // Save to localStorage immediately for offline-first approach
      localStorage.setItem('desktopState', JSON.stringify(stateToSave));

      // Sync with backend API
      try {
        const { desktopService } = await import('../services');
        await desktopService.saveDesktopState({
          wallpaper: state.wallpaper,
          theme: state.theme,
          taskbar: state.taskbar,
        });
      } catch (apiError) {
        // Silently fail API sync - localStorage is the source of truth
        console.warn('Failed to sync desktop state with backend:', apiError);
      }

    } catch (error) {
      console.error('Failed to save desktop state:', error);
      set({ error: 'Failed to save desktop state' });
    }
  },

  // Reset to default state
  resetDesktop: () => {
    set(getDefaultState());
    localStorage.removeItem('desktopState');
  }
}));

// Helper function to schedule auto-save with debouncing
function scheduleAutoSave(get: () => DesktopStore) {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    get().saveDesktopState();
  }, 2000); // 2 second debounce
}

// Initialize desktop state on module load
if (typeof window !== 'undefined') {
  useDesktopStore.getState().loadDesktopState();
}
