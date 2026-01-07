for Android...
**IMPORTANT**: Increment `versionCode` in `app.json` (line 91) before building!
The `expo prebuild --clean` command regenerates build.gradle from app.json.

cd /Users/mattdyor/SparksApp
# Uninstall existing app to avoid signature mismatch
~/Library/Android/sdk/platform-tools/adb uninstall com.mattdyor.sparks || true
npm install
npx expo prebuild --clean
cd android && ./gradlew clean && cd ..
npx expo run:android --variant release

If you just wanna install the app that was built already...
adb install /Users/mattdyor/SparksApp/android/app/build/outputs/apk/release/app-release.apk

Run android emulator without studio
~/Library/Android/sdk/emulator/emulator -avd $(~/Library/Android/sdk/tools/emulator -list-avds | head -n 1)



Random hacking to get android to build
npx expo install --check
cd android && ./gradlew clean && cd ..

adb logcat -d | 
grep -E "AndroidRuntime|ReferenceError|FATAL EXCEPTION|
E/React"


