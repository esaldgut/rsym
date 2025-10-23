# Marketplace Product Detail - Setup Guide

This guide covers the setup and configuration for the new marketplace product detail modal system implemented for YAAN.

## 🎯 Features Implemented

### 1. **Enhanced Card Hover Effect**
- Photographic oval frame effect on product cards
- Frame disappears on hover to reveal full landscape image
- Smooth transition animations

### 2. **Premium Gallery System**
- `ProductGalleryHeader`: Gallery with elegant bar indicators (no thumbnails) + auto-play carousel
- `FullscreenGallery`: Fullscreen view with sidebar thumbnails (desktop) and bottom strip (mobile) + independent auto-play
- Click-to-fullscreen functionality
- **Carousel Pause Coordination**: Main gallery auto-pauses when fullscreen opens, resumes when closed
- **forwardRef Pattern**: ProductGalleryHeader exposes `pause()` and `resume()` methods for external control
- Support for images and videos
- Arrow navigation, dots navigation, and keyboard shortcuts
- Play/pause controls on both galleries

### 3. **Redesigned Product Detail Modal**
- Smaller, more focused size (max-w-4xl)
- Parallax scroll sections instead of tabs
- Intersection Observer for active section tracking
- Sticky lateral navigation dots (desktop only)
- Sticky footer with CTA

### 4. **Horizontal Scrolling Season Cards**
- Beautiful gradient cards for pricing seasons
- Snap scroll behavior
- Selection state management
- Current season detection

### 5. **Interactive Map Integration** (Optional - requires AWS setup)
- Amazon Location Service integration
- Real route calculation and optimization
- MapLibre GL map rendering
- Custom markers and polylines
- Hybrid server-client architecture

## 📦 Required Dependencies

### Core Dependencies (Required)

These are likely already installed in your project:

```bash
# Already part of Next.js/React ecosystem
# - react
# - react-dom
# - next
```

### New Dependencies (Need to install)

```bash
# MapLibre GL for interactive maps
yarn add maplibre-gl

# MapLibre GL CSS (required for map styling)
# This is imported in CognitoLocationMap component

# AWS SDK for Location Service (server-side only)
yarn add @aws-sdk/client-location

# AWS SDK credential providers for auto-refresh (server-side only)
yarn add @aws-sdk/credential-providers

# AWS Location Service auth helper for Cognito Identity Pool (client-side)
yarn add @aws/amazon-location-utilities-auth-helper
```

**Dependency Details:**

| Package | Version | Purpose | Environment |
|---------|---------|---------|-------------|
| `maplibre-gl` | ^5.9.0 | Map rendering library | Client |
| `@aws-sdk/client-location` | ^3.873.0 | Route calculation SDK | Server |
| `@aws-sdk/credential-providers` | ^3.873.0 | Token auto-refresh | Server |
| `@aws/amazon-location-utilities-auth-helper` | ^1.2.3 | Cognito auth for maps | Client |

## 🔧 Environment Variables

Add these to your `.env.local` file:

```bash
# ===== AWS Location Service Configuration =====
# AWS credentials for server-side route calculation
# Development: Use ~/.aws/credentials file (default profile)
# Production: ECS Task IAM Role (auto-detected, no need to set)
AWS_ACCESS_KEY_ID=your-access-key-id          # Optional - uses ~/.aws/credentials if not set
AWS_SECRET_ACCESS_KEY=your-secret-access-key  # Optional - uses ~/.aws/credentials if not set
AWS_REGION=us-west-2

# Route calculator name in AWS Location Service
AWS_ROUTE_CALCULATOR_NAME=YaanTourismRouteCalculator
```

**Important Notes:**
- ❌ **No API keys needed** for map display - uses Cognito Identity Pool authentication
- ✅ **Client-side authentication**: Automatic via `amplify/outputs.json` configuration
- ✅ **Server-side authentication**: Uses Node Provider Chain (env vars → `~/.aws/credentials` → ECS Task Role)
- ✅ **Map tile access**: Granted by Cognito Identity Pool (no `NEXT_PUBLIC_LOCATION_API_KEY` needed)

## ☁️ AWS Location Service Setup

### 1. Create Map Resource

```bash
# In AWS Console > Amazon Location Service > Maps
# Create a map with name: YaanEsri
# Style: Esri Navigation
# Note the Map ARN
```

### 2. Create Route Calculator

```bash
# In AWS Console > Amazon Location Service > Route calculators
# Create calculator with name: YaanTourismRouteCalculator
# Data provider: Esri
# Note the Calculator ARN
```

### 3. Configure Cognito Identity Pool

