'use client';

/**
 * useTimelineGroups - React Hook for Timeline Group Management
 *
 * Provides a React-friendly interface to the TimelineGroupManager for managing
 * clip groups in CE.SDK video editor. Handles state synchronization, selection
 * events, and cleanup.
 *
 * Features:
 * - Create/delete/merge groups from selected clips
 * - Select entire group with single action
 * - Track group state reactively
 * - Auto-cleanup on unmount
 * - Sync with CE.SDK selection events
 *
 * @example
 * ```tsx
 * const {
 *   groups,
 *   createGroupFromSelection,
 *   deleteGroup,
 *   selectGroup,
 *   selectedGroupId
 * } = useTimelineGroups({ cesdkInstance, isVideoMode: true });
 *
 * // Create group from current selection
 * const handleGroup = () => {
 *   createGroupFromSelection('Intro Clips');
 * };
 * ```
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
import {
  TimelineGroupManager,
  type TimelineGroup,
  type CreateGroupOptions,
  type UpdateGroupOptions
} from '@/lib/cesdk/timeline-groups';

// ============================================================================
// TYPES
// ============================================================================

export interface UseTimelineGroupsOptions {
  /** CE.SDK instance (required) */
  cesdkInstance: CreativeEditorSDK | null;

  /** Whether editor is in video mode */
  isVideoMode: boolean;

  /** Called when a group is created */
  onGroupCreated?: (group: TimelineGroup) => void;

  /** Called when a group is deleted */
  onGroupDeleted?: (groupId: number) => void;

  /** Called when selection changes */
  onSelectionChange?: (selectedClipIds: number[]) => void;
}

export interface UseTimelineGroupsReturn {
  /** All timeline groups */
  groups: TimelineGroup[];

  /** Currently selected group ID (if selection is a complete group) */
  selectedGroupId: number | null;

  /** Currently selected clip IDs */
  selectedClipIds: number[];

  /** Whether any clips are selected */
  hasSelection: boolean;

  /** Whether selected clips can be grouped (2+ unrelated clips) */
  canCreateGroup: boolean;

  /** Create a group from currently selected clips */
  createGroupFromSelection: (name: string, color?: string) => TimelineGroup | null;

  /** Add selected clips to an existing group */
  addSelectionToGroup: (groupId: number) => void;

  /** Remove a clip from its group */
  removeClipFromGroup: (clipId: number) => void;

  /** Delete a group */
  deleteGroup: (groupId: number, deleteClips?: boolean) => void;

  /** Update group properties */
  updateGroup: (groupId: number, options: UpdateGroupOptions) => void;

  /** Merge multiple groups */
  mergeGroups: (groupIds: number[], newName: string) => TimelineGroup | null;

  /** Select all clips in a group */
  selectGroup: (groupId: number) => void;

  /** Get the group containing a clip */
  getGroupForClip: (clipId: number) => TimelineGroup | null;

  /** Check if a clip is in any group */
  isClipGrouped: (clipId: number) => boolean;

  /** Move group by time offset */
  moveGroup: (groupId: number, deltaTime: number) => void;

