'use client';

/**
 * TimelineGroupPanel - UI Panel for Timeline Group Management
 *
 * Provides a visual interface for managing clip groups in CE.SDK video editor.
 * Shows existing groups, allows creation/deletion, and supports group operations.
 *
 * Features:
 * - List of existing groups with visual color indicators
 * - Create group from selection button
 * - Edit group name/color
 * - Delete group (ungroup or delete with clips)
 * - Merge groups
 * - Select group (highlights all clips)
 *
 * @example
 * ```tsx
 * <TimelineGroupPanel
 *   cesdkInstance={cesdkInstance}
 *   isVideoMode={true}
 *   className="w-80"
 * />
 * ```
 */

import { useState } from 'react';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { useTimelineGroups } from '@/hooks/useTimelineGroups';
import type { TimelineGroup } from '@/lib/cesdk/timeline-groups';

// ============================================================================
// TYPES
// ============================================================================

export interface TimelineGroupPanelProps {
  /** CE.SDK instance (required) */
  cesdkInstance: CreativeEditorSDK | null;

  /** Whether editor is in video mode */
  isVideoMode: boolean;

  /** Optional CSS class */
  className?: string;

  /** Panel collapsed state */
  defaultCollapsed?: boolean;
}

// ============================================================================
// COLOR PALETTE
// ============================================================================

