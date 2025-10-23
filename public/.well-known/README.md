# Deep Linking Configuration Files

This directory contains the verification files required for Android App Links and iOS Universal Links.

## Files

### assetlinks.json (Android)
This file verifies ownership between the website and the Android app.

**TODO - Update with actual values:**
- `package_name`: Replace `com.yaan.app` with the actual Android package name
- `sha256_cert_fingerprints`: Replace TODO placeholders with:
  - Production SHA256 fingerprint (from Google Play Console)
  - Development SHA256 fingerprint (from debug keystore)

To get the SHA256 fingerprint:
```bash
# For debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# For production keystore
keytool -list -v -keystore path/to/production.keystore -alias your-alias
```

### apple-app-site-association (iOS)
This file verifies ownership between the website and the iOS app.

**TODO - Update with actual values:**
- `TEAM_ID`: Replace with your Apple Developer Team ID (e.g., "ABCDE12345")
- `com.yaan.app`: Replace with the actual iOS Bundle ID if different

To find your Team ID:
1. Log in to [Apple Developer Portal](https://developer.apple.com)
2. Go to Membership section
3. Your Team ID is listed there

## Testing

### Android
After deploying, verify the file is accessible:
```bash
curl https://yaan.com.mx/.well-known/assetlinks.json
```

Test with Google's verification tool:
https://developers.google.com/digital-asset-links/tools/generator

### iOS
After deploying, verify the file is accessible:
```bash
curl https://yaan.com.mx/.well-known/apple-app-site-association
```

Test with Apple's verification tool:
https://search.developer.apple.com/appsearch-validation-tool

## Deployment

These files are served automatically by Next.js from the `public` directory.
The headers are configured in `next.config.mjs` to serve them with the correct content type.

## Important Notes

1. **Both files must be served over HTTPS**
2. **Files must be accessible without redirects**
3. **Content-Type must be `application/json`**
4. **Files should be cached (1 hour is configured)**
5. **Update both files when app certificates or bundle IDs change**

## References

- [Android App Links Documentation](https://developer.android.com/training/app-links)
- [iOS Universal Links Documentation](https://developer.apple.com/documentation/uikit/inter-process_communication/allowing_apps_and_websites_to_link_to_your_content)