#!/bin/bash

# Pre-build version validation script

echo "🔍 Checking version configuration..."
echo ""

# Get version from app.json
APP_JSON_VERSION=$(node -e "console.log(require('./app.json').expo.version)")
echo "✓ app.json version: $APP_JSON_VERSION"

# Check if using managed workflow (no ios/android folders)
if [ ! -d "ios" ] && [ ! -d "android" ]; then
  echo "ℹ️  Using managed workflow (EAS will generate native code)"
  echo ""
  echo "✅ Version: $APP_JSON_VERSION"
  echo "   Ready to build!"
  exit 0
fi

# Check iOS Info.plist if it exists
if [ -f "ios/Sparks/Info.plist" ]; then
  IOS_VERSION=$(grep -A 1 "CFBundleShortVersionString" ios/Sparks/Info.plist | grep "string" | sed 's/.*<string>\(.*\)<\/string>.*/\1/')
  echo "✓ iOS Info.plist version: $IOS_VERSION"
  
  if [ "$APP_JSON_VERSION" != "$IOS_VERSION" ]; then
    echo ""
    echo "⚠️  WARNING: Version mismatch detected!"
    echo "   app.json: $APP_JSON_VERSION"
    echo "   iOS Info.plist: $IOS_VERSION"
    echo ""
    echo "Run this to fix:"
    echo "  npx expo prebuild --platform ios --clean"
    exit 1
  fi
else
  echo "ℹ️  iOS folder not found"
fi

# Check Android build.gradle if it exists
if [ -f "android/app/build.gradle" ]; then
  ANDROID_VERSION=$(grep "versionName" android/app/build.gradle | sed 's/.*versionName "\(.*\)".*/\1/')
  echo "✓ Android build.gradle version: $ANDROID_VERSION"
  
  if [ "$APP_JSON_VERSION" != "$ANDROID_VERSION" ]; then
    echo ""
    echo "⚠️  WARNING: Version mismatch detected!"
    echo "   app.json: $APP_JSON_VERSION"
    echo "   Android build.gradle: $ANDROID_VERSION"
    echo ""
    echo "Run this to fix:"
    echo "  npx expo prebuild --platform android --clean"
    exit 1
  fi
else
  echo "ℹ️  Android folder not found"
fi

echo ""
echo "✅ All versions match: $APP_JSON_VERSION"
echo "   Ready to build!"
