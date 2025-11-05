/**
 * State Persistence Hooks
 * Handles auto-save to backend with optimistic updates and conflict resolution
 */

import { useEffect, useRef, useCallback } from 'react';

interface PersistenceOptions {
  key: string;
  debounceMs?: number;
  onSave?: (data: any) => Promise<void>;
  onLoad?: () => Promise<any>;
  onError?: (error: Error) => void;
}

/**
 * Hook to persist state with debouncing and auto-save
 */
export function usePersistence<T>(
  state: T,
  options: PersistenceOptions
) {
  const {
    key,
    debounceMs = 2000,
    onSave,
    onLoad,
    onError
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const lastSavedRef = useRef<string | null>(null);

  // Save to localStorage immediately (for quick recovery)
  const saveToLocalStorage = useCallback((data: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [key]);

  // Load from localStorage
  const loadFromLocalStorage = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }, [key]);

  // Save to backend
  const saveToBackend = useCallback(async (data: T) => {
    if (isSavingRef.current || !onSave) return;

    const dataString = JSON.stringify(data);
    if (dataString === lastSavedRef.current) return;

    try {
      isSavingRef.current = true;
      await onSave(data);
      lastSavedRef.current = dataString;
    } catch (error) {
      console.error('Failed to save to backend:', error);
      onError?.(error as Error);
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, onError]);

  // Debounced save
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Save to localStorage immediately
    saveToLocalStorage(state);

    // Debounce backend save
    timeoutRef.current = setTimeout(() => {
      saveToBackend(state);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state, debounceMs, saveToLocalStorage, saveToBackend]);

  // Load on mount
  useEffect(() => {
    const loadData = async () => {
      if (onLoad) {
        try {
          await onLoad();
        } catch (error) {
          console.error('Failed to load from backend:', error);
          onError?.(error as Error);
        }
      }
    };

    loadData();
  }, [onLoad, onError]);

  return {
    save: () => saveToBackend(state),
    load: loadFromLocalStorage
  };
}

/**
 * Hook for optimistic updates with rollback on error
 */
export function useOptimisticUpdate<T>(
  updateFn: (data: T) => Promise<void>,
  onError?: (error: Error, rollback: () => void) => void
) {
  const previousStateRef = useRef<T | null>(null);

  const execute = useCallback(async (newState: T, setState: (state: T) => void) => {
    // Save previous state for rollback
    previousStateRef.current = newState;

    // Optimistically update
    setState(newState);

    try {
      // Attempt backend update
      await updateFn(newState);
    } catch (error) {
      // Rollback on error
      const rollback = () => {
        if (previousStateRef.current) {
          setState(previousStateRef.current);
        }
      };

      console.error('Optimistic update failed:', error);
      onError?.(error as Error, rollback);
      rollback();
    }
  }, [updateFn, onError]);

  return execute;
}

/**
 * Hook for conflict resolution
 */
export function useConflictResolution<T>(
  localVersion: number,
  remoteVersion: number,
  localData: T,
  remoteData: T,
  strategy: 'local' | 'remote' | 'merge' | 'prompt' = 'prompt'
) {
  useEffect(() => {
    if (localVersion === remoteVersion) return;

    const hasConflict = localVersion !== remoteVersion;
    if (!hasConflict) return;

    console.warn('Data conflict detected:', {
      localVersion,
      remoteVersion,
      strategy
    });

    switch (strategy) {
      case 'local':
        console.log('Using local version');
        break;
      case 'remote':
        console.log('Using remote version');
        break;
      case 'merge':
        console.log('Attempting to merge changes');
        // Merge logic would go here
        break;
      case 'prompt':
        console.log('Prompting user for resolution');
        // User prompt would go here
        break;
    }
  }, [localVersion, remoteVersion, localData, remoteData, strategy]);
}

/**
 * Hook for periodic sync with backend
 */
export function usePeriodicSync(
  syncFn: () => Promise<void>,
  intervalMs: number = 60000 // Default: 1 minute
) {
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        await syncFn();
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [syncFn, intervalMs]);
}

/**
 * Hook to track if data is syncing
 */
export function useSyncStatus() {
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastSyncTime, setLastSyncTime] = React.useState<Date | null>(null);
  const [syncError, setSyncError] = React.useState<Error | null>(null);

  const startSync = useCallback(() => {
    setIsSyncing(true);
    setSyncError(null);
  }, []);

  const endSync = useCallback((error?: Error) => {
    setIsSyncing(false);
    setLastSyncTime(new Date());
    if (error) {
      setSyncError(error);
    }
  }, []);

  return {
    isSyncing,
    lastSyncTime,
    syncError,
    startSync,
    endSync
  };
}

// Import React for useSyncStatus
import React from 'react';
