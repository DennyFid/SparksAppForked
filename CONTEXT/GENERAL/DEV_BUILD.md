# Development Builds Guide

## Overview

This guide explains how to switch from Expo Go to development builds for the Sparks app. Development builds allow you to use native modules (like Firebase) while maintaining the Expo development experience.

## What Are Development Builds?

### Expo Go vs Development Builds

**Expo Go:**
- Pre-built app with limited native modules
- Can't add custom native code
- Great for prototyping and simple apps
- Free but limited functionality

**Development Builds:**
- Custom-built app with your specific native modules
- Can include Firebase, custom native code, etc.
- More powerful but requires building
- Can be built locally (free) or on EAS (paid)

### Why We Need Development Builds

Our Sparks app now includes:
- **Firebase integration** (not available in Expo Go)
- **Custom native modules** for analytics
- **Advanced notification features**
- **Third-party native dependencies**

## Quick Start (TL;DR)

If you just want to get started quickly:

```bash
# 1. Install dependencies
npm install -g @expo/eas-cli
npm install @react-native-firebase/app @react-native-firebase/firestore
npx expo install expo-dev-client

# 2. Build development build (creates ios/ and android/ folders)
npx expo run:ios --device
# or
npx expo run:android --device
npx expo run:android
npx expo start --dev-client

# 3. Configure Firebase (after folders are created)
# - Create Firebase project
# - Download config files to ios/Sparks/ and android/app/

# 4. Start development
npx expo start --dev-client
```

## Local Development Build Setup

### Prerequisites

1. **Xcode** (for iOS builds) - Free from Mac App Store
2. **Android Studio** (for Android builds) - Free
3. **Node.js** (already installed)
4. **Expo CLI** (already installed)

### Android SDK Setup (Required for Android builds)

**Important**: You must set up Android Studio and SDK before building Android development builds.

#### Install Android Studio