**Authentication Method:** Cognito Identity Pool (No API keys needed)

The system uses AWS Cognito Identity Pool to grant temporary credentials for map tile access:

- **Identity Pool ID**: `us-west-2:00035e2e-e92f-4e72-a91b-454acba27eec`
- **Configuration**: Automatic via `amplify/outputs.json`
- **Map Access**: Granted through IAM role attached to authenticated identities

**Required IAM Permissions for Identity Pool Authenticated Role:**

The Cognito authenticated role needs permissions to access the map resource:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "geo:GetMapStyleDescriptor",
        "geo:GetMapGlyphs",
        "geo:GetMapSprites",
        "geo:GetMapTile"
      ],
      "Resource": [
        "arn:aws:geo:us-west-2:YOUR_ACCOUNT_ID:map/YaanEsri"
      ]
    }
  ]
}
```

**Setup Steps:**
1. Cognito Identity Pool should be created by AWS Amplify (automatic)
2. Attach the above policy to `YaanCognitoAuthenticatedRole`
3. Verify configuration exists in `amplify/outputs.json` → `auth.identity_pool_id`
4. Client automatically uses `withIdentityPoolId()` helper for authentication

### 4. IAM Permissions

Ensure your AWS credentials have these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "geo:CalculateRoute",
        "geo:OptimizeWaypoints"
      ],
      "Resource": [
        "arn:aws:geo:us-west-2:YOUR_ACCOUNT_ID:route-calculator/YaanTourismRouteCalculator"
      ]
    }
  ]
}
```

### 5. Token Auto-Refresh Strategy (Server-Side)

The route calculation API uses a **lazy client creation pattern** with automatic token refresh to prevent credential expiration errors.

#### Architecture Pattern

**❌ Anti-Pattern (DO NOT USE):**
```typescript
// Singleton client - credentials cached and can expire
const locationClient = new LocationClient({ region: AWS_REGION });
```

**✅ Correct Pattern (IMPLEMENTED):**
```typescript
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

// Lazy client creation - fresh credentials on each request
async function getLocationClient(): Promise<LocationClient> {
  return new LocationClient({
    region: AWS_REGION,
    credentials: fromNodeProviderChain({
      clientConfig: { region: AWS_REGION },
      timeout: 10000,
      maxRetries: 3
    })
  });
}
```

#### Auto-Retry on Token Expiration

The API implements automatic retry logic (max 2 attempts):
1. First attempt with current credentials
2. If token expired → wait 500ms → retry with fresh credentials
3. If still fails → return error to client

#### Expected Behavior

**Normal Request:**
```
🔐 Validating JWT...
✅ User authenticated
🔑 Creating LocationClient with fresh credentials...
🔄 Attempt 1/2...
✅ Successful on attempt 1
```

**Token Expiration Recovery:**
```
🔐 Validating JWT...
✅ User authenticated
🔑 Creating LocationClient with fresh credentials...
🔄 Attempt 1/2...
❌ Error: security token expired
🔁 Token expired, retrying with fresh credentials...
🔑 Creating LocationClient with fresh credentials...
🔄 Attempt 2/2...
✅ Successful on attempt 2
```

#### Credential Sources (Node Provider Chain)

The system automatically tries these credential sources in order:
1. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. `~/.aws/credentials` file (profile: default)
3. ECS Task IAM Role (production - auto-refreshed)
4. EC2 Instance Metadata Service (if applicable)

#### Benefits

- ✅ **Auto-recovery** from token expiration
- ✅ **No manual intervention** required
- ✅ **Works in dev and prod** (local credentials → ECS Task Role)
- ✅ **Comprehensive logging** for debugging

## 🚀 Installation Steps

### Step 1: Install Dependencies

```bash
cd /Users/esaldgut/dev/src/react/nextjs/yaan-web
yarn add maplibre-gl @aws-sdk/client-location @aws-sdk/credential-providers @aws/amazon-location-utilities-auth-helper
```

**What gets installed:**
- `maplibre-gl@^5.9.0` - Map rendering
- `@aws-sdk/client-location@^3.873.0` - Route calculation (server)
- `@aws-sdk/credential-providers@^3.873.0` - Token auto-refresh (server)
- `@aws/amazon-location-utilities-auth-helper@^1.2.3` - Cognito auth (client)

### Step 2: Add Environment Variables

Create or update `.env.local`:

```bash
cp .env.local.example .env.local
# Then edit .env.local with your AWS credentials
```

### Step 3: Interactive Map (Auto-Detection)

The system uses **HybridProductMap** which automatically detects AWS Location Service configuration:

