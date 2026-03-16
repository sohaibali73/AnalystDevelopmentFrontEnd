/**
 * SSR-safe storage utility for localStorage/sessionStorage access
 */

import { logger } from './logger';

type StorageType = 'local' | 'session';

/**
 * Check if storage is available
 */
function isStorageAvailable(type: StorageType): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const storage = type === 'local' ? window.localStorage : window.sessionStorage;
    const testKey = '__storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    logger.warn(`${type}Storage is not available`, { error });
    return false;
  }
}

/**
 * Get storage instance
 */
function getStorage(type: StorageType): Storage | null {
  if (!isStorageAvailable(type)) {
    return null;
  }
  return type === 'local' ? window.localStorage : window.sessionStorage;
}

/**
 * SSR-safe localStorage wrapper
 */
export const storage = {
  /**
   * Get item from localStorage
   */
  getItem(key: string, type: StorageType = 'local'): string | null {
    const storage = getStorage(type);
    if (!storage) return null;

    try {
      return storage.getItem(key);
    } catch (error) {
      logger.error(`Failed to get item from ${type}Storage`, error, { key });
      return null;
    }
  },

  /**
   * Set item in localStorage
   */
  setItem(key: string, value: string, type: StorageType = 'local'): boolean {
    const storage = getStorage(type);
    if (!storage) return false;

    try {
      storage.setItem(key, value);
      return true;
    } catch (error) {
      logger.error(`Failed to set item in ${type}Storage`, error, { key });
      return false;
    }
  },

  /**
   * Remove item from localStorage
   */
  removeItem(key: string, type: StorageType = 'local'): boolean {
    const storage = getStorage(type);
    if (!storage) return false;

    try {
      storage.removeItem(key);
      return true;
    } catch (error) {
      logger.error(`Failed to remove item from ${type}Storage`, error, { key });
      return false;
    }
  },

  /**
   * Clear all items from localStorage
   */
  clear(type: StorageType = 'local'): boolean {
    const storage = getStorage(type);
    if (!storage) return false;

    try {
      storage.clear();
      return true;
    } catch (error) {
      logger.error(`Failed to clear ${type}Storage`, error);
      return false;
    }
  },

  /**
   * Get parsed JSON item from localStorage
   */
  getJSON<T>(key: string, type: StorageType = 'local'): T | null {
    const item = this.getItem(key, type);
    if (!item) return null;

    try {
      return JSON.parse(item) as T;
    } catch (error) {
      logger.error(`Failed to parse JSON from ${type}Storage`, error, { key });
      return null;
    }
  },

  /**
   * Set JSON item in localStorage
   */
  setJSON<T>(key: string, value: T, type: StorageType = 'local'): boolean {
    try {
      const json = JSON.stringify(value);
      return this.setItem(key, json, type);
    } catch (error) {
      logger.error(`Failed to stringify JSON for ${type}Storage`, error, { key });
      return false;
    }
  },
};

/**
 * Hook-friendly storage for React components
 */
export function useStorage() {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => false,
      removeItem: () => false,
      clear: () => false,
      getJSON: () => null,
      setJSON: () => false,
    };
  }

  return storage;
}
