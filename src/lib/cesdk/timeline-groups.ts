/**
 * Timeline Groups Manager for CE.SDK Video Editor
 *
 * Provides functionality to group multiple clips in the video timeline for
 * simultaneous operations (move, scale, delete). Uses CE.SDK's track blocks
 * as containers for grouping clips.
 *
 * Architecture:
 * - Uses CE.SDK track blocks as group containers
 * - Tracks are parented to the page block
 * - Clips (video, audio, graphic blocks) are reparented to track when grouped
 * - Groups persist in scene serialization (scene.saveToString())
 *
 * CE.SDK APIs Used:
 * - engine.block.create('track') - Create track as group container
 * - engine.block.appendChild() - Add clips to group
 * - engine.block.setSelected() - Select entire group
 * - engine.block.getTimeOffset() - Get clip timing
 * - engine.block.setTimeOffset() - Set clip timing
 *
 * References:
 * - Documentation: docs/CESDK_NEXTJS_LLMS_FULL.txt (Track API, Block API)
 * - IMG.LY Video Mode: Track and Clip management
 *
 * @example
 * ```typescript
 * import { TimelineGroupManager } from '@/lib/cesdk/timeline-groups';
 *
 * const manager = new TimelineGroupManager(cesdk.engine);
 *
 * // Create group from selected clips
 * const group = manager.createGroup('Intro Sequence', selectedClipIds);
 *
 * // Add another clip
 * manager.addToGroup(group.id, newClipId);
 *
 * // Get all groups
 * const groups = manager.getGroups();
 * ```
 */

import type CreativeEngine from '@cesdk/cesdk-js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Represents a timeline group containing multiple clips
 */
export interface TimelineGroup {
  /** Unique identifier (track block ID) */
  id: number;

  /** Display name for the group */
  name: string;

  /** IDs of clips in this group */
  clipIds: number[];

  /** Visual color identifier (hex format) */
  color: string;

  /** Timestamp when group was created */
  createdAt: Date;

  /** Total duration of the group in seconds */
  duration: number;

  /** Start time of the group on the timeline */
  startTime: number;
}

/**
 * Group creation options
 */
export interface CreateGroupOptions {
  /** Display name for the group */
  name: string;

  /** Visual color identifier (hex format) */
  color?: string;
}

/**
 * Group update options
 */
export interface UpdateGroupOptions {
  /** New display name */
  name?: string;

  /** New visual color */
  color?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default colors for groups (YAAN branded palette)
 */
const GROUP_COLORS = [
  '#EC4899', // Pink 500
  '#9333EA', // Purple 600
  '#F472B6', // Pink 400
  '#A855F7', // Purple 500
  '#F97316', // Orange 500
  '#22C55E', // Green 500
  '#3B82F6', // Blue 500
  '#EF4444', // Red 500
];

/**
 * Metadata key prefix for storing group info in CE.SDK blocks
 */
const GROUP_META_KEY = 'yaan/group';

// ============================================================================
// TIMELINE GROUP MANAGER CLASS
// ============================================================================

export class TimelineGroupManager {
  private engine: CreativeEngine['engine'];
  private groups: Map<number, TimelineGroup> = new Map();
  private colorIndex: number = 0;

  /**
   * Create a new TimelineGroupManager
   *
   * @param engine - CE.SDK engine instance
   */
  constructor(engine: CreativeEngine['engine']) {
    this.engine = engine;
    console.log('[TimelineGroupManager] 🎬 Initialized');
  }

  // ============================================================================
  // GROUP CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new group from selected clips
   *
   * @param options - Group options (name, color)
   * @param clipIds - Array of clip block IDs to include in group
   * @returns Created TimelineGroup
   */
  createGroup(options: CreateGroupOptions, clipIds: number[]): TimelineGroup {
    console.log('[TimelineGroupManager] 📦 Creating group:', options.name, 'with', clipIds.length, 'clips');

    if (clipIds.length === 0) {
      throw new Error('Cannot create empty group');
    }

    // Validate all clips exist
    for (const clipId of clipIds) {
      if (!this.engine.block.isValid(clipId)) {
        throw new Error(`Invalid clip ID: ${clipId}`);
      }
    }

    // Create track block as group container
    const trackId = this.engine.block.create('track');

    // Get the page (parent for tracks)
    const pages = this.engine.block.findByType('page');
    if (pages.length === 0) {
      this.engine.block.destroy(trackId);
      throw new Error('No page found in scene');
    }
    const pageId = pages[0];

    // Add track to page
    this.engine.block.appendChild(pageId, trackId);

    // Set group name as metadata
    this.engine.block.setMetadata(trackId, `${GROUP_META_KEY}/name`, options.name);

    // Assign color (cycle through palette if not provided)
    const color = options.color || this.getNextColor();
    this.engine.block.setMetadata(trackId, `${GROUP_META_KEY}/color`, color);

    // Move clips to the group track
    for (const clipId of clipIds) {
      this.reparentClipToGroup(clipId, trackId);
    }

    // Calculate group timing
    const { startTime, duration } = this.calculateGroupTiming(clipIds);

    // Create group object
    const group: TimelineGroup = {
      id: trackId,
      name: options.name,
      clipIds: [...clipIds],
      color,
      createdAt: new Date(),
      duration,
      startTime
    };

    // Store in local map
    this.groups.set(trackId, group);

    console.log('[TimelineGroupManager] ✅ Group created:', {
      id: trackId,
      name: options.name,
      clips: clipIds.length,
      duration: `${duration.toFixed(2)}s`
    });

    return group;
  }