const GROUP_COLORS = [
  { hex: '#EC4899', name: 'Rosa' },
  { hex: '#9333EA', name: 'Morado' },
  { hex: '#F472B6', name: 'Rosa Claro' },
  { hex: '#A855F7', name: 'Morado Claro' },
  { hex: '#F97316', name: 'Naranja' },
  { hex: '#22C55E', name: 'Verde' },
  { hex: '#3B82F6', name: 'Azul' },
  { hex: '#EF4444', name: 'Rojo' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function TimelineGroupPanel({
  cesdkInstance,
  isVideoMode,
  className = '',
  defaultCollapsed = false
}: TimelineGroupPanelProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedColor, setSelectedColor] = useState(GROUP_COLORS[0].hex);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<number[]>([]);

  // ============================================================================
  // HOOKS
  // ============================================================================

  const {
    groups,
    selectedGroupId,
    hasSelection,
    canCreateGroup,
    createGroupFromSelection,
    deleteGroup,
    updateGroup,
    mergeGroups,
    selectGroup
  } = useTimelineGroups({
    cesdkInstance,
    isVideoMode
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      cesdkInstance?.ui.showNotification({
        type: 'warning',
        message: 'Ingresa un nombre para el grupo',
        duration: 'short'
      });
      return;
    }

    const group = createGroupFromSelection(newGroupName.trim(), selectedColor);

    if (group) {
      setNewGroupName('');
      setIsCreating(false);
      setSelectedColor(GROUP_COLORS[0].hex);
    }
  };

  const handleStartEdit = (group: TimelineGroup) => {
    setEditingGroupId(group.id);
    setEditingName(group.name);
  };

  const handleSaveEdit = () => {
    if (editingGroupId !== null && editingName.trim()) {
      updateGroup(editingGroupId, { name: editingName.trim() });
    }
    setEditingGroupId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingGroupId(null);
    setEditingName('');
  };

  const handleToggleMergeSelection = (groupId: number) => {
    setSelectedForMerge(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleMerge = () => {
    if (selectedForMerge.length < 2) {
      cesdkInstance?.ui.showNotification({
        type: 'warning',
        message: 'Selecciona al menos 2 grupos para fusionar',
        duration: 'short'
      });
      return;
    }

    const selectedGroupNames = selectedForMerge.map(id => {
      const group = groups.find(g => g.id === id);
      return group?.name || '';
    }).filter(Boolean);

    const mergedName = `Merged: ${selectedGroupNames.join(' + ')}`;

    mergeGroups(selectedForMerge, mergedName);
    setSelectedForMerge([]);
    setShowMergeDialog(false);
  };

  // ============================================================================
  // RENDER - NOT VIDEO MODE
  // ============================================================================

  if (!isVideoMode) {
    return null; // Only show in video mode
  }

  // ============================================================================
  // RENDER - NO CESDK
  // ============================================================================

  if (!cesdkInstance) {
    return null;
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`bg-gray-800 rounded-lg shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-700 hover:bg-gray-600 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📦</span>
          <span className="text-white font-medium">Grupos de Timeline</span>
          <span className="bg-pink-500/20 text-pink-400 text-xs px-2 py-0.5 rounded-full">
            {groups.length}
          </span>
        </div>
        <ChevronIcon className={`w-5 h-5 text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-4">
          {/* Create Group Section */}
          {isCreating ? (
            <div className="bg-gray-700/50 rounded-lg p-3 space-y-3">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Nombre del grupo..."
                className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-pink-500 focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateGroup();
                  if (e.key === 'Escape') setIsCreating(false);
                }}
              />

              {/* Color Selector */}
              <div className="flex flex-wrap gap-2">
                {GROUP_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => setSelectedColor(color.hex)}
                    title={color.name}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      selectedColor === color.hex ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-700 scale-110' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Crear Grupo
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              disabled={!canCreateGroup}
              className={`w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                canCreateGroup
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 shadow-lg'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <PlusIcon className="w-5 h-5" />
              <span>Crear Grupo</span>
              {hasSelection && !canCreateGroup && (
                <span className="text-xs text-gray-400">(Selecciona 2+ clips)</span>
              )}
            </button>
          )}

          {/* Groups List */}
          {groups.length > 0 ? (
            <div className="space-y-2">
              {/* Merge Mode Toggle */}
              {groups.length >= 2 && (
                <button
                  onClick={() => {
                    setShowMergeDialog(!showMergeDialog);
                    setSelectedForMerge([]);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                    showMergeDialog
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {showMergeDialog ? 'Cancelar Fusión' : '🔗 Fusionar Grupos'}
                </button>
              )}

              {/* Merge Actions */}
              {showMergeDialog && selectedForMerge.length >= 2 && (
                <button
                  onClick={handleMerge}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  ✓ Fusionar {selectedForMerge.length} grupos
                </button>
              )}

              {/* Group Cards */}
              {groups.map((group) => (
                <div
                  key={group.id}
                  className={`bg-gray-700/50 rounded-lg p-3 border-l-4 transition-all ${
                    selectedGroupId === group.id ? 'ring-2 ring-pink-500' : ''
                  } ${showMergeDialog && selectedForMerge.includes(group.id) ? 'ring-2 ring-purple-500' : ''}`}
                  style={{ borderLeftColor: group.color }}
                >
                  {/* Editing Mode */}
                  {editingGroupId === group.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-2 py-1 bg-gray-600 text-white rounded border border-gray-500 focus:border-pink-500 focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-sm"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 px-2 py-1 bg-gray-600 text-gray-300 rounded text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Group Info */}
                      <div className="flex items-center justify-between mb-2">
                        <button
                          onClick={() => showMergeDialog ? handleToggleMergeSelection(group.id) : selectGroup(group.id)}
                          className="flex items-center gap-2 text-white font-medium hover:text-pink-400 transition-colors"
                        >
                          {showMergeDialog && (
                            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              selectedForMerge.includes(group.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-400'
                            }`}>
                              {selectedForMerge.includes(group.id) && <CheckIcon className="w-3 h-3 text-white" />}
                            </span>
                          )}
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                          <span>{group.name}</span>
                        </button>

                        {!showMergeDialog && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartEdit(group)}
                              className="p-1 text-gray-400 hover:text-white transition-colors"
                              title="Editar nombre"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteGroup(group.id, false)}
                              className="p-1 text-gray-400 hover:text-yellow-400 transition-colors"
                              title="Desagrupar"
                            >
                              <UngroupIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteGroup(group.id, true)}
                              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                              title="Eliminar grupo y clips"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Group Stats */}
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <ClipIcon className="w-3 h-3" />
                          {group.clipIds.length} clips
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {formatDuration(group.duration)}
                        </span>
                        <span className="flex items-center gap-1">
                          <TimeIcon className="w-3 h-3" />
                          @{formatDuration(group.startTime)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No hay grupos creados</p>
              <p className="text-xs">Selecciona 2 o más clips para agruparlos</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// ICONS
// ============================================================================

function ChevronIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function PlusIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function EditIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function TrashIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function UngroupIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function ClipIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
    </svg>
  );
}

function ClockIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TimeIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
  );
}

function CheckIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TimelineGroupPanel;
