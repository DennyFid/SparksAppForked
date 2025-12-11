# Notifications Setup Guide

## Overview

This guide covers the complete setup for notifications in the Sparks app, including:
1. **In-App Notifications** - Scheduled notifications that work even when the app is in the background
2. **Firebase Cloud Messaging (FCM)** - Push notifications from Firebase (optional)

## Current Implementation

### What's Already Working

The app currently uses `expo-notifications` for in-app notifications:

- ✅ **Daily Spark Reminders** - Scheduled for 8 AM daily (works on iOS with development builds)
- ✅ **Activity Notifications** - Used in TeeTimeTimer spark for activity reminders
- ✅ **Feedback Response Notifications** - Notifies users when admins respond to feedback
- ✅ **Manual Notification Clearing** - Users must explicitly "Mark as Read" in settings
- ✅ **Notification Permissions** - Properly requested on iOS and Android
- ✅ **Background Task Registration** - Uses `expo-task-manager` for background handling

### Current Files

- `src/utils/notifications.ts` - Main notification service
- `src/services/FeedbackNotificationService.ts` - Feedback-specific notifications
- `app.json` - Contains notification plugin configuration
- `package.json` - Includes `expo-notifications` and `expo-task-manager`

### Current Limitations

⚠️ **Expo Go Limitation**: Scheduled notifications may fire immediately in Expo Go instead of at the scheduled time. This is a known limitation and requires a development build for proper functionality.

---

## Part 1: In-App Notifications (Primary Method)

### What Are In-App Notifications?

In-app notifications are scheduled locally on the device using `expo-notifications`. They:
- Work even when the app is closed or in the background
- Don't require a server or internet connection
- Are scheduled by app logic (e.g., "remind me at 8 AM daily")
- Are perfect for recurring reminders, activity timers, etc.

### Why Development Builds Are Required

**Expo Go Limitations:**
- Scheduled notifications may fire immediately instead of at the scheduled time
- Background task execution is limited
- Some notification features don't work properly

**Development Builds:**
- Full native notification support
- Proper background execution
- Scheduled notifications work correctly
- Production-ready behavior

### Step-by-Step Setup for Development Builds

#### Step 1: Verify Current Configuration

Check that `app.json` includes the notification plugin:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#2E86AB",
          "defaultChannel": "default"
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": [
          "remote-notification"
        ]
      }
    },
    "android": {
      "permissions": [
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.SCHEDULE_EXACT_ALARM",
        "android.permission.USE_EXACT_ALARM"
      ]
    }
  }
}
```

✅ **Status**: Already configured in your `app.json`

#### Step 2: Create Development Build

**Important**: You cannot test scheduled notifications properly in Expo Go. You must use a development build.

**iOS Development Build:**
```bash
# Build iOS development build (creates ios/ folder)
npx expo run:ios --device

# Or for simulator
npx expo run:ios
```

**Android Development Build:**
```bash
# Build Android development build (creates android/ folder)
npx expo run:android --device

# Or for emulator
npx expo run:android
```

**What Happens:**
- Expo generates native iOS/Android projects
- Native notification code is compiled
- App is installed on your device/simulator
- Scheduled notifications will work correctly

**⚠️ CRITICAL: Rebuild Required After Configuration Changes**

**Root Cause of Notification Issues:**
If scheduled notifications are not working (returning ID but not firing), the most common cause is that **native configuration changes require a rebuild**, not just hot reload.

**When to Rebuild:**
- ✅ After modifying `app.json` (plugins, infoPlist, background modes, permissions)
- ✅ After updating `expo-notifications` or other native modules
- ✅ After changing entitlements or capabilities
- ✅ After modifying `ios/` or `android/` native code
- ❌ NOT needed for JavaScript-only changes (hot reload is sufficient)

**Why Rebuild is Required:**
- Hot reload only updates JavaScript code
- Native configuration (Info.plist, entitlements, background modes) is compiled into the native app binary
- The native iOS app must be rebuilt to include:
  - `UIBackgroundModes` in Info.plist
  - Notification capabilities in Xcode project
  - Proper linking of `expo-notifications` native module
  - Entitlements (`aps-environment`)

**Symptoms of Missing Rebuild:**
- `scheduleNotificationAsync()` returns an ID successfully
- `getAllScheduledNotificationsAsync()` returns empty array (0 notifications)
- Notification never fires after scheduled time
- Permissions are granted correctly
- `allowsAlert` is `true`

**Solution:**
```bash
# Rebuild the native app (not just hot reload)
npx expo run:ios --device