  /**
   * Add a clip to an existing group
   *
   * @param groupId - Group (track) ID
   * @param clipId - Clip block ID to add
   */
  addToGroup(groupId: number, clipId: number): void {
    console.log('[TimelineGroupManager] ➕ Adding clip', clipId, 'to group', groupId);

    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    if (!this.engine.block.isValid(clipId)) {
      throw new Error(`Invalid clip ID: ${clipId}`);
    }

    // Check if clip is already in a group
    const existingGroup = this.getGroupForClip(clipId);
    if (existingGroup) {
      if (existingGroup.id === groupId) {
        console.log('[TimelineGroupManager] Clip already in this group');
        return;
      }
      // Remove from existing group first
      this.removeFromGroup(existingGroup.id, clipId);
    }

    // Reparent clip to group track
    this.reparentClipToGroup(clipId, groupId);

    // Update group
    group.clipIds.push(clipId);
    const { startTime, duration } = this.calculateGroupTiming(group.clipIds);
    group.startTime = startTime;
    group.duration = duration;

    console.log('[TimelineGroupManager] ✅ Clip added to group');
  }

  /**
   * Remove a clip from its group
   *
   * @param groupId - Group (track) ID
   * @param clipId - Clip block ID to remove
   */
  removeFromGroup(groupId: number, clipId: number): void {
    console.log('[TimelineGroupManager] ➖ Removing clip', clipId, 'from group', groupId);

    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    const clipIndex = group.clipIds.indexOf(clipId);
    if (clipIndex === -1) {
      console.log('[TimelineGroupManager] Clip not in this group');
      return;
    }

    // Get the main track to reparent to
    const mainTrack = this.getMainTrack();
    if (mainTrack !== null) {
      this.engine.block.appendChild(mainTrack, clipId);
    }

    // Update group
    group.clipIds.splice(clipIndex, 1);

    // Delete group if empty
    if (group.clipIds.length === 0) {
      this.deleteGroup(groupId, false);
    } else {
      // Update timing
      const { startTime, duration } = this.calculateGroupTiming(group.clipIds);
      group.startTime = startTime;
      group.duration = duration;
    }

    console.log('[TimelineGroupManager] ✅ Clip removed from group');
  }

  /**
   * Delete a group
   *
   * @param groupId - Group (track) ID
   * @param deleteClips - If true, also delete the clips; if false, ungroup them
   */
  deleteGroup(groupId: number, deleteClips: boolean = false): void {
    console.log('[TimelineGroupManager] 🗑️ Deleting group', groupId, deleteClips ? '(with clips)' : '(ungroup only)');

    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    if (deleteClips) {
      // Delete all clips in group
      for (const clipId of group.clipIds) {
        if (this.engine.block.isValid(clipId)) {
          this.engine.block.destroy(clipId);
        }
      }
    } else {
      // Ungroup: move clips back to main track
      const mainTrack = this.getMainTrack();
      for (const clipId of group.clipIds) {
        if (this.engine.block.isValid(clipId) && mainTrack !== null) {
          this.engine.block.appendChild(mainTrack, clipId);
        }
      }
    }

    // Destroy the group track
    if (this.engine.block.isValid(groupId)) {
      this.engine.block.destroy(groupId);
    }

    // Remove from local map
    this.groups.delete(groupId);

    console.log('[TimelineGroupManager] ✅ Group deleted');
  }

