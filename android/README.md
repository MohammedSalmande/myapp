# SmartTask Android app (Trusted Web Activity)

This Android project wraps https://mohammed-salman.tech in a
[Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity).
It was generated with [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)
from the site's web manifest. The app shows the live website, so website
deploys reach app users immediately; a new store release is only needed for
changes to this project (name, icon, package settings, version).

- Package name: `tech.mohammedsalman.smarttask` (permanent once uploaded to Play)
- Site ↔ app verification: `public/.well-known/assetlinks.json`

## Signing key

The upload keystore is **not** in this repository. It lives on the VPS in
`/root/twa/signing/` (`smarttask-upload.jks` + `keystore.env` with the password).
Keep an offline backup of both files: every future update must be signed with
the same key (Play App Signing lets you reset a lost upload key, but only via
Google support).

## Releasing a new version

1. Bump `versionCode` (must always increase) and `versionName` in
   `app/build.gradle` and `twa-manifest.json`.
2. On the VPS, build with the Android SDK image:

   ```bash
   docker run --rm -v "$PWD":/project -v twa-gradle:/root/.gradle -w /project \
     ghcr.io/cirruslabs/android-sdk:36 ./gradlew --no-daemon bundleRelease assembleRelease
   ```

3. Sign the bundle with the upload key (`jarsigner`) and the APK with
   `zipalign` + `apksigner`, then upload the `.aab` in Play Console.

## After the first Play upload

Google re-signs the app with its own **app signing key**. Copy its SHA-256
fingerprint from Play Console → *Test and release → App integrity* and add it
to `sha256_cert_fingerprints` in `public/.well-known/assetlinks.json`, next to
the upload key's fingerprint. Without it, the Play-installed app shows a
browser address bar.
