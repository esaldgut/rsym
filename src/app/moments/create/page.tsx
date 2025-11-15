import { UnifiedAuthSystem } from '@/lib/auth/unified-auth-system';
import { CreateMomentClient } from './create-moment-client';

/**
 * Create Moment Page - Server Component
 *
 * Validates authentication and renders 3-phase moment creation flow:
 * 1. Upload - Original media upload to S3
 * 2. Edit - IMG.LY CE.SDK professional editing
 * 3. Publish - Complete metadata and publish
 *
 * Supports: traveler, influencer, provider user types
 */
export default async function CreateMomentPage() {
  // Validate authentication (permite traveler, influencer, provider)
  const validation = await UnifiedAuthSystem.requireAuthentication('/moments/create');

  const userId = validation.user?.id || '';
  const username = validation.user?.username || validation.user?.email?.split('@')[0] || 'Usuario';

  return <CreateMomentClient userId={userId} username={username} />;
}
