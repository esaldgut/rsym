/**
 * useAutoSave Hook - Auto-save CE.SDK scenes with hash comparison
 *
 * Implements IMG.LY best practices for auto-save system:
 * - Auto-save every 30 seconds (configurable)
 * - Hash comparison to avoid unnecessary saves
 * - localStorage persistence with metadata
 * - Recovery detection for abandoned sessions
 * - Cleanup of old drafts (>7 days)
 *
 * Based on official IMG.LY documentation patterns
 * Reference: docs/CESDK_NEXTJS_LLMS_FULL.txt (Auto-Save Optimization)
 *
 * @example
 * ```tsx
 * const { saveNow, hasUnsavedChanges, lastSaved } = useAutoSave({
 *   cesdk: cesdkInstance,
 *   userId: 'user123',
 *   enabled: true,
 *   interval: 30000
 * });
 * ```
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import type CreativeEditorSDK from '@cesdk/cesdk-js';

// ============================================================================
// TYPES
// ============================================================================

export interface UseAutoSaveOptions {
  /** CE.SDK instance (required) */
  cesdk: CreativeEditorSDK | null;

  /** User ID for storage key isolation */
  userId: string;

  /** Enable auto-save (default: true) */
  enabled?: boolean;

  /** Auto-save interval in milliseconds (default: 30000 = 30s) */
  interval?: number;

  /** Storage key prefix (default: 'moment-draft') */
  storageKey?: string;

  /** Callback when auto-save completes */
  onSave?: (metadata: SaveMetadata) => void;

  /** Callback when auto-save errors */
  onError?: (error: Error) => void;
}

export interface SaveMetadata {
  /** Timestamp of save */
  timestamp: string; // ISO 8601

  /** Save origin */
  savedBy: 'auto-save' | 'manual' | 'recovery';

  /** Scene data hash (SHA-256) */
  hash: string;

  /** Scene size in bytes */
  size: number;
}

export interface UseAutoSaveReturn {
  /** Trigger manual save */
  saveNow: () => Promise<void>;

  /** Check if there are unsaved changes */
  hasUnsavedChanges: boolean;

  /** Last save metadata */
  lastSaved: SaveMetadata | null;

  /** Loading state */
  isSaving: boolean;

  /** Clear all drafts */
  clearDrafts: () => void;

