'use client';

/**
 * TagSelector - Visual Preference Category Selector for Moments
 *
 * Allows users to select one or more preference categories when publishing a moment.
 * Uses the 19 predefined categories from preferences.ts with visual cards.
 *
 * Features:
 * - Visual card grid with category images
 * - Multi-select capability
 * - Selected state indication (gradient border)
 * - Responsive grid layout
 * - Search/filter functionality
 *
 * @example
 * ```tsx
 * <TagSelector
 *   selectedTags={['ADVENTURE', 'CULTURAL']}
 *   onTagsChange={(tags) => setSelectedTags(tags)}
 *   maxTags={5}
 * />
 * ```
 */

import { useState, useMemo } from 'react';
import { Preferences } from '@/utils/preferences';
import Image from 'next/image';

// ============================================================================
// TYPES
// ============================================================================

export interface TagSelectorProps {
  /** Currently selected tag IDs */
  selectedTags: string[];

  /** Callback when tags selection changes */
  onTagsChange: (tags: string[]) => void;

  /** Maximum number of tags allowed (default: 5) */
  maxTags?: number;

  /** Show tag count indicator */
  showCount?: boolean;

  /** Custom className */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TagSelector({
  selectedTags,
  onTagsChange,
  maxTags = 5,
  showCount = true,
  className = ''
}: TagSelectorProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');

  // ============================================================================
  // FILTERED PREFERENCES
  // ============================================================================

  const filteredPreferences = useMemo(() => {
    if (!searchQuery.trim()) {
      return Preferences;
    }

    const query = searchQuery.toLowerCase();
    return Preferences.filter((pref) =>
      pref.name.toLowerCase().includes(query) ||
      pref.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleToggleTag = (tagId: string) => {
    const isSelected = selectedTags.includes(tagId);

    if (isSelected) {
      // Deselect
      onTagsChange(selectedTags.filter((id) => id !== tagId));
    } else {
      // Select (if under max limit)
      if (selectedTags.length < maxTags) {
        onTagsChange([...selectedTags, tagId]);
      } else {
        // Show feedback that max limit reached
        console.warn(`[TagSelector] Máximo ${maxTags} categorías permitidas`);
      }
    }
  };

  const handleClearAll = () => {
    onTagsChange([]);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Categorías del Momento
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Selecciona hasta {maxTags} categorías que describan tu momento
          </p>
        </div>

        {/* Tag Count and Clear */}
        {showCount && selectedTags.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium rounded-full">
              {selectedTags.length} / {maxTags}
            </div>
            <button
              onClick={handleClearAll}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar categorías..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 pl-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredPreferences.map((preference) => {
          const isSelected = selectedTags.includes(preference.id);
          const isMaxReached = selectedTags.length >= maxTags && !isSelected;

          return (
            <button
              key={preference.id}
              onClick={() => handleToggleTag(preference.id)}
              disabled={isMaxReached}
              className={`
                group relative aspect-square rounded-xl overflow-hidden
                transition-all duration-300 ease-out
                ${isSelected
                  ? 'ring-4 ring-pink-500 scale-105 shadow-lg'
                  : 'hover:scale-105 hover:shadow-md'
                }
                ${isMaxReached ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Image Background */}
              <div className="absolute inset-0">
                <Image
                  src={preference.uri}
                  alt={preference.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                />
              </div>

              {/* Overlay Gradient */}
              <div className={`
                absolute inset-0 bg-gradient-to-t
                ${isSelected
                  ? 'from-pink-600/90 to-purple-600/50'
                  : 'from-black/70 to-black/20 group-hover:from-pink-600/70 group-hover:to-purple-600/30'
                }
                transition-all duration-300
              `} />

              {/* Label */}
              <div className="absolute inset-0 flex items-end p-3">
                <span className="text-white text-sm font-semibold leading-tight line-clamp-2">
                  {preference.name}
                </span>
              </div>

              {/* Selected Checkmark */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-4 h-4 text-pink-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* No Results */}
      {filteredPreferences.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto w-16 h-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            No se encontraron categorías con &quot;{searchQuery}&quot;
          </p>
        </div>
      )}

      {/* Selected Tags Summary (Optional) */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400 self-center">
            Seleccionadas:
          </span>
          {selectedTags.map((tagId) => {
            const preference = Preferences.find((p) => p.id === tagId);
            if (!preference) return null;

            return (
              <span
                key={tagId}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 text-sm font-medium rounded-full"
              >
                {preference.name}
                <button
                  onClick={() => handleToggleTag(tagId)}
                  className="hover:bg-white/50 rounded-full p-0.5 transition-colors"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TagSelector;