  /** Reload groups from scene (after scene load) */
  reloadFromScene: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useTimelineGroups(options: UseTimelineGroupsOptions): UseTimelineGroupsReturn {
  const {
    cesdkInstance,
    isVideoMode,
    onGroupCreated,
    onGroupDeleted,
    onSelectionChange
  } = options;

  // ============================================================================
  // STATE
  // ============================================================================

  const [groups, setGroups] = useState<TimelineGroup[]>([]);
  const [selectedClipIds, setSelectedClipIds] = useState<number[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  // Manager ref (stable across renders)
  const managerRef = useRef<TimelineGroupManager | null>(null);

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const hasSelection = selectedClipIds.length > 0;

  // Can create group if 2+ clips selected and not all in same group
  const canCreateGroup = (() => {
    if (selectedClipIds.length < 2) return false;
    if (!managerRef.current) return false;

    // Check if all selected clips are already in the same group
    const firstGroup = managerRef.current.getGroupForClip(selectedClipIds[0]);
    if (!firstGroup) return true; // At least one ungrouped = can group

    return selectedClipIds.some(clipId => {
      const group = managerRef.current!.getGroupForClip(clipId);
      return !group || group.id !== firstGroup.id;
    });
  })();

  // ============================================================================
  // MANAGER INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (!cesdkInstance || !isVideoMode) {
      managerRef.current = null;
      return;
    }

    console.log('[useTimelineGroups] 🎬 Initializing TimelineGroupManager');

    const manager = new TimelineGroupManager(cesdkInstance.engine);
    managerRef.current = manager;

    // Load existing groups from scene
    manager.loadGroupsFromScene();
    setGroups(manager.getGroups());

    return () => {
      console.log('[useTimelineGroups] 🧹 Disposing TimelineGroupManager');
      manager.dispose();
      managerRef.current = null;
    };
  }, [cesdkInstance, isVideoMode]);

  // ============================================================================
  // SELECTION SYNC
  // ============================================================================

  useEffect(() => {
    if (!cesdkInstance || !isVideoMode) return;

    console.log('[useTimelineGroups] 📡 Subscribing to selection events');

    // Subscribe to selection changes
    const unsubscribe = cesdkInstance.engine.block.onSelectionChanged(() => {
      const selected = cesdkInstance.engine.block.findAllSelected();
      setSelectedClipIds(selected);
      onSelectionChange?.(selected);

      // Check if selection is a complete group
      if (selected.length > 0 && managerRef.current) {
        const firstGroup = managerRef.current.getGroupForClip(selected[0]);

        if (firstGroup) {
          // Check if all selected clips are in this group and all group clips are selected
          const allInSameGroup = selected.every(clipId =>
            managerRef.current!.getGroupForClip(clipId)?.id === firstGroup.id
          );
          const allGroupClipsSelected =
            firstGroup.clipIds.length === selected.length &&
            firstGroup.clipIds.every(clipId => selected.includes(clipId));

          if (allInSameGroup && allGroupClipsSelected) {
            setSelectedGroupId(firstGroup.id);
          } else {
            setSelectedGroupId(null);
          }
        } else {
          setSelectedGroupId(null);
        }
      } else {
        setSelectedGroupId(null);
      }
    });

    return () => {
      console.log('[useTimelineGroups] 🧹 Unsubscribing from selection events');
      unsubscribe();
    };
  }, [cesdkInstance, isVideoMode, onSelectionChange]);

  // ============================================================================
  // SYNC HELPER
  // ============================================================================

  const syncGroups = useCallback(() => {
    if (managerRef.current) {
      setGroups(managerRef.current.getGroups());
    }
  }, []);

  // ============================================================================
  // GROUP OPERATIONS
  // ============================================================================

  const createGroupFromSelection = useCallback((name: string, color?: string): TimelineGroup | null => {
    if (!managerRef.current || selectedClipIds.length < 2) {
      console.warn('[useTimelineGroups] Cannot create group: need 2+ selected clips');
      return null;
    }

    try {
      const groupOptions: CreateGroupOptions = { name, color };
      const group = managerRef.current.createGroup(groupOptions, selectedClipIds);

      syncGroups();
      onGroupCreated?.(group);

      // Show notification
      if (cesdkInstance) {
        cesdkInstance.ui.showNotification({
          type: 'success',
          message: `Grupo "${name}" creado con ${selectedClipIds.length} clips`,
          duration: 'short'
        });
      }

      return group;
    } catch (error) {
      console.error('[useTimelineGroups] Error creating group:', error);

      if (cesdkInstance) {
        cesdkInstance.ui.showNotification({
          type: 'error',
          message: 'Error al crear grupo',
          duration: 'medium'
        });
      }

      return null;
    }
  }, [selectedClipIds, cesdkInstance, onGroupCreated, syncGroups]);

  const addSelectionToGroup = useCallback((groupId: number): void => {
    if (!managerRef.current) return;

    try {
      for (const clipId of selectedClipIds) {
        managerRef.current.addToGroup(groupId, clipId);
      }

      syncGroups();

      if (cesdkInstance) {
        cesdkInstance.ui.showNotification({
          type: 'success',
          message: `${selectedClipIds.length} clip(s) agregados al grupo`,
          duration: 'short'
        });
      }
    } catch (error) {
      console.error('[useTimelineGroups] Error adding to group:', error);
    }
  }, [selectedClipIds, cesdkInstance, syncGroups]);

  const removeClipFromGroup = useCallback((clipId: number): void => {
    if (!managerRef.current) return;

    const group = managerRef.current.getGroupForClip(clipId);
    if (!group) return;

    try {
      managerRef.current.removeFromGroup(group.id, clipId);
      syncGroups();

      if (cesdkInstance) {
        cesdkInstance.ui.showNotification({
          type: 'info',
          message: 'Clip removido del grupo',
          duration: 'short'
        });
      }
    } catch (error) {
      console.error('[useTimelineGroups] Error removing from group:', error);
    }
  }, [cesdkInstance, syncGroups]);

  const deleteGroup = useCallback((groupId: number, deleteClips: boolean = false): void => {
    if (!managerRef.current) return;

    try {
      managerRef.current.deleteGroup(groupId, deleteClips);
      syncGroups();
      onGroupDeleted?.(groupId);

      if (cesdkInstance) {
        cesdkInstance.ui.showNotification({
          type: 'info',
          message: deleteClips ? 'Grupo y clips eliminados' : 'Grupo desagrupado',
          duration: 'short'
        });
      }
    } catch (error) {
      console.error('[useTimelineGroups] Error deleting group:', error);
    }
  }, [cesdkInstance, onGroupDeleted, syncGroups]);

  const updateGroup = useCallback((groupId: number, updateOptions: UpdateGroupOptions): void => {
    if (!managerRef.current) return;

    try {
      managerRef.current.updateGroup(groupId, updateOptions);
      syncGroups();
    } catch (error) {
      console.error('[useTimelineGroups] Error updating group:', error);
    }
  }, [syncGroups]);

  const mergeGroups = useCallback((groupIds: number[], newName: string): TimelineGroup | null => {
    if (!managerRef.current || groupIds.length < 2) return null;

    try {
      const mergedGroup = managerRef.current.mergeGroups(groupIds, newName);
      syncGroups();

      if (cesdkInstance) {
        cesdkInstance.ui.showNotification({
          type: 'success',
          message: `${groupIds.length} grupos fusionados en "${newName}"`,
          duration: 'short'
        });
      }

      return mergedGroup;
    } catch (error) {
      console.error('[useTimelineGroups] Error merging groups:', error);
      return null;
    }
  }, [cesdkInstance, syncGroups]);

  const selectGroup = useCallback((groupId: number): void => {
    if (!managerRef.current) return;

    try {
      managerRef.current.selectGroup(groupId);
    } catch (error) {
      console.error('[useTimelineGroups] Error selecting group:', error);
    }
  }, []);

  const getGroupForClip = useCallback((clipId: number): TimelineGroup | null => {
    if (!managerRef.current) return null;
    return managerRef.current.getGroupForClip(clipId);
  }, []);

  const isClipGrouped = useCallback((clipId: number): boolean => {
    if (!managerRef.current) return false;
    return managerRef.current.isClipGrouped(clipId);
  }, []);

  const moveGroup = useCallback((groupId: number, deltaTime: number): void => {
    if (!managerRef.current) return;

    try {
      managerRef.current.moveGroup(groupId, deltaTime);
      syncGroups();
    } catch (error) {
      console.error('[useTimelineGroups] Error moving group:', error);
    }
  }, [syncGroups]);

  const reloadFromScene = useCallback((): void => {
    if (!managerRef.current) return;

    managerRef.current.loadGroupsFromScene();
    syncGroups();
  }, [syncGroups]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    groups,
    selectedGroupId,
    selectedClipIds,
    hasSelection,
    canCreateGroup,
    createGroupFromSelection,
    addSelectionToGroup,
    removeClipFromGroup,
    deleteGroup,
    updateGroup,
    mergeGroups,
    selectGroup,
    getGroupForClip,
    isClipGrouped,
    moveGroup,
    reloadFromScene
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useTimelineGroups;
