'use client';

/**
 * FriendsTagging - Friend Tagging Component for Moments
 *
 * Allows users to tag friends/connections when publishing a moment.
 * Fetches user's connections from GraphQL and provides multi-select interface.
 *
 * Features:
 * - Fetches connections via getMyConnections query
 * - Visual grid with friend avatars and names
 * - Multi-select capability
 * - Search/filter functionality
 * - Loading and error states
 * - Responsive layout
 *
 * @example
 * ```tsx
 * <FriendsTagging
 *   selectedFriends={['sub-123', 'sub-456']}
 *   onFriendsChange={(friendIds) => setSelectedFriends(friendIds)}
 *   maxFriends={10}
 * />
 * ```
 */

import { useState, useEffect, useMemo } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useAmplifyAuth } from '@/hooks/useAmplifyAuth';
import type { User, FriendshipConnection } from '@/graphql/operations';
import { getMyConnections } from '@/graphql/operations';
import { ProfileImage } from '@/components/ui/ProfileImage';

// ============================================================================
// TYPES
// ============================================================================

export interface FriendsTaggingProps {
  /** Currently selected friend IDs (user subs) */
  selectedFriends: string[];

  /** Callback when friend selection changes */
  onFriendsChange: (friendIds: string[]) => void;

  /** Maximum number of friends allowed (default: 10) */
  maxFriends?: number;

  /** Show friend count indicator */
  showCount?: boolean;

  /** Custom className */
  className?: string;
}

interface FriendData {
  sub: string;
  username?: string | null;
  name?: string | null;
  avatar_url?: string | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FriendsTagging({
  selectedFriends,
  onFriendsChange,
  maxFriends = 10,
  showCount = true,
  className = ''
}: FriendsTaggingProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAmplifyAuth();

  // ============================================================================
  // FETCH FRIENDS
  // ============================================================================

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('[FriendsTagging] 📡 Fetching connections from GraphQL...');

        // Initialize GraphQL client
        const client = generateClient();

        // Fetch connections with ACCEPTED status
        const { data, errors } = await client.graphql({
          query: getMyConnections,
          variables: {
            limit: 100,
            status: 'ACCEPTED'
          }
        });

        // Handle GraphQL errors
        if (errors && errors.length > 0) {
          console.error('[FriendsTagging] ❌ GraphQL errors:', errors);
          setError(errors[0]?.message || 'Error al cargar amigos');
          return;
        }

        // Handle no data
        if (!data?.getMyConnections) {
          console.warn('[FriendsTagging] ⚠️ No data returned from getMyConnections');
          setFriends([]);
          return;
        }

        // Transform GraphQL response to FriendData format
        const friendsData: FriendData[] = data.getMyConnections.items
          ?.filter(friendship => friendship?.friend) // Filter out null/undefined
          .map(friendship => ({
            sub: friendship.friend!.sub || '',
            username: friendship.friend!.username || null,
            name: friendship.friend!.name || null,
            avatar_url: friendship.friend!.avatar_url || null
          })) || [];

        console.log(`[FriendsTagging] ✅ Loaded ${friendsData.length} friends`);
        setFriends(friendsData);

      } catch (err) {
        console.error('[FriendsTagging] Error fetching friends:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar amigos');
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [user]);

  // ============================================================================
  // FILTERED FRIENDS
  // ============================================================================

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) {
      return friends;
    }

    const query = searchQuery.toLowerCase();
    return friends.filter((friend) =>
      friend.name?.toLowerCase().includes(query) ||
      friend.username?.toLowerCase().includes(query)
    );
  }, [friends, searchQuery]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleToggleFriend = (friendId: string) => {
    const isSelected = selectedFriends.includes(friendId);

    if (isSelected) {
      // Deselect
      onFriendsChange(selectedFriends.filter((id) => id !== friendId));
    } else {
      // Select (if under max limit)
      if (selectedFriends.length < maxFriends) {
        onFriendsChange([...selectedFriends, friendId]);
      } else {
        console.warn(`[FriendsTagging] Máximo ${maxFriends} amigos permitidos`);
      }
    }
  };

  const handleClearAll = () => {
    onFriendsChange([]);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!user) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-600 dark:text-gray-400">
          Inicia sesión para etiquetar amigos
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="inline-block w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Cargando amigos...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <svg
          className="mx-auto w-12 h-12 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="mt-3 text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Etiquetar Amigos
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Etiqueta hasta {maxFriends} amigos en tu momento
          </p>
        </div>

        {/* Friend Count and Clear */}
        {showCount && selectedFriends.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium rounded-full">
              {selectedFriends.length} / {maxFriends}
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
          placeholder="Buscar amigos..."
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

      {/* Friends Grid */}
      {friends.length === 0 ? (
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            No tienes amigos conectados todavía
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            Conecta con otros viajeros para etiquetarlos en tus momentos
          </p>
        </div>
      ) : filteredFriends.length === 0 ? (
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
            No se encontraron amigos con &quot;{searchQuery}&quot;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredFriends.map((friend) => {
            const isSelected = selectedFriends.includes(friend.sub);
            const isMaxReached = selectedFriends.length >= maxFriends && !isSelected;

            return (
              <button
                key={friend.sub}
                onClick={() => handleToggleFriend(friend.sub)}
                disabled={isMaxReached}
                className={`
                  group relative p-4 rounded-xl border-2 transition-all duration-300
                  ${isSelected
                    ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 shadow-lg scale-105'
                    : 'border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md'
                  }
                  ${isMaxReached ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {/* Avatar */}
                <div className="flex justify-center mb-3">
                  <div className={`relative ${isSelected ? 'ring-4 ring-pink-500' : ''} rounded-full`}>
                    <ProfileImage
                      src={friend.avatar_url || undefined}
                      alt={friend.name || friend.username || 'Friend'}
                      fallbackText={friend.name?.charAt(0) || friend.username?.charAt(0) || 'A'}
                      size="lg"
                    />

                    {/* Selected Checkmark */}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg
                          className="w-4 h-4 text-white"
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
                  </div>
                </div>

                {/* Name */}
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {friend.name || friend.username}
                  </p>
                  {friend.name && friend.username && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mt-0.5">
                      @{friend.username}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Friends Summary */}
      {selectedFriends.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400 self-center">
            Etiquetados:
          </span>
          {selectedFriends.map((friendId) => {
            const friend = friends.find((f) => f.sub === friendId);
            if (!friend) return null;

            return (
              <span
                key={friendId}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 text-sm font-medium rounded-full"
              >
                {friend.name || friend.username}
                <button
                  onClick={() => handleToggleFriend(friendId)}
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

export default FriendsTagging;
