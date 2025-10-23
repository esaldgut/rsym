# Deep Linking System - YAAN Platform

## 📱 Overview

The YAAN Deep Linking System enables seamless navigation between web and mobile app experiences. When users click on shared links, they're automatically directed to the appropriate destination - either opening the app if installed, or displaying content on the web as a fallback.

## 🎯 Key Features

- **Universal Links (iOS)** - Direct app opening without prompts
- **App Links (Android)** - Seamless app navigation
- **Smart Fallback** - Web experience when app isn't installed
- **Query Parameter Support** - Deep link to specific content
- **SmartAppBanner** - Promote app installation on mobile web
- **Security Built-in** - XSS prevention and input validation

## 🚀 Quick Start

### For Web Developers

1. **Set Environment Variables**
```bash
# .env.local
NEXT_PUBLIC_BASE_URL=https://yaan.com.mx
NEXT_PUBLIC_APP_SCHEME=yaan
NEXT_PUBLIC_IOS_APP_ID=123456789
NEXT_PUBLIC_ANDROID_PACKAGE_NAME=com.yaan.app
```

2. **Use Deep Link Generation**
```typescript
import { generateShareableUrls } from '@/utils/deep-link-utils';

const urls = generateShareableUrls('/marketplace', {
  product: 'abc123',
  type: 'circuit'
});

// Returns:
// {
//   webUrl: 'https://yaan.com.mx/marketplace?product=abc123&type=circuit',
//   deepLink: 'yaan://marketplace?product=abc123&type=circuit',
//   universalLink: 'https://yaan.com.mx/marketplace?product=abc123&type=circuit'
// }
```

3. **Handle Query Parameters**
```typescript
import { validateDeepLinkParams } from '@/utils/validators';

// In your component
const searchParams = useSearchParams();
const validated = validateDeepLinkParams(searchParams);

if (validated.product) {
  // Safe to use - validated and sanitized
  openProductModal(validated.product);
}
```

### For Mobile Developers

1. **Update Verification Files**

Edit `.well-known/assetlinks.json` (Android):
```json
{
  "package_name": "com.yaan.app",  // Your actual package name
  "sha256_cert_fingerprints": [
    "AA:BB:CC:..."  // Your app's SHA256 fingerprint
  ]
}
```

Edit `.well-known/apple-app-site-association` (iOS):
```json
{
  "appID": "TEAMID.com.yaan.app"  // Your Team ID + Bundle ID
}
```

2. **Handle Deep Links in App**
- Parse URLs with pattern: `https://yaan.com.mx/path?params`
- Extract query parameters
- Navigate to appropriate screen

## 📋 Supported Deep Links

### Marketplace Products
```
https://yaan.com.mx/marketplace?product=ID&type=TYPE
```
- Opens specific product modal
- Auto-fetches product if not loaded
- Types: `circuit` or `package`

### Future Support (Prepared)
```
https://yaan.com.mx/moments?moment=ID
https://yaan.com.mx/booking?product=ID&adults=2&kids=1
```

## 🔒 Security Features

### Input Validation
All query parameters are automatically validated:
- **UUID validation** for IDs
- **Alphanumeric only** for types
- **Maximum 100 characters** per parameter
- **XSS sanitization** on all strings

### Safe Usage
```typescript
// ❌ UNSAFE - Never use raw parameters
const productId = searchParams.get('product');

// ✅ SAFE - Always validate first
const validated = validateDeepLinkParams(searchParams);
const productId = validated.product; // Sanitized and safe
```

## 📲 SmartAppBanner

The SmartAppBanner automatically promotes app installation on mobile devices:

### Features
- **Auto-detection** of iOS/Android
- **Smart timing**: 5s first visit, 10s return visits
- **Persistence**: Remembers dismissal for 7 days
- **Non-intrusive**: z-40 (below modals)

### Customization
```typescript
// Environment variables
NEXT_PUBLIC_ENABLE_SMART_APP_BANNER=true
NEXT_PUBLIC_SMART_APP_BANNER_DELAY_MS=5000
```

## 🧪 Testing

### Test Page
Visit `/test-deeplink` in development to:
- Check device detection
- Generate test deep links
- Verify parameter handling
- Test SmartAppBanner

### Verification Commands
```bash
# Verify Android configuration
curl https://yaan.com.mx/.well-known/assetlinks.json

# Verify iOS configuration
curl https://yaan.com.mx/.well-known/apple-app-site-association

# Test deep link
curl "https://yaan.com.mx/marketplace?product=test-123&type=circuit"
```

## 🏗️ Architecture

### Components
```
📁 deep-linking/
├── 📄 .well-known/assetlinks.json          # Android verification
├── 📄 .well-known/apple-app-site-association # iOS verification
├── 📄 utils/deep-link-utils.ts             # Core utilities
├── 📄 utils/validators.ts                  # Input validation
├── 📄 components/ui/SmartAppBanner.tsx     # App promotion
└── 📄 server/marketplace-product-actions.ts # Product fetching
```

### Flow Diagram
```
User clicks link → yaan.com.mx/marketplace?product=123
                    ↓
        [App Installed?] ←─── OS checks .well-known files
              ↓     ↓
           Yes      No
            ↓        ↓
      Open App    Open Web
          ↓          ↓
    Parse params  Load page
          ↓          ↓
    Show product  Show modal + SmartAppBanner
```

## ⚠️ Common Issues

### Deep Link Not Opening App
- **Check**: .well-known files are accessible via HTTPS
- **Check**: SHA256/Team ID are correct
- **Check**: App has Universal Links/App Links configured

### Product Not Loading
- **Check**: Product ID is valid UUID or alphanumeric
- **Check**: `getProductByIdAction` server action is working
- **Check**: User has authentication cookies

### SmartAppBanner Not Showing
- **Check**: `NEXT_PUBLIC_ENABLE_SMART_APP_BANNER=true`
- **Check**: Viewing on actual mobile device (not desktop)
- **Check**: Not previously dismissed (check localStorage)

## 📚 Additional Resources

- [Technical Documentation](../DEEP_LINKING_WEB_IMPLEMENTATION.md)
- [Android App Links Guide](https://developer.android.com/training/app-links)
- [iOS Universal Links Guide](https://developer.apple.com/documentation/uikit/inter-process_communication/allowing_apps_and_websites_to_link_to_your_content)
- [Test Page](/test-deeplink) (development only)

## 🤝 Support

For issues or questions:
1. Check the [Common Pitfalls](../../CLAUDE.md#common-pitfalls) section
2. Review the [test page](/test-deeplink) for diagnostics
3. Contact the development team

---

**Version:** 2.0.0
**Last Updated:** 2025-10-23
**Status:** ✅ Production Ready (with environment configuration)