1. Download from [developer.android.com/studio](https://developer.android.com/studio)
2. Install Android Studio
3. Open Android Studio and follow the setup wizard
4. Install the recommended SDK components

#### Set Environment Variables

Add these to your shell profile (`~/.zshrc` or `~/.bash_profile`):

```bash
# Add to ~/.zshrc (if using zsh) or ~/.bash_profile (if using bash)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

#### Reload Your Shell

```bash
# Reload your shell configuration
source ~/.zshrc
# or
source ~/.bash_profile

# Verify Android SDK is found
echo $ANDROID_HOME
# Should output: /Users/mattdyor/Library/Android/sdk
```

#### Alternative: Create local.properties file

If environment variables don't work, create this file:

```bash
# Create the file
touch android/local.properties

# Add this content (replace with your actual SDK path)
echo "sdk.dir=/Users/mattdyor/Library/Android/sdk" > android/local.properties
```

**Note**: The `android/` folder will be created when you run the build command, so you'll need to create this file after the first build attempt fails.

### Step 1: Install EAS CLI

EAS (Expo Application Services) is Expo's build service, but we'll use it locally:

```bash
npm install -g @expo/eas-cli
```

### Step 2: Configure EAS for Local Builds

Create an `eas.json` file in your project root:

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Debug"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

### Step 3: Configure app.json for Development Builds

Update your `app.json` to include development build configuration:

```json
{
  "expo": {
    "name": "Sparks",
    "slug": "sparks-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "plugins": [
      [
        "expo-audio",
        {
          "microphonePermission": "This app uses speech synthesis for language learning in flashcards."
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "FoodCam accesses your photo library to save and select food photos for your diary.",
          "cameraPermission": "FoodCam uses the camera to take photos of your food for your visual food diary."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#2E86AB",
          "defaultChannel": "default"
        }
      ],
      [
        "@react-native-firebase/app",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.mattdyor.sparks",
      "buildNumber": "1",
      "requireFullScreen": false,
      "infoPlist": {
        "UIBackgroundModes": [
          "remote-notification"
        ],
        "NSCameraUsageDescription": "FoodCam uses the camera to take photos of your food for your visual food diary.",
        "NSPhotoLibraryUsageDescription": "FoodCam accesses your photo library to save and select food photos for your diary.",
        "NSMicrophoneUsageDescription": "This app does not use the microphone.",
        "NSSpeechRecognitionUsageDescription": "This app uses speech synthesis for language learning in flashcards.",
        "AVAudioSessionCategoryPlayback": true,
        "AVAudioSessionCategoryPlayAndRecord": false,
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "android": {
      "package": "com.mattdyor.sparks",
      "versionCode": 1,
      "compileSdkVersion": 34,
      "targetSdkVersion": 34,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "VIBRATE",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "MODIFY_AUDIO_SETTINGS",
        "WAKE_LOCK",
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.SCHEDULE_EXACT_ALARM",
        "android.permission.USE_EXACT_ALARM",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION"
      ],
      "edgeToEdgeEnabled": true
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "bundler": "metro"
    },
    "extra": {
      "eas": {
        "projectId": "18230acd-b45d-4f62-8406-6f3c8de209c7"
      }
    }
  }
}
```

## Local Build Process

### Step 1: Install Development Dependencies

```bash
# Install Firebase dependencies
npm install @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/auth

# Install development build dependencies
npx expo install expo-dev-client
```

### Step 2: Create Development Build First

**Important**: The `ios/` and `android/` folders don't exist yet! They're created when you build the development build.

#### Build iOS Development Build (Creates ios/ folder)

```bash
# This creates the ios/ folder and generates the native project
npx expo run:ios --device
```

#### Build Android Development Build (Creates android/ folder)

```bash
# This creates the android/ folder and generates the native project
npx expo run:android --device
```

### Step 3: Configure Firebase

#### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project called "Sparks App"
3. Enable Firestore Database
4. Enable Authentication (optional)

#### Download Configuration Files

**For iOS (after building):**
1. In Firebase Console, go to Project Settings
2. Add iOS app with bundle ID: `com.mattdyor.sparks`
3. Download `GoogleService-Info.plist`
4. Place it in `ios/Sparks/GoogleService-Info.plist` (this folder now exists!)

**For Android (after building):**
1. Add Android app with package name: `com.mattdyor.sparks`
2. Download `google-services.json`
3. Place it in `android/app/google-services.json` (this folder now exists!)

### Step 4: Build Development Builds

#### iOS Development Build (Local)

```bash
# Build iOS development build locally
npx expo run:ios --device

# Or build for simulator
npx expo run:ios
```

**What happens:**
- Expo generates native iOS project in `ios/` folder
- Xcode builds the app locally on your Mac
- App is installed on your device/simulator
- Build time: 5-15 minutes (first time), 2-5 minutes (subsequent)

#### Android Development Build (Local)

```bash
# Build Android development build locally
THIS npx expo run:android --device

# Or build for emulator
npx expo run:android
adb install android/app/build/outputs/apk/debug/app-debug.apk
cd android && ./gradlew assembleDebug
```

**What happens:**
- Expo generates native Android project in `android/` folder
- Gradle builds the app locally on your Mac
- App is installed on your device/emulator
- Build time: 10-20 minutes (first time), 3-8 minutes (subsequent)

### Step 4: Development Workflow

#### Start Development Server

```bash
# Start the development server
npx expo start --dev-client
```

#### Install on Device

1. **iOS**: Use Xcode to install on your iPhone
2. **Android**: Use Android Studio or `adb install`

#### Development Features

- **Hot Reload**: Changes appear instantly
- **Debugging**: Full React Native debugging
- **Native Modules**: Firebase, notifications, etc.
- **Expo Dev Tools**: Still available in development builds

## Firebase Configuration

### Step 1: Firebase Service Updated ✅

The `src/services/ServiceFactory.ts` has been updated to use real Firebase in development builds. The service will now:

- ✅ Use real Firebase Firestore for data storage
- ✅ Use real Firebase Analytics for event tracking  
- ✅ Use real Firebase Auth for user management
- ✅ Fall back to mock service if Firebase fails to initialize

**Status**: Firebase service is now configured for development builds!

### Step 2: Configure Firestore Security Rules

In Firebase Console, go to Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all reads and writes for development
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Warning**: This rule allows all access. For production, implement proper security rules.

## Troubleshooting

### Common Issues

#### 1. "SDK location not found" Error (Android)

**Error**: `SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable`

**Solution**:
```bash
# Method 1: Set environment variable
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Add to your shell profile permanently
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
source ~/.zshrc

# Method 2: Create local.properties file (after android/ folder exists)
echo "sdk.dir=/Users/mattdyor/Library/Android/sdk" > android/local.properties

# Method 3: Check if Android Studio is installed
ls -la ~/Library/Android/sdk
# If this doesn't exist, install Android Studio first
```

#### 2. "Native module not found" Error

**Solution:**
```bash
# Clean and rebuild
npx expo run:ios --clear
# or
npx expo run:android --clear
```

#### 3. Firebase Configuration Error

**Solution:**
1. Verify `GoogleService-Info.plist` is in correct location
2. Check bundle ID matches Firebase project
3. Clean and rebuild

#### 4. Build Failures

**Solution:**
```bash
# Clean everything
rm -rf node_modules
npm install
npx expo run:ios --clear
```

#### 5. Metro Bundler Issues

**Solution:**
```bash
# Reset Metro cache
npx expo start --clear
```

### Debug Commands

```bash
# Check if development build is working
npx expo start --dev-client

# Check Firebase connection
npx expo start --dev-client --verbose

# Check native modules
npx expo install --check
```

## Production Builds (Local)

### Overview

Production builds are optimized, signed versions of your app ready for distribution to the App Store or Google Play Store. You can build these locally (free) or use EAS cloud builds (paid).

### Local Production Build Process

#### Step 1: Build Production App Locally

**iOS Production Build:**
```bash
# Build iOS production app locally
npx expo run:ios --device --configuration Release

# This creates a production-ready app that can be submitted to App Store
```

**Android Production Build:**
```bash
# Build Android production app locally
npx expo run:android --device --variant release

# This creates a production-ready APK/AAB for Play Store
```

#### Step 2: Configure for Production

**Update app.json for Production:**
```json
{
  "expo": {
    "name": "Sparks",
    "slug": "sparks-app",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.mattdyor.sparks",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.mattdyor.sparks",
      "versionCode": 1
    }
  }
}
```

#### Step 3: Sign the App

**iOS Signing:**
1. Open `ios/Sparks.xcworkspace` in Xcode
2. Select your project in the navigator
3. Go to "Signing & Capabilities"
4. Select your Apple Developer Team
5. Ensure "Automatically manage signing" is enabled

**Android Signing:**
1. Generate a keystore (if you don't have one):
```bash
keytool -genkey -v -keystore sparks-release-key.keystore -alias sparks-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. Create `android/gradle.properties`:
```properties
MYAPP_RELEASE_STORE_FILE=sparks-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=sparks-key-alias
MYAPP_RELEASE_STORE_PASSWORD=your_store_password
MYAPP_RELEASE_KEY_PASSWORD=your_key_password
```

3. Update `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### Publishing to App Stores

#### Option 1: EAS Build (Recommended)

**Build with EAS:**
```bash
# Build iOS for App Store
eas build --platform ios --profile production

# Build Android for Play Store
eas build --platform android --profile production
```

**Submit to App Store:**
```bash
# Submit iOS to App Store
eas submit --platform ios

# Submit Android to Play Store
eas submit --platform android
```

#### Option 2: Direct Xcode/Android Studio

**iOS (Xcode):**
1. Open `ios/Sparks.xcworkspace` in Xcode
2. Select "Any iOS Device" as target
3. Product → Archive
4. Distribute App → App Store Connect
5. Follow the upload wizard

**Android (Android Studio):**
1. Open `android/` folder in Android Studio
2. Build → Generate Signed Bundle/APK
3. Choose "Android App Bundle" for Play Store
4. Select your keystore and sign
5. Upload to Play Console

### Production Configuration

#### EAS Configuration (eas.json)

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "production": {
      "ios": {
        "buildConfiguration": "Release",
        "simulator": false
      },
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

#### Production Firebase Setup

1. **Create Production Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project: "Sparks App Production"
   - Enable Firestore, Auth, Analytics

2. **Download Production Config Files:**
   - iOS: `GoogleService-Info.plist` → `ios/Sparks/`
   - Android: `google-services.json` → `android/app/`

3. **Update Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Production security rules
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /feedback/{feedbackId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Pre-Production Checklist

#### Code Quality
- [ ] Remove all `console.log` statements
- [ ] Remove debug code and test data
- [ ] Verify all features work correctly
- [ ] Test on multiple devices
- [ ] Check performance and memory usage

#### App Store Requirements
- [ ] App icon (1024x1024) ready
- [ ] Screenshots for all device sizes
- [ ] App description and keywords
- [ ] Privacy policy URL
- [ ] Age rating appropriate
- [ ] No placeholder content

#### Firebase Production
- [ ] Production Firebase project created
- [ ] Security rules configured
- [ ] Analytics enabled
- [ ] Crashlytics enabled (if using)
- [ ] Performance monitoring enabled

#### Build Verification
- [ ] App builds without errors
- [ ] All native modules work
- [ ] Push notifications work
- [ ] Firebase integration works
- [ ] App size is reasonable (< 100MB)

### Troubleshooting Production Builds

#### Common Issues

**1. Code Signing Issues (iOS)**
```bash
# Clean and rebuild
cd ios
rm -rf build
pod deintegrate
pod install
cd ..
npx expo run:ios --device --configuration Release
```

**2. Keystore Issues (Android)**
```bash
# Verify keystore
keytool -list -v -keystore sparks-release-key.keystore

# Check gradle.properties
cat android/gradle.properties
```

**3. Bundle Size Too Large**
```bash
# Analyze bundle size
npx expo export --platform ios
npx expo export --platform android

# Check for large dependencies
npx expo install --check
```

**4. Firebase Production Issues**
- Verify production config files are correct
- Check Firebase project settings
- Ensure security rules are properly configured
- Test with production Firebase project

### Cost Analysis

#### Local Production Builds (Free)
- **iOS**: Free (requires Mac + Apple Developer Account $99/year)
- **Android**: Free (requires Google Play Console $25 one-time)
- **Firebase**: Free tier (generous limits)
- **Total**: $124/year (one-time Android + annual iOS)

#### EAS Cloud Builds (Paid)
- **iOS**: $0.10/minute (~$5-10 per build)
- **Android**: $0.05/minute (~$3-5 per build)
- **Submit**: $0.10/minute
- **Total**: ~$10-20 per release

**Recommendation**: Use local builds for production to avoid ongoing costs.

## Development vs Production

### Development Builds
- **Purpose**: Development and testing
- **Features**: Full native modules, debugging
- **Distribution**: Internal only
- **Cost**: Free (local builds)

### Production Builds
- **Purpose**: App Store/Play Store
- **Features**: Optimized, signed
- **Distribution**: Public
- **Cost**: Free (local builds) or paid (EAS cloud)

## File Structure After Build

```
SparksApp/
├── ios/                    # Generated iOS project
│   ├── Sparks/
│   │   ├── GoogleService-Info.plist
│   │   └── ...
│   └── Pods/              # CocoaPods dependencies
├── android/               # Generated Android project
│   ├── app/
│   │   ├── google-services.json
│   │   └── ...
│   └── ...
├── node_modules/          # Dependencies
├── src/                   # Your source code
└── ...
```

## Next Steps

### 1. Test Firebase Integration

```bash
# Start development server
npx expo start --dev-client

# Test feedback system
# Test analytics
# Test notifications
```

### 2. Verify All Features

- [ ] Firebase authentication
- [ ] Firestore database
- [ ] Push notifications
- [ ] Analytics tracking
- [ ] Feedback collection

### 3. Prepare for Production

- [ ] Set up proper Firestore security rules
- [ ] Configure production Firebase project
- [ ] Test on multiple devices
- [ ] Optimize build settings

## Cost Analysis

### Local Development (Free)
- **iOS**: Free (requires Mac)
- **Android**: Free
- **Firebase**: Free tier (generous limits)
- **Total**: $0/month

### EAS Cloud (Paid)
- **iOS**: $0.10/minute
- **Android**: $0.05/minute
- **Total**: ~$5-20/month for regular development

**Recommendation**: Use local builds to avoid costs during development.

## Summary

Development builds give you:
- ✅ Full native module support
- ✅ Firebase integration
- ✅ Local building (free)
- ✅ Same development experience
- ✅ Production-ready features

The process involves:
1. Installing dependencies
2. Configuring Firebase
3. Building locally with Xcode/Android Studio
4. Testing with development builds

This setup allows you to use all the advanced features while keeping costs at zero for development.