# Then start Metro bundler separately
npx expo start --dev-client
```

**This is why the rebuild fixed the issue** - the native iOS app needed to be recompiled with the correct notification configuration.

#### Step 3: Start Development Server (IMPORTANT!)

**⚠️ CRITICAL:** After building, you MUST start the Metro bundler separately:

```bash
# In a separate terminal, start the development server
npx expo start --dev-client
```

**Why this is needed:**
- `npx expo run:ios --device` only builds and installs the app
- It does NOT start the Metro bundler
- You need Metro running to see logs and connect the app

**Connecting the app:**
1. Start Metro: `npx expo start --dev-client`
2. Open the app on your device
3. If auto-connection fails, shake device → "Enter URL manually"
4. Enter: `exp://YOUR_COMPUTER_IP:8081` (e.g., `exp://192.168.1.100:8081`)

**Verify connection:**
- ✅ Logs appear in the terminal running Metro
- ✅ Hot reload works
- ✅ Console.log statements show up

See `DEV_SERVER_CONNECTION.md` for detailed connection instructions.

#### Step 4: Test Notifications

The app already includes notification testing functionality. To test:

1. **Enable Daily Reminders** in Settings
2. **Check Notification Permissions** - iOS will prompt on first use
3. **Schedule a Test Notification** - The `NotificationService.sendTestNotification()` method is available

**Testing in Code:**
```typescript
import { NotificationService } from '../utils/notifications';

// Test immediate notification (works in Expo Go)
await NotificationService.sendTestNotification();

// Schedule daily reminder (requires development build)
await NotificationService.scheduleDailyNotification();
```

#### Step 5: Verify Background Execution

**iOS Background Modes:**
- Already configured in `app.json` with `"UIBackgroundModes": ["remote-notification"]`
- This allows notifications to fire when app is in background

**Android Background Execution:**
- Uses `expo-task-manager` for background tasks
- Already registered in `NotificationService.registerBackgroundTask()`
- Configured in `app.json` with proper permissions

**Test Background Behavior:**
1. Schedule a notification for 1 minute from now
2. Close the app completely
3. Wait for the notification to fire
4. Verify it appears even though the app is closed

---

## Part 2: Firebase Cloud Messaging (FCM) - Optional

### What Are Push Notifications (FCM)?

Firebase Cloud Messaging (FCM) allows you to send notifications from a server:
- **Server-initiated** - Notifications come from Firebase/your backend
- **Real-time** - Can be sent instantly to users
- **Targeted** - Can target specific users, groups, or all users
- **Rich content** - Can include images, actions, deep links

### Benefits of FCM Push Notifications

**When to Use FCM:**
1. **Real-time Updates** - Notify users about new content immediately
2. **User Engagement** - Send promotional notifications, updates, etc.
3. **Cross-Platform** - Same notification system for iOS, Android, and web
4. **Targeted Messaging** - Send to specific user segments
5. **Analytics** - Track notification open rates, engagement, etc.
6. **Remote Configuration** - Change notification content without app update

**When NOT to Use FCM:**
- Simple recurring reminders (use in-app notifications)
- Activity timers (use in-app notifications)
- User-initiated reminders (use in-app notifications)

**Use Cases for Sparks App:**
- ✨ Notify users when new sparks are added to marketplace
- 📢 Announce new features or updates
- 🔔 Notify admins about new feedback (if desired)
- 🎯 Re-engagement campaigns for inactive users

### Setup Steps for FCM

#### Prerequisites

1. **Firebase Project** - Already set up ✅
2. **Development Build** - Required for FCM (Expo Go doesn't support FCM)
3. **Apple Developer Account** - Required for iOS push certificates
4. **Google Cloud Project** - Linked to Firebase project

#### Step 1: Install FCM Dependencies

```bash
# Install Firebase Cloud Messaging
npm install @react-native-firebase/messaging

# Or if using Expo managed workflow
npx expo install @react-native-firebase/messaging
```

**Note**: This requires a development build. FCM cannot work in Expo Go.

#### Step 2: Configure iOS Push Notifications

**2.1. Enable Push Notifications in Apple Developer**

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to Certificates, Identifiers & Profiles
3. Select your App ID (`com.mattdyor.sparks`)
4. Enable "Push Notifications" capability
5. Create an **Apple Push Notification service SSL (Sandbox)** certificate
6. Download the certificate (.cer file)

**2.2. Upload Certificate to Firebase**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Cloud Messaging
4. Under "Apple app configuration", upload your APNs certificate
5. Or use APNs Auth Key (recommended - easier to manage)

**2.3. Update app.json**

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": [
          "remote-notification"
        ]
      }
    }
  }
}
```

✅ **Status**: Already configured

#### Step 3: Configure Android Push Notifications

**3.1. Get Server Key from Firebase**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Cloud Messaging
4. Copy the **Server key** (for sending notifications)
5. Copy the **Sender ID** (for client configuration)

**3.2. Verify Android Configuration**

The `google-services.json` file should already be in `android/app/`:
- ✅ Already configured if you've set up Firebase

**3.3. Update AndroidManifest.xml**

Verify these are in `android/app/src/main/AndroidManifest.xml`:

```xml
<application>
  <!-- Firebase Cloud Messaging -->
  <meta-data
    android:name="com.google.firebase.messaging.default_notification_channel_id"
    android:value="default"/>
  <meta-data
    android:name="com.google.firebase.messaging.default_notification_color"
    android:resource="@color/notification_icon_color"/>
  <meta-data
    android:name="com.google.firebase.messaging.default_notification_icon"
    android:resource="@drawable/notification_icon"/>
