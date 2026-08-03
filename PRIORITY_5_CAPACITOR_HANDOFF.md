# Priority 5: Capacitor Wrap for Play Store — Handoff Document

## Context
This document is for the next agent who will implement Capacitor wrap (Phase 5) in a separate branch. All offline-first architecture (Phases 1-4) is complete and working on `main`.

## Current State (on `main`)

### ✅ Completed
- **Phase 1**: Local Dexie layer with 10 tables, correct indexes
- **Phase 2**: Sync engine with dependency-ordered sync, bounded retries, conflict handling
- **Phase 3**: PWA shell — manifest, service worker (Serwist), icons, offline fallback
- **Phase 4**: End-to-end offline testing verified on dev server

### Key Files
| Area | Files |
|------|-------|
| Local DB | `lib/local/db.ts`, `lib/local/types.ts`, `lib/local/utils.ts` |
| Repos | `lib/local/{session,customer,product,provider,bill,providerPayment,transaction}Repo.ts` |
| Sync | `lib/sync/syncEngine.ts`, `lib/sync/syncContext.tsx` |
| API Routes | `app/api/**/*` — all with `clientUuid` upsert, PATCH/DELETE |
| PWA | `app/manifest.ts`, `app/sw.ts`, `public/icons/*`, `next.config.mjs` |

### Build Status
```bash
npm run build  # ✅ passes
npm run lint   # ✅ passes
```

## Priority 5 Requirements

### 1. Initialize Capacitor
```bash
npm install @capacitor/core @capacitor/cli --save
npx cap init "Muhasiby" "com.muhasiby.app" --web-dir=out
npm install @capacitor/android --save
npx cap add android
```

### 2. Static Export Config
Modify `next.config.mjs` for static export (required for Capacitor):
```js
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // ... existing serwist config
}
```

**Known Issue**: Dynamic API routes (e.g., `/api/providers/[id]/payments`) need `generateStaticParams()` or must be excluded from static export. Options:
- Use `output: 'export'` with `generateStaticParams` for dynamic routes
- Or keep SSR mode and point Capacitor at the live Vercel URL (simpler, but requires network on first load)

### 3. Capacitor Config (`capacitor.config.ts`)
```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.muhasiby.app',
  appName: 'Muhasiby',
  webDir: 'out', // or 'dist' depending on build output
  server: {
    // If using live URL instead of static export:
    // url: 'https://your-vercel-app.vercel.app',
    // cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: 'release.keystore',
      keystoreAlias: 'muhasiby',
    }
  },
  plugins: {
    // Configure as needed
    SplashScreen: { launchShowDuration: 2000 },
    StatusBar: { style: 'dark', backgroundColor: '#000000' }
  }
};

export default config;
```

### 4. Build & Sync Workflow
```bash
npm run build        # builds to /out
npx cap sync android # copies web assets to android/app/src/main/assets/public
```

### 5. Android-Specific Considerations

#### Permissions (`android/app/src/main/AndroidManifest.xml`)
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<!-- For file downloads (PDF export) -->
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

#### Dexie/IndexedDB in WebView
- Works natively in Android System WebView (Chrome-based)
- Test: `window.indexedDB` availability on cold start
- Clear storage test: Settings → Apps → Muhasiby → Storage → Clear Storage

#### Service Worker in WebView
- Service workers work but may have different caching behavior
- Test: Open app → kill process → reopen offline → verify data loads

#### PDF Generation (react-pdf)
- Uses `@react-pdf/renderer` with `renderToStream`
- In WebView, `ReadableStream` → `NextResponse` works
- Test: Generate PDF offline, then online

### 6. Native Assets
```bash
# Generate adaptive icons, splash screens
npx @capacitor/assets generate --iconBackgroundColor "#000000" --splashBackgroundColor "#000000"
```

### 7. Signing & Release Build
```bash
# Generate keystore (once)
keytool -genkey -v -keystore release.keystore -alias muhasiby -keyalg RSA -keysize 2048 -validity 10000

# Build signed AAB
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### 8. Play Store Submission
- Upload `app-release.aab` to Play Console
- Fill store listing (use existing branding: Cairo font, black/white Uber-inspired palette)
- Target: Android 8.0+ (API 26+)
- Privacy policy URL required

## Testing Checklist for Capacitor Build

- [ ] Cold start with zero connectivity — app loads, shows cached data
- [ ] Create session, add transactions offline
- [ ] Toggle transaction status (Pending ↔ Confirmed) offline
- [ ] Add/edit customer offline
- [ ] Delete synced transaction offline → verify server DELETE on reconnect
- [ ] Reconnect → sync completes without duplicates
- [ ] Kill app mid-sync → reopen → sync resumes
- [ ] Generate PDF receipt offline
- [ ] Service worker caches app shell correctly
- [ ] "Add to Home Screen" works on Android Chrome
- [ ] Signed AAB installs and runs on physical device

## Branch Strategy
```bash
git checkout -b feature/capacitor-wrap
# Do all Capacitor work here
# Test thoroughly on device
# PR back to main when ready
```

## Known Gotchas
1. **Static export + dynamic API routes**: May need to convert API routes to static or use live URL
2. **PDF stream type**: `@react-pdf/renderer` returns `ReadableStream` — cast to `unknown` for NextResponse
3. **Dexie in WebView**: May need `android:usesCleartextTraffic="true"` for localhost during dev
4. **Service worker scope**: Ensure `/sw.js` scope is `/` in `capacitor.config.ts`

## Reference Files to Review
- `lib/sync/syncEngine.ts` — understands sync flow for testing
- `app/manifest.ts` — PWA config for native assets
- `next.config.mjs` — serwist config, may need export adjustments

---

**Start here**: Create branch, run `npm install @capacitor/core @capacitor/cli @capacitor/android`, then follow steps 1-8 above.