#### A. WITH AWS Configuration (Interactive Map)

If `amplify/outputs.json` contains Cognito Identity Pool configuration:
- Uses `CognitoLocationMap` - Interactive map with route calculation
- Cognito authentication for map tiles
- Real-time route optimization
- Distance and duration display

**No code changes needed** - automatic detection works out of the box!

#### B. WITHOUT AWS Configuration (Decorative Map)

If AWS is not configured:
- Falls back to `ProductMap` - Decorative static map
- No route calculation
- Visual representation of destinations
- No authentication required

**Benefits:**
- ✅ Works immediately without AWS setup
- ✅ Automatic fallback to decorative map
- ✅ No code changes when AWS is added later
- ✅ Graceful degradation

## 🧪 Testing

### Test 1: Card Hover Effect

1. Navigate to `/marketplace`
2. Hover over any product card
3. Verify the oval frame disappears and full image shows
4. Verify smooth transition

### Test 2: Product Detail Modal & Auto-Play Carousel

1. Click on any product card
2. Modal should open with:
   - Gallery header (no thumbnails, bar indicators)
   - **Auto-play carousel** advancing every 5 seconds
   - Play/pause button for manual control
   - Arrow navigation and dots navigation
   - Product information
   - Scroll sections (no tabs)
   - Sticky navigation dots on left (desktop)
   - Horizontal scrolling season cards
   - Sticky footer with price and CTA
3. Verify carousel auto-play:
   - Images/videos advance automatically
   - Clicking arrow or dot pauses auto-play
   - Play button resumes auto-play
   - Counter shows current position (e.g., "3/5")

### Test 3: Fullscreen Gallery & Carousel Coordination

1. Open product detail modal
2. **Observe main gallery auto-playing**
3. Click on gallery header image
4. Fullscreen gallery should open
5. Verify:
   - **Main gallery carousel pauses automatically** (check console logs)
   - Fullscreen gallery has independent auto-play
   - Sidebar thumbnails (desktop)
   - Bottom thumbnail strip (mobile)
   - Arrow navigation and keyboard navigation (Arrow Left/Right)
   - Play/pause button works
   - ESC key closes gallery
   - Close button works
6. Close fullscreen gallery
7. Verify:
   - **Main gallery carousel resumes automatically** (check console logs)
   - Only one carousel auto-playing at a time

**Expected Console Logs:**
```
[ProductDetailModal] 🖼️ Abriendo galería fullscreen
[ProductGalleryHeader] 🎬 Pausando carrusel desde parent
[ProductDetailModal] 🔙 Cerrando galería fullscreen
[ProductGalleryHeader] ▶️ Reanudando carrusel desde parent
```

### Test 4: Interactive Map (if configured)

1. Open product detail modal
2. Scroll to "Mapa de Ruta" section
3. Verify:
   - Map loads with custom markers
   - For circuits: polyline route displayed
   - Click markers to see popups
   - Route information card shows distance/time
   - Destinations list below map

### Test 5: Responsive Design

Test on different screen sizes:
- Desktop (1920px): All features visible
- Tablet (768px): Navigation dots hidden, mobile layout
- Mobile (375px): Horizontal scroll works, gallery adapts

## 🎨 Customization

### Colors

The implementation uses YAAN's brand colors:
- Pink: `#ec4899` (pink-500)
- Purple: `#9333ea` (purple-600)

To customize, search and replace in:
- `src/components/marketplace/ProductGalleryHeader.tsx`
- `src/components/marketplace/FullscreenGallery.tsx`
- `src/components/marketplace/SeasonCard.tsx`
- `src/components/marketplace/ProductDetailModal.tsx`
- `src/components/marketplace/maps/CognitoLocationMap.tsx`

### Animations

Adjust animation durations in Tailwind classes:
- `duration-300` → faster
- `duration-500` → slower

### Map Markers

Customize marker appearance in `CognitoLocationMap.tsx`:

```typescript
// Change marker colors, size, or icons in marker creation section
markerEl.innerHTML = `
  <div style="
    background: linear-gradient(135deg, #YOUR_COLOR_1, #YOUR_COLOR_2);
    // ... other styles
  ">
```

**Note:** Marker customization only applies when using `CognitoLocationMap` (interactive map with AWS configuration).

## 📁 File Structure

```
src/
├── app/
│   ├── marketplace/
│   │   └── marketplace-client.tsx              # Card hover effect
│   └── api/
│       └── routes/
│           └── calculate/
│               └── route.ts                    # Route calculation API with token auto-refresh
├── components/
│   ├── marketplace/
│   │   ├── ProductDetailModal.tsx              # Main modal with carousel coordination
│   │   ├── ProductGalleryHeader.tsx            # Gallery with auto-play + forwardRef
│   │   ├── FullscreenGallery.tsx               # Fullscreen gallery with independent auto-play
│   │   ├── SeasonCard.tsx                      # Horizontal season cards
│   │   ├── ProductMap.tsx                      # Decorative map (fallback)
│   │   └── maps/
│   │       ├── CognitoLocationMap.tsx          # Interactive map with Cognito auth
│   │       └── HybridProductMap.tsx            # Hybrid map strategy (auto-detection)
│   └── ui/
│       ├── S3GalleryImage.tsx                  # S3 image component for galleries
│       └── CarouselDots.tsx                    # Carousel navigation dots
└── hooks/
    ├── useProductDetail.ts                     # Modal state management
    ├── useCarousel.ts                          # Auto-play carousel hook
    └── useS3Image.ts                           # S3 image loading hook
```

## 🐛 Troubleshooting

### Issue: Map not loading

**Solution:**
1. Check `NEXT_PUBLIC_LOCATION_API_KEY` is set
2. Verify API key has permissions for the map resource
3. Check browser console for errors
4. Verify AWS region matches your resources

### Issue: Route calculation fails

**Solution:**
1. Check AWS credentials are correct
2. Verify `AWS_ROUTE_CALCULATOR_NAME` matches your calculator
3. Check IAM permissions for CalculateRoute and OptimizeWaypoints
4. Review API route logs: `yarn dev` and check terminal output

### Issue: Token expiration errors (500 status)

**Symptoms:**
- API returns 500 error with "security token expired" message
- Route calculation works intermittently
- Error occurs after credentials have been idle for a while

**Root Cause:**
AWS temporary credentials (especially from ECS Task Role) expire after a period of time.

**Solution (Already Implemented):**
The system automatically handles token expiration with retry logic:
1. First attempt fails with expired token
2. System waits 500ms
3. Creates new client with fresh credentials
4. Retries automatically (max 2 attempts)
5. If successful → returns route data
6. If still fails → returns error with `errorCode: 'CREDENTIALS_EXPIRED'`

**Expected Logs:**
```
[API /api/routes/calculate] 🔄 Attempt 1/2...
[API /api/routes/calculate] ❌ Error: security token expired
[API /api/routes/calculate] 🔁 Token expired, retrying...
[API /api/routes/calculate] 🔄 Attempt 2/2...
[API /api/routes/calculate] ✅ Successful on attempt 2
```

**If Auto-Recovery Fails:**
1. Check AWS credentials configuration (`~/.aws/credentials` or ECS Task Role)
2. Verify credential provider chain is working: `fromNodeProviderChain`
3. Check CloudWatch logs for detailed error messages
4. Verify IAM role has `geo:CalculateRoute` permission
5. Ensure `@aws-sdk/credential-providers` package is installed

### Issue: Fullscreen gallery not showing

**Solution:**
1. Check if images/videos exist in product data
2. Verify z-index (should be 100)
3. Check for JavaScript errors in console
4. Ensure body scroll lock is working

### Issue: Season cards not scrolling horizontally

**Solution:**
1. Verify parent container has `overflow-x-auto`
2. Check cards have `flex-shrink-0`
3. Ensure `snap-x` and `snap-mandatory` are applied
4. Test on different browsers

### Issue: Navigation dots not showing

**Solution:**
1. Only visible on desktop (`lg:` breakpoint)
2. Check if sections have content (conditional rendering)
3. Verify Intersection Observer is tracking sections
4. Check z-index (should be 40)

## 📚 Additional Resources

- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js-docs/)
- [AWS Location Service Documentation](https://docs.aws.amazon.com/location/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Tailwind CSS v4](https://tailwindcss.com/)

## 🔄 Fallback Behavior & Auto-Detection

The system uses **`HybridProductMap`** component which automatically detects AWS configuration:

### Auto-Detection Logic

**WITH AWS Configuration** (Interactive Map):
- Detects: `amplify/outputs.json` contains `auth.identity_pool_id`
- Uses: **`CognitoLocationMap`** component
- Features:
  - ✅ Interactive map with MapLibre GL
  - ✅ Cognito Identity Pool authentication
  - ✅ Real-time route calculation and optimization
  - ✅ Distance and duration display
  - ✅ Custom markers with popups

**WITHOUT AWS Configuration** (Decorative Map):
- Detects: No Identity Pool configuration
- Falls back to: **`ProductMap`** component
- Features:
  - ✅ Static visual representation of destinations
  - ✅ No authentication required
  - ❌ No route calculation
  - ❌ No distance/time information

### Benefits

- ✅ **Zero configuration needed** - automatic detection
- ✅ **Graceful degradation** - works without AWS setup
- ✅ **No code changes required** when AWS is added later
- ✅ **Developer-friendly** - maintains visual appeal in both modes

**Component Architecture:**
```
ProductDetailModal
    ↓
HybridProductMap (auto-detection)
    ↓
    ├─→ CognitoLocationMap (if AWS configured)
    └─→ ProductMap (if no AWS)
```

## 🔄 Migration Guide (API Keys → Cognito)

**If you're upgrading from a version that used API keys:**

### What Changed (v1.0.0 → v1.1.0)

| Aspect | v1.0.0 (Old) | v1.1.0 (Current) |
|--------|--------------|------------------|
| **Authentication** | API Keys (`NEXT_PUBLIC_LOCATION_API_KEY`) | Cognito Identity Pool |
| **Map Component** | `AmazonLocationMap` (direct) | `HybridProductMap` (auto-detection) |
| **Client Auth** | Public API key exposed | Temporary credentials via Cognito |
| **Configuration** | Manual API key creation | Automatic via Amplify |
| **Dependencies** | 3 packages | 4 packages (added auth helper) |

### Migration Steps

1. **Remove old environment variables:**
   ```bash
   # Remove from .env.local
   - NEXT_PUBLIC_LOCATION_API_KEY=...
   ```

2. **Install missing dependency:**
   ```bash
   yarn add @aws/amazon-location-utilities-auth-helper
   ```

3. **Update AWS Configuration:**
   - ❌ Delete API key from AWS Console (no longer needed)
   - ✅ Ensure Cognito Identity Pool exists (auto-created by Amplify)
   - ✅ Attach IAM policy to `YaanCognitoAuthenticatedRole` (see Section 3)

4. **Verify `amplify/outputs.json`:**
   ```json
   {
     "auth": {
       "identity_pool_id": "us-west-2:00035e2e-e92f-4e72-a91b-454acba27eec",
       "user_pool_id": "...",
       "aws_region": "us-west-2"
     }
   }
   ```

5. **No code changes needed:**
   - `HybridProductMap` automatically detects Cognito configuration
   - Component switches from `ProductMap` to `CognitoLocationMap` automatically

### Benefits of Migration

- ✅ **Security**: No API keys exposed in client code
- ✅ **Automatic**: Configuration managed by Amplify
- ✅ **Temporary credentials**: Auto-refresh via Cognito
- ✅ **Fine-grained permissions**: IAM policies control access

## ✅ Deployment Checklist

Before deploying to production:

### Dependencies & Environment
- [ ] Install all 4 required packages:
  - [ ] `maplibre-gl@^5.9.0`
  - [ ] `@aws-sdk/client-location@^3.873.0`
  - [ ] `@aws-sdk/credential-providers@^3.873.0`
  - [ ] `@aws/amazon-location-utilities-auth-helper@^1.2.3`
- [ ] Add environment variables to hosting platform (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ROUTE_CALCULATOR_NAME`)
- [ ] Remove any old `NEXT_PUBLIC_LOCATION_API_KEY` references (obsolete)