</application>
```

✅ **Status**: Already configured (found in your AndroidManifest.xml)

#### Step 4: Create FCM Service

Create a new service file `src/services/FCMService.ts`:

```typescript
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { NotificationService } from '../utils/notifications';

export class FCMService {
  /**
   * Request FCM permission and get token
   */
  static async requestPermissionAndGetToken(): Promise<string | null> {
    try {
      // Request permission (iOS)
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        if (authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL) {
          console.log('FCM permission granted');
        } else {
          console.log('FCM permission denied');
          return null;
        }
      }

      // Get FCM token
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      
      // Save token to your backend/Firestore for sending notifications
      await this.saveTokenToFirestore(token);
      
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Save FCM token to Firestore
   */
  private static async saveTokenToFirestore(token: string): Promise<void> {
    try {
      const { FirebaseService } = await import('./ServiceFactory');
      const { FeedbackNotificationService } = await import('./FeedbackNotificationService');
      
      const deviceId = await FeedbackNotificationService.getPersistentDeviceId();
      
      // Save token to Firestore
      await (FirebaseService as any).db.collection('fcm_tokens').doc(deviceId).set({
        token,
        deviceId,
        platform: Platform.OS,
        updatedAt: new Date(),
      });
      
      console.log('✅ FCM token saved to Firestore');
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  /**
   * Initialize FCM listeners
   */
  static initialize(): void {
    // Handle foreground messages
    messaging().onMessage(async remoteMessage => {
      console.log('FCM message received in foreground:', remoteMessage);
      
      // Show local notification
      await NotificationService.sendLocalNotification({
        title: remoteMessage.notification?.title || 'New Notification',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage.data,
      });
    });

    // Handle background messages (requires background handler)
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('FCM message received in background:', remoteMessage);
      // Handle background message
    });

    // Handle notification taps
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app:', remoteMessage);
      // Navigate to appropriate screen based on data
    });

    // Check if app was opened from a notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('App opened from notification:', remoteMessage);
          // Navigate to appropriate screen
        }
      });
  }

  /**
   * Refresh FCM token
   */
  static async refreshToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      await this.saveTokenToFirestore(token);
      return token;
    } catch (error) {
      console.error('Error refreshing FCM token:', error);
      return null;
    }
  }

  /**
   * Delete FCM token (on logout, etc.)
   */
  static async deleteToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      console.log('FCM token deleted');
    } catch (error) {
      console.error('Error deleting FCM token:', error);
    }
  }
}
```

#### Step 5: Initialize FCM in App.tsx

Add FCM initialization to `App.tsx`:

```typescript
import { useEffect } from 'react';
import { FCMService } from './src/services/FCMService';

function AppContent() {
  useEffect(() => {
    const initializeFCM = async () => {
      try {
        // Initialize FCM listeners
        FCMService.initialize();
        
        // Request permission and get token
        const token = await FCMService.requestPermissionAndGetToken();
        if (token) {
          console.log('✅ FCM initialized with token:', token);
        }
      } catch (error) {
        console.error('Error initializing FCM:', error);
      }
    };

    initializeFCM();
  }, []);

  // ... rest of your app
}
```

#### Step 6: Send Test Notification from Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Cloud Messaging → Send your first message
4. Enter notification title and text
5. Click "Send test message"
6. Enter your FCM token (from app logs)
7. Send the notification
8. Verify it appears on your device

#### Step 7: Send Notifications from Your Backend

**Example: Send notification when new spark is added**

```typescript
// Backend code (Node.js example)
const admin = require('firebase-admin');
admin.initializeApp();

