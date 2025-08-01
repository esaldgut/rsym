/**
 * Secure session management utilities for YAAN authentication
 * Handles local storage, cookies, and session persistence securely
 */

import { UserType } from '../hooks/useAuth';

// Storage keys
const STORAGE_KEYS = {
  USER_PREFERENCES: 'yaan_user_preferences',
  LAST_VISIT: 'yaan_last_visit',
  ONBOARDING_COMPLETED: 'yaan_onboarding_completed',
  THEME_PREFERENCE: 'yaan_theme_preference',
} as const;

// User preferences interface
export interface UserPreferences {
  language: 'es' | 'en';
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  userType?: UserType;
}

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'es',
  theme: 'system',
  emailNotifications: true,
  pushNotifications: true,
  marketingEmails: false,
};

// Utility functions for safe localStorage access
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

const safeGetItem = (key: string): string | null => {
  if (!isLocalStorageAvailable()) return null;
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`Failed to get item from localStorage: ${key}`, e);
    return null;
  }
};

const safeSetItem = (key: string, value: string): boolean => {
  if (!isLocalStorageAvailable()) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`Failed to set item in localStorage: ${key}`, e);
    return false;
  }
};

const safeRemoveItem = (key: string): boolean => {
  if (!isLocalStorageAvailable()) return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn(`Failed to remove item from localStorage: ${key}`, e);
    return false;
  }
};

// User preferences management
export const getUserPreferences = (): UserPreferences => {
  const stored = safeGetItem(STORAGE_KEYS.USER_PREFERENCES);
  if (!stored) return DEFAULT_PREFERENCES;

  try {
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch (e) {
    console.warn('Failed to parse user preferences, using defaults', e);
    return DEFAULT_PREFERENCES;
  }
};

export const setUserPreferences = (preferences: Partial<UserPreferences>): boolean => {
  const current = getUserPreferences();
  const updated = { ...current, ...preferences };
  
  return safeSetItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
};

export const clearUserPreferences = (): boolean => {
  return safeRemoveItem(STORAGE_KEYS.USER_PREFERENCES);
};

// Last visit tracking
export const getLastVisit = (): Date | null => {
  const stored = safeGetItem(STORAGE_KEYS.LAST_VISIT);
  if (!stored) return null;

  try {
    return new Date(stored);
  } catch (e) {
    console.warn('Failed to parse last visit date', e);
    return null;
  }
};

export const updateLastVisit = (): boolean => {
  return safeSetItem(STORAGE_KEYS.LAST_VISIT, new Date().toISOString());
};

// Onboarding status
export const isOnboardingCompleted = (): boolean => {
  const stored = safeGetItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
  return stored === 'true';
};

export const markOnboardingCompleted = (): boolean => {
  return safeSetItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
};

export const resetOnboardingStatus = (): boolean => {
  return safeRemoveItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
};

// Theme management
export const getThemePreference = (): 'light' | 'dark' | 'system' => {
  const stored = safeGetItem(STORAGE_KEYS.THEME_PREFERENCE);
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    return stored as 'light' | 'dark' | 'system';
  }
  return 'system';
};

export const setThemePreference = (theme: 'light' | 'dark' | 'system'): boolean => {
  return safeSetItem(STORAGE_KEYS.THEME_PREFERENCE, theme);
};

// Session cleanup on logout
export const clearUserSession = (): void => {
  // Clear all user-specific data but keep general preferences
  safeRemoveItem(STORAGE_KEYS.LAST_VISIT);
  safeRemoveItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
  
  // Keep theme and language preferences as they're user-independent
  const preferences = getUserPreferences();
  const generalPreferences = {
    language: preferences.language,
    theme: preferences.theme,
  };
  
  safeSetItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(generalPreferences));
};

// Cookie utilities for enhanced security
export const setCookie = (
  name: string, 
  value: string, 
  options: {
    expires?: Date;
    maxAge?: number;
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  } = {}
): void => {
  if (typeof document === 'undefined') return;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.expires) {
    cookieString += `; expires=${options.expires.toUTCString()}`;
  }

  if (options.maxAge) {
    cookieString += `; max-age=${options.maxAge}`;
  }

  cookieString += `; path=${options.path || '/'}`;

  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  if (options.secure) {
    cookieString += '; secure';
  }

  if (options.httpOnly) {
    cookieString += '; httponly';
  }

  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }

  document.cookie = cookieString;
};

export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
};

export const removeCookie = (
  name: string, 
  options: { path?: string; domain?: string } = {}
): void => {
  setCookie(name, '', {
    expires: new Date(0),
    path: options.path,
    domain: options.domain,
  });
};

// Enhanced session security
export const generateSessionId = (): string => {
  return `yaan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Check if user has visited before
export const isFirstTimeUser = (): boolean => {
  return !getLastVisit() && !isOnboardingCompleted();
};

// Analytics helpers (privacy-compliant)
export const shouldTrackAnalytics = (): boolean => {
  const preferences = getUserPreferences();
  return preferences.marketingEmails; // Use marketing emails as analytics consent proxy
};

// Browser compatibility check
export const getBrowserSupport = (): {
  localStorage: boolean;
  sessionStorage: boolean;
  cookies: boolean;
} => {
  return {
    localStorage: isLocalStorageAvailable(),
    sessionStorage: (() => {
      try {
        const test = '__sessionStorage_test__';
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    })(),
    cookies: typeof document !== 'undefined' && navigator.cookieEnabled,
  };
};

// Memory fallback for when storage is not available
class MemoryStorage {
  private storage = new Map<string, string>();

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

export const memoryStorage = new MemoryStorage();

// Export for testing
export const __test__ = {
  STORAGE_KEYS,
  DEFAULT_PREFERENCES,
  isLocalStorageAvailable,
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
};