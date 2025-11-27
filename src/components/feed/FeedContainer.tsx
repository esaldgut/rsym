import { Suspense } from 'react';
import { FeedGrid } from './FeedGrid';
import { FeedSkeleton } from './FeedSkeleton';
import { getMomentsAction } from '@/lib/server/moments-actions';
// ✅ Migrado de @/lib/graphql/types a @/generated/graphql (GraphQL Code Generator)
import type { Moment } from '@/generated/graphql';

interface FeedContainerProps {
  type?: 'moments' | 'marketplace';
  initialPosts?: Moment[];
  showCreatePost?: boolean;
}

// Server Component con cache
export async function FeedContainer({ 
  type = 'moments',
  initialPosts,
  showCreatePost = true
}: FeedContainerProps) {
  // Si no hay posts iniciales, cargarlos
  const postsData = initialPosts || await loadPosts(type);
  
  return (
    <div className="w-full">
      <Suspense fallback={<FeedSkeleton />}>
        <FeedGrid 
          type={type}
          initialPosts={postsData}
          showCreatePost={showCreatePost}
        />
      </Suspense>
    </div>
  );
}

// Función helper para cargar posts
async function loadPosts(type: string): Promise<Moment[]> {
  if (type === 'moments') {
    const result = await getMomentsAction(20);
    return result.success ? result.moments : [];
  }
  
  // Para marketplace usaríamos otra action
  return [];
}