  /** Load scene from draft */
  loadDraft: () => Promise<boolean>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_INTERVAL = 30000; // 30 seconds
const DEFAULT_STORAGE_KEY = 'moment-draft';
const DRAFT_EXPIRY_DAYS = 7; // Cleanup drafts older than 7 days

// ============================================================================
// HOOK
// ============================================================================

export function useAutoSave(options: UseAutoSaveOptions): UseAutoSaveReturn {
  const {
    cesdk,
    userId,
    enabled = true,
    interval = DEFAULT_INTERVAL,
    storageKey = DEFAULT_STORAGE_KEY,
    onSave,
    onError
  } = options;

  // State
  const [lastSaved, setLastSaved] = useState<SaveMetadata | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Refs
  const lastHashRef = useRef<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Storage keys
  const draftKey = `${storageKey}-${userId}-latest`;
  const timestampKey = `${draftKey}-timestamp`;
  const hashKey = `${draftKey}-hash`;
  const sizeKey = `${draftKey}-size`;
  const savedByKey = `${draftKey}-savedBy`;

  // ============================================================================
  // HASH COMPUTATION
  // ============================================================================

  /**
   * Compute SHA-256 hash of scene string
   * Used for detecting actual changes (not just re-renders)
   */
  const computeHash = useCallback(async (sceneString: string): Promise<string> => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(sceneString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      console.error('[useAutoSave] Failed to compute hash:', error);
      // Fallback: use simple string hash
      let hash = 0;
      for (let i = 0; i < sceneString.length; i++) {
        const char = sceneString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash.toString(16);
    }
  }, []);

  // ============================================================================
  // SAVE LOGIC
  // ============================================================================

  /**
   * Save scene to localStorage with hash comparison
   */
  const saveScene = useCallback(async (savedBy: 'auto-save' | 'manual' | 'recovery'): Promise<void> => {
    if (!cesdk || !isMountedRef.current) return;

    setIsSaving(true);

    try {
      // Serialize scene
      const sceneString = await cesdk.engine.scene.saveToString();

      // Compute hash
      const hash = await computeHash(sceneString);

      // Check if scene actually changed
      if (hash === lastHashRef.current && savedBy === 'auto-save') {
        console.log('[useAutoSave] Scene unchanged, skipping auto-save');
        setIsSaving(false);
        setHasUnsavedChanges(false);
        return;
      }

      // Save to localStorage
      const timestamp = new Date().toISOString();
      const size = new Blob([sceneString]).size;

      localStorage.setItem(draftKey, sceneString);
      localStorage.setItem(timestampKey, timestamp);
      localStorage.setItem(hashKey, hash);
      localStorage.setItem(sizeKey, size.toString());
      localStorage.setItem(savedByKey, savedBy);

      // Update state
      const metadata: SaveMetadata = {
        timestamp,
        savedBy,
        hash,
        size
      };

      lastHashRef.current = hash;
      setLastSaved(metadata);
      setHasUnsavedChanges(false);

      console.log(`[useAutoSave] Scene saved (${savedBy}):`, {
        hash: hash.substring(0, 8),
        size: `${(size / 1024).toFixed(2)} KB`,
        timestamp
      });

      // Callback
      if (onSave) {
        onSave(metadata);
      }

    } catch (error) {
      console.error('[useAutoSave] Save failed:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [cesdk, draftKey, timestampKey, hashKey, sizeKey, savedByKey, computeHash, onSave, onError]);

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  /**
   * Trigger manual save
   */
  const saveNow = useCallback(async (): Promise<void> => {
    await saveScene('manual');
  }, [saveScene]);

  /**
   * Load scene from draft
   */
  const loadDraft = useCallback(async (): Promise<boolean> => {
    if (!cesdk) return false;

    try {
      const sceneString = localStorage.getItem(draftKey);
      if (!sceneString) {
        console.log('[useAutoSave] No draft found');
        return false;
      }

      await cesdk.engine.scene.loadFromString(sceneString);

      // Update hash to match loaded scene
      const hash = localStorage.getItem(hashKey) || '';
      lastHashRef.current = hash;

      // Update metadata
      const timestamp = localStorage.getItem(timestampKey) || '';
      const size = parseInt(localStorage.getItem(sizeKey) || '0', 10);
      const savedBy = localStorage.getItem(savedByKey) as 'auto-save' | 'manual' | 'recovery' || 'recovery';

      setLastSaved({
        timestamp,
        savedBy,
        hash,
        size
      });

      setHasUnsavedChanges(false);

      console.log('[useAutoSave] Draft loaded:', {
        hash: hash.substring(0, 8),
        timestamp
      });

      return true;

    } catch (error) {
      console.error('[useAutoSave] Failed to load draft:', error);
      return false;
    }
  }, [cesdk, draftKey, timestampKey, hashKey, sizeKey, savedByKey]);

  /**
   * Clear all drafts for this user
   */
  const clearDrafts = useCallback((): void => {
    localStorage.removeItem(draftKey);
    localStorage.removeItem(timestampKey);
    localStorage.removeItem(hashKey);
    localStorage.removeItem(sizeKey);
    localStorage.removeItem(savedByKey);
    setLastSaved(null);
    lastHashRef.current = '';
    setHasUnsavedChanges(false);
    console.log('[useAutoSave] Drafts cleared');
  }, [draftKey, timestampKey, hashKey, sizeKey, savedByKey]);

  // ============================================================================
  // AUTO-SAVE INTERVAL
  // ============================================================================

  useEffect(() => {
    if (!enabled || !cesdk) return;

    // Start auto-save interval
    intervalRef.current = setInterval(() => {
      saveScene('auto-save');
    }, interval);

    console.log(`[useAutoSave] Auto-save enabled (interval: ${interval}ms)`);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, cesdk, interval, saveScene]);

  // ============================================================================
  // DRAFT CLEANUP (OLD DRAFTS)
  // ============================================================================

  useEffect(() => {
    // Cleanup drafts older than DRAFT_EXPIRY_DAYS
    const cleanupOldDrafts = () => {
      const timestamp = localStorage.getItem(timestampKey);
      if (!timestamp) return;

      const savedDate = new Date(timestamp);
      const now = new Date();
      const daysDiff = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > DRAFT_EXPIRY_DAYS) {
        console.log(`[useAutoSave] Cleaning up draft older than ${DRAFT_EXPIRY_DAYS} days`);
        clearDrafts();
      }
    };

    cleanupOldDrafts();
  }, [timestampKey, clearDrafts]);

  // ============================================================================
  // UNMOUNT CLEANUP
  // ============================================================================

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    saveNow,
    hasUnsavedChanges,
    lastSaved,
    isSaving,
    clearDrafts,
    loadDraft
  };
}