  /**
   * Update group properties
   *
   * @param groupId - Group (track) ID
   * @param options - Properties to update
   */
  updateGroup(groupId: number, options: UpdateGroupOptions): void {
    console.log('[TimelineGroupManager] ✏️ Updating group', groupId, options);

    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    if (options.name !== undefined) {
      group.name = options.name;
      this.engine.block.setMetadata(groupId, `${GROUP_META_KEY}/name`, options.name);
    }

    if (options.color !== undefined) {
      group.color = options.color;
      this.engine.block.setMetadata(groupId, `${GROUP_META_KEY}/color`, options.color);
    }

    console.log('[TimelineGroupManager] ✅ Group updated');
  }

  /**
   * Merge multiple groups into one
   *
   * @param groupIds - Array of group IDs to merge
   * @param newName - Name for the merged group
   * @returns Merged TimelineGroup
   */
  mergeGroups(groupIds: number[], newName: string): TimelineGroup {
    console.log('[TimelineGroupManager] 🔗 Merging groups:', groupIds, 'into', newName);

    if (groupIds.length < 2) {
      throw new Error('Need at least 2 groups to merge');
    }

    // Collect all clips from all groups
    const allClipIds: number[] = [];
    for (const groupId of groupIds) {
      const group = this.groups.get(groupId);
      if (!group) {
        throw new Error(`Group not found: ${groupId}`);
      }
      allClipIds.push(...group.clipIds);
    }

    // Get the color from the first group
    const firstGroup = this.groups.get(groupIds[0])!;
    const color = firstGroup.color;

    // Delete all source groups (without deleting clips)
    for (const groupId of groupIds) {
      // First, unparent all clips to prevent them from being affected
      const group = this.groups.get(groupId)!;
      const mainTrack = this.getMainTrack();
      for (const clipId of group.clipIds) {
        if (this.engine.block.isValid(clipId) && mainTrack !== null) {
          this.engine.block.appendChild(mainTrack, clipId);
        }
      }
      // Then delete the group track
      if (this.engine.block.isValid(groupId)) {
        this.engine.block.destroy(groupId);
      }
      this.groups.delete(groupId);
    }

    // Create new merged group
    const mergedGroup = this.createGroup(
      { name: newName, color },
      allClipIds
    );

    console.log('[TimelineGroupManager] ✅ Groups merged:', {
      mergedId: mergedGroup.id,
      totalClips: allClipIds.length
    });

    return mergedGroup;
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /**
   * Get all groups
   *
   * @returns Array of all TimelineGroups
   */
  getGroups(): TimelineGroup[] {
    return Array.from(this.groups.values());
  }

  /**
   * Get a specific group by ID
   *
   * @param groupId - Group (track) ID
   * @returns TimelineGroup or null if not found
   */
  getGroup(groupId: number): TimelineGroup | null {
    return this.groups.get(groupId) || null;
  }

  /**
   * Get the group containing a specific clip
   *
   * @param clipId - Clip block ID
   * @returns TimelineGroup containing the clip, or null
   */
  getGroupForClip(clipId: number): TimelineGroup | null {
    for (const group of this.groups.values()) {
      if (group.clipIds.includes(clipId)) {
        return group;
      }
    }
    return null;
  }

  /**
   * Check if a clip is in any group
   *
   * @param clipId - Clip block ID
   * @returns true if clip is grouped
   */
  isClipGrouped(clipId: number): boolean {
    return this.getGroupForClip(clipId) !== null;
  }

  // ============================================================================
  // SELECTION METHODS
  // ============================================================================

  /**
   * Select all clips in a group
   *
   * @param groupId - Group (track) ID
   */
  selectGroup(groupId: number): void {
    console.log('[TimelineGroupManager] 🎯 Selecting group:', groupId);

    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    // Clear current selection
    const currentSelection = this.engine.block.findAllSelected();
    for (const blockId of currentSelection) {
      this.engine.block.setSelected(blockId, false);
    }

    // Select all clips in group
    for (const clipId of group.clipIds) {
      if (this.engine.block.isValid(clipId)) {
        this.engine.block.setSelected(clipId, true);
      }
    }

    console.log('[TimelineGroupManager] ✅ Group selected:', group.clipIds.length, 'clips');
  }

  /**
   * Deselect all clips in a group
   *
   * @param groupId - Group (track) ID
   */
  deselectGroup(groupId: number): void {
    const group = this.groups.get(groupId);
    if (!group) return;

    for (const clipId of group.clipIds) {
      if (this.engine.block.isValid(clipId)) {
        this.engine.block.setSelected(clipId, false);
      }
    }
  }

  // ============================================================================
  // GROUP OPERATIONS
  // ============================================================================

  /**
   * Move entire group by a time offset
   *
   * @param groupId - Group (track) ID
   * @param deltaTime - Time offset in seconds (positive = forward, negative = backward)
   */
  moveGroup(groupId: number, deltaTime: number): void {
    console.log('[TimelineGroupManager] ⏱️ Moving group', groupId, 'by', deltaTime, 'seconds');

    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Group not found: ${groupId}`);
    }

    for (const clipId of group.clipIds) {
      if (this.engine.block.isValid(clipId)) {
        const currentOffset = this.engine.block.getTimeOffset(clipId);
        const newOffset = Math.max(0, currentOffset + deltaTime);
        this.engine.block.setTimeOffset(clipId, newOffset);
      }
    }

    // Update group timing
    const { startTime, duration } = this.calculateGroupTiming(group.clipIds);
    group.startTime = startTime;
    group.duration = duration;

    console.log('[TimelineGroupManager] ✅ Group moved to start at', startTime.toFixed(2), 'seconds');
  }

  // ============================================================================
  // PERSISTENCE
  // ============================================================================

  /**
   * Load groups from scene (call after scene load)
   *
   * Reconstructs group state from track metadata stored in scene.
   */
  loadGroupsFromScene(): void {
    console.log('[TimelineGroupManager] 📂 Loading groups from scene...');

    this.groups.clear();

    // Find all tracks in scene
    const tracks = this.engine.block.findByType('track');

    for (const trackId of tracks) {
      // Check if track has group metadata
      const hasGroupMeta = this.engine.block.hasMetadata(trackId, `${GROUP_META_KEY}/name`);

      if (hasGroupMeta) {
        const name = this.engine.block.getMetadata(trackId, `${GROUP_META_KEY}/name`);
        const color = this.engine.block.getMetadata(trackId, `${GROUP_META_KEY}/color`) || this.getNextColor();

        // Get clips in this track
        const clipIds = this.engine.block.getChildren(trackId);

        if (clipIds.length > 0) {
          const { startTime, duration } = this.calculateGroupTiming(clipIds);

          const group: TimelineGroup = {
            id: trackId,
            name,
            clipIds,
            color,
            createdAt: new Date(),
            duration,
            startTime
          };

          this.groups.set(trackId, group);

          console.log('[TimelineGroupManager] ✅ Loaded group:', name, 'with', clipIds.length, 'clips');
        }
      }
    }

    console.log('[TimelineGroupManager] 📂 Loaded', this.groups.size, 'groups from scene');
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Get the next color from the palette
   */
  private getNextColor(): string {
    const color = GROUP_COLORS[this.colorIndex % GROUP_COLORS.length];
    this.colorIndex++;
    return color;
  }

  /**
   * Get the main track (first track that's not a group)
   */
  private getMainTrack(): number | null {
    const tracks = this.engine.block.findByType('track');

    for (const trackId of tracks) {
      const hasGroupMeta = this.engine.block.hasMetadata(trackId, `${GROUP_META_KEY}/name`);
      if (!hasGroupMeta) {
        return trackId;
      }
    }

    // If no ungrouped track, create one
    const pages = this.engine.block.findByType('page');
    if (pages.length > 0) {
      const mainTrack = this.engine.block.create('track');
      this.engine.block.appendChild(pages[0], mainTrack);
      return mainTrack;
    }

    return null;
  }

  /**
   * Reparent a clip to a group track
   */
  private reparentClipToGroup(clipId: number, groupTrackId: number): void {
    // Simply append to the group track (CE.SDK handles reparenting)
    this.engine.block.appendChild(groupTrackId, clipId);
  }

  /**
   * Calculate group timing (start time and duration)
   */
  private calculateGroupTiming(clipIds: number[]): { startTime: number; duration: number } {
    let minStart = Infinity;
    let maxEnd = 0;

    for (const clipId of clipIds) {
      if (this.engine.block.isValid(clipId)) {
        const start = this.engine.block.getTimeOffset(clipId);
        const clipDuration = this.engine.block.getDuration(clipId);
        const end = start + clipDuration;

        minStart = Math.min(minStart, start);
        maxEnd = Math.max(maxEnd, end);
      }
    }

    return {
      startTime: minStart === Infinity ? 0 : minStart,
      duration: maxEnd - (minStart === Infinity ? 0 : minStart)
    };
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Clean up manager state (call on component unmount)
   */
  dispose(): void {
    console.log('[TimelineGroupManager] 🧹 Disposing...');
    this.groups.clear();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TimelineGroupManager;