async function sendNewSparkNotification(sparkName: string) {
  // Get all FCM tokens from Firestore
  const tokensSnapshot = await admin.firestore()
    .collection('fcm_tokens')
    .get();
  
  const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
  
  // Send notification to all devices
  const message = {
    notification: {
      title: '✨ New Spark Available!',
      body: `${sparkName} is now available in the marketplace`,
    },
    data: {
      type: 'new-spark',
      sparkName: sparkName,
      screen: 'Marketplace',
    },
    tokens: tokens,
  };
  
  const response = await admin.messaging().sendMulticast(message);
  console.log(`Sent ${response.successCount} notifications`);
}
```

---

## Testing Checklist

### In-App Notifications

- [ ] Daily reminder fires at 8 AM
- [ ] Notification appears when app is closed
- [ ] Notification appears when app is in background
- [ ] Tapping notification opens the app
- [ ] Permissions are requested properly
- [ ] Notifications work on both iOS and Android

### FCM Push Notifications (if implemented)

- [ ] FCM token is generated and saved
- [ ] Foreground notifications are received
- [ ] Background notifications are received
- [ ] Notification taps navigate correctly
- [ ] App opens from notification when closed
- [ ] Token refresh works correctly

---

## Troubleshooting

### Scheduled Notifications Fire Immediately

**Problem**: Notifications scheduled for future time fire immediately

**Solution**: 
- This is an Expo Go limitation
- Use a development build: `npx expo run:ios --device`
- Verify notification trigger is set correctly

### Notifications Don't Appear When App is Closed

**Problem**: Notifications only work when app is open

**Solution**:
- Verify `UIBackgroundModes` includes `"remote-notification"` in `app.json`
- Check that background task is registered: `NotificationService.registerBackgroundTask()`
- Ensure proper permissions are granted

### FCM Token Not Generated

**Problem**: FCM token is null or undefined

**Solution**:
- Verify `@react-native-firebase/messaging` is installed
- Check that `google-services.json` (Android) or `GoogleService-Info.plist` (iOS) is configured
- Ensure development build is used (FCM doesn't work in Expo Go)
- Check Firebase project configuration

### Android Notifications Not Showing

**Problem**: Notifications don't appear on Android

**Solution**:
- Verify `POST_NOTIFICATIONS` permission is granted (Android 13+)
- Check notification channels are created
- Verify `SCHEDULE_EXACT_ALARM` permission for scheduled notifications
- Check AndroidManifest.xml configuration

### iOS Notifications Not Showing

**Problem**: Notifications don't appear on iOS

**Solution**:
- Verify notification permissions are granted in Settings
- Check `UIBackgroundModes` configuration
- Ensure APNs certificate is configured (for FCM)
- Verify app is built with development build (not Expo Go)

---

## Best Practices

### In-App Notifications

1. **Request Permissions Early** - Request notification permissions when user first opens relevant feature
2. **Provide Context** - Explain why notifications are needed
3. **Allow Opt-Out** - Always provide a way to disable notifications
4. **Test Thoroughly** - Test on real devices, not just simulators
5. **Handle Edge Cases** - What happens if user denies permissions? What if device time changes?

### FCM Push Notifications

1. **Respect User Preferences** - Don't send notifications if user disabled them
2. **Segment Users** - Send relevant notifications to interested users only
3. **Rate Limiting** - Don't spam users with too many notifications
4. **Rich Content** - Use images and actions to make notifications engaging
5. **Deep Linking** - Make notifications actionable with deep links
6. **Analytics** - Track notification open rates and engagement

---

## Summary

### Current Status

✅ **In-App Notifications**: Fully implemented and working with development builds
- Daily reminders
- Activity notifications
- Feedback response notifications

⚠️ **FCM Push Notifications**: Not yet implemented (optional)
- Requires additional setup
- Useful for server-initiated notifications
- Not needed for current use cases

### Recommended Approach

**For Current Use Cases:**
- ✅ Use **in-app notifications** for all current needs
- ✅ Daily reminders work perfectly with in-app notifications
- ✅ Activity timers work perfectly with in-app notifications
- ✅ Feedback notifications work perfectly with in-app notifications

**Consider FCM If:**
- You want to notify users about new sparks from server
- You want to send promotional notifications
- You want to re-engage inactive users
- You want server-controlled notification campaigns

### Next Steps

1. **Test Current Implementation**:
   - Build development build: `npx expo run:ios --device`
   - Test daily reminders
   - Verify background execution

2. **If Adding FCM** (optional):
   - Follow Part 2 setup steps
   - Configure APNs certificates
   - Implement FCM service
   - Test with Firebase Console

3. **Production Considerations**:
   - Test on real devices
   - Verify permissions flow
   - Test notification handling
   - Monitor notification delivery rates

---

## References

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase Messaging](https://rnfirebase.io/messaging/usage)
- [Development Builds Guide](./DEV_BUILD.md)
- [iOS Deployment Guide](./ios-deployment-guide.md)