### AWS Configuration
- [ ] Verify Cognito Identity Pool exists in `amplify/outputs.json`
- [ ] Confirm `YaanCognitoAuthenticatedRole` has map permissions (`geo:GetMap*`)
- [ ] Test AWS Location Service in staging environment
- [ ] Verify route calculator `YaanTourismRouteCalculator` exists and is accessible
- [ ] Test token auto-refresh with temporary credentials (ECS Task Role)

### Features Testing
- [ ] Verify carousel pause coordination works (main gallery pauses when fullscreen opens)
- [ ] Test auto-play carousel behavior on multiple products
- [ ] Check map loads correctly with Cognito authentication (no API key needed)
- [ ] Verify `HybridProductMap` auto-detection (falls back to `ProductMap` if no AWS)
- [ ] Test route calculation with JWT authentication
- [ ] Verify distance and duration display correctly

### General Testing
- [ ] Test on multiple devices and browsers
- [ ] Verify pricing display is accurate
- [ ] Test reservation flow from modal
- [ ] Review console for any errors or warnings
- [ ] Performance test with large image galleries
- [ ] Check CloudWatch logs for route calculation errors

---

**Implementation Date:** 2025-10-21
**Last Updated:** 2025-10-22 (Added token auto-refresh + carousel pause coordination)
**Version:** 1.1.0
**Contact:** See CLAUDE.md for project details
