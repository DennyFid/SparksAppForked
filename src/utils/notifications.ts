import { Platform } from 'react-native';

// Dynamic imports for expo modules to handle cases where they're not available
let Notifications: any = null;
let TaskManager: any = null;
let isNotificationsAvailable = false;
let isTaskManagerAvailable = false;

try {
  const notificationsModule = require('expo-notifications');
  Notifications = notificationsModule.default;
  isNotificationsAvailable = true;
  console.log('✅ Expo Notifications available');
} catch (error) {
  console.log('⚠️ Expo Notifications not available:', error.message);
  isNotificationsAvailable = false;
}

try {
  const taskManagerModule = require('expo-task-manager');
  TaskManager = taskManagerModule.default;
  isTaskManagerAvailable = true;
  console.log('✅ Expo TaskManager available');
} catch (error) {
  console.log('⚠️ Expo TaskManager not available:', error.message);
  isTaskManagerAvailable = false;
}

// Configure how notifications should be handled when the app is running
if (isNotificationsAvailable && Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const now = new Date();
      console.log('=== NOTIFICATION HANDLER CALLED ===');
      console.log('Time:', now.toLocaleTimeString());
      console.log('Title:', notification.request.content.title);
      console.log('Data:', notification.request.content.data);
      console.log('Trigger:', notification.request.trigger);
      
      // Check if this is a scheduled notification that fired immediately (Expo Go limitation)
      if (notification.request.trigger === null && notification.request.content.data?.type === 'test-scheduled') {
        console.log('⚠️  SCHEDULED NOTIFICATION FIRED IMMEDIATELY');
        console.log('This is a known Expo Go limitation - scheduled notifications may fire immediately.');
        console.log('For proper testing, use a development build or standalone app.');
      }
      
      // Show all notifications normally
      return {
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    },
  });
} else {
  console.log('⚠️ Notifications not available, skipping notification handler setup');
}

const DAILY_NOTIFICATION_IDENTIFIER = 'daily-sparks-reminder';
const BACKGROUND_NOTIFICATION_TASK = 'background-notification-task';

// Define background task for handling notifications
if (isTaskManagerAvailable && TaskManager) {
  TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error, executionInfo }) => {
    console.log('Background notification task executed:', { data, error, executionInfo });
    
    if (error) {
      console.error('Background notification task error:', error);
      return;
    }
    
    if (data) {
      console.log('Background notification data:', data);
      // Handle the notification data here if needed
    }
  });
} else {
  console.log('⚠️ TaskManager not available, skipping background task definition');
}

export class NotificationService {
  // Register background task for notifications
  static async registerBackgroundTask(): Promise<void> {
    try {
      if (!isNotificationsAvailable || !Notifications) {
        console.log('⚠️ Notifications not available, skipping background task registration');
        return;
      }

      if (!isTaskManagerAvailable || !TaskManager) {
        console.log('⚠️ TaskManager not available, skipping background task registration');
        return;
      }

      await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
      console.log('Background notification task registered');
    } catch (error) {
      console.error('Error registering background task:', error);
    }
  }

  // Request permissions for notifications
  static async requestPermissions(): Promise<boolean> {
    try {
      if (!isNotificationsAvailable || !Notifications) {
        console.log('⚠️ Notifications not available, returning false');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted:', finalStatus);
      return false;
    }

    // For Android, ensure we can schedule exact alarms and create notification channels
    if (Platform.OS === 'android') {
      // Create default notification channel
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2E86AB',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Create daily reminders channel
      await Notifications.setNotificationChannelAsync('daily-reminders', {
        name: 'Daily Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2E86AB',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Schedule daily notification at 8 AM
  static async scheduleDailyNotification(): Promise<void> {
    try {
      // Cancel any existing daily notification
      await this.cancelDailyNotification();

      // Request permissions first
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.log('Notification permissions not granted');
        return;
      }

      // Schedule the daily notification
      await Notifications.scheduleNotificationAsync({
        identifier: DAILY_NOTIFICATION_IDENTIFIER,
        content: {
          title: '✨ New Sparks Await!',
          body: 'Discover something new today - check out the latest sparks in the marketplace!',
          data: { 
            screen: 'Marketplace',
            type: 'daily-reminder'
          },
          sound: 'default',
          badge: 1,
          ...(Platform.OS === 'android' && {
            channelId: 'daily-reminders',
          }),
        },
        trigger: {
          hour: 8,
          minute: 0,
          repeats: true,
        },
      });

      console.log('Daily notification scheduled for 8:00 AM');
    } catch (error) {
      console.error('Error scheduling daily notification:', error);
    }
  }

  // Cancel the daily notification
  static async cancelDailyNotification(): Promise<void> {
    try {
      if (!isNotificationsAvailable || !Notifications) {
        console.log('⚠️ Notifications not available, skipping cancel daily notification');
        return;
      }

      await Notifications.cancelScheduledNotificationAsync(DAILY_NOTIFICATION_IDENTIFIER);
      console.log('Daily notification cancelled');
    } catch (error) {
      console.error('Error cancelling daily notification:', error);
    }
  }

  // Check if daily notifications are scheduled
  static async isDailyNotificationScheduled(): Promise<boolean> {
    try {
      if (!isNotificationsAvailable || !Notifications) {
        console.log('⚠️ Notifications not available, returning false for scheduled check');
        return false;
      }

      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      return scheduledNotifications.some(
        notification => notification.identifier === DAILY_NOTIFICATION_IDENTIFIER
      );
    } catch (error) {
      console.error('Error checking scheduled notifications:', error);
      return false;
    }
  }

  // Handle notification response (when user taps notification)
  static addNotificationResponseListener(callback: (response: any) => void) {
    if (!isNotificationsAvailable || !Notifications) {
      console.log('⚠️ Notifications not available, cannot add response listener');
      return null;
    }
    
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Schedule activity start notification
  static async scheduleActivityNotification(activityName: string, startTime: Date, activityId: string): Promise<void> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.log('Notification permissions not granted');
        return;
      }

      // Calculate seconds until the activity starts
      const now = new Date();
      const secondsUntilStart = Math.floor((startTime.getTime() - now.getTime()) / 1000);

      // Only schedule if the activity is in the future
      if (secondsUntilStart > 0) {
        await Notifications.scheduleNotificationAsync({
          identifier: `activity-${activityId}`,
          content: {
            title: '⛳ Tee Time Timer',
            body: `Time to start: ${activityName}`,
            data: { 
              type: 'activity-start',
              activityId,
              activityName,
              taskName: BACKGROUND_NOTIFICATION_TASK
            },
            sound: 'default',
            badge: 1,
            ...(Platform.OS === 'android' && {
              channelId: 'default',
            }),
          },
          trigger: {
            seconds: secondsUntilStart,
          },
        });

        console.log(`Activity notification scheduled for ${activityName} in ${secondsUntilStart} seconds`);
      }
    } catch (error) {
      console.error('Error scheduling activity notification:', error);
    }
  }

  // Cancel all activity notifications
  static async cancelAllActivityNotifications(): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const activityNotifications = scheduledNotifications.filter(
        notification => notification.content.data?.type === 'activity-start'
      );
      
      for (const notification of activityNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
      
      console.log(`Cancelled ${activityNotifications.length} activity notifications`);
    } catch (error) {
      console.error('Error cancelling activity notifications:', error);
    }
  }

  // Send silent notification for better background handling
  static async sendSilentNotification(title: string, body: string, data: any, trigger: any): Promise<string | null> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.log('Notification permissions not granted');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          // No title or body for silent notification
          data: {
            ...data,
            taskName: BACKGROUND_NOTIFICATION_TASK,
            silentTitle: title,
            silentBody: body
          },
          sound: false, // No sound for silent notification
          badge: 1,
        },
        trigger,
      });

      console.log(`Silent notification scheduled with ID: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('Error sending silent notification:', error);
      return null;
    }
  }

  // Test notification (for debugging) - with Expo Go limitation explanation
  static async sendTestNotification(): Promise<void> {
    try {
      console.log('Starting test notification process...');
      
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.log('Notification permissions not granted');
        return;
      }
      console.log('Notification permissions granted');

      // Check if we're running in Expo Go (which has limitations with scheduled notifications)
      const isExpoGo = __DEV__ && !global.nativeCallSyncHook;
      
      if (isExpoGo) {
        console.log('⚠️  EXPO GO LIMITATION DETECTED');
        console.log('Expo Go has known limitations with scheduled notifications.');
        console.log('Scheduled notifications may fire immediately instead of at the scheduled time.');
        console.log('For proper notification testing, use a development build or standalone app.');
        console.log('See: https://docs.expo.dev/push-notifications/faq/');
      }

      // Test with immediate notification to verify basic functionality
      console.log('Testing immediate notification...');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Immediate Test',
          body: 'This should appear immediately!',
          data: { type: 'test-immediate' },
          sound: 'default',
        },
        trigger: {
          seconds: 1,
        },
      });

      // Test scheduled notification (may not work properly in Expo Go)
      console.log('Testing scheduled notification...');
      const futureTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
      
      const scheduledId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Scheduled Test',
          body: `This should appear at ${futureTime.toLocaleTimeString()}!`,
          data: { type: 'test-scheduled' },
          sound: 'default',
        },
        trigger: {
          date: futureTime,
        },
      });

      console.log(`Scheduled notification ID: ${scheduledId}`);
      console.log(`Expected time: ${futureTime.toLocaleTimeString()}`);
      
      if (isExpoGo) {
        console.log('⚠️  Note: In Expo Go, scheduled notifications may fire immediately.');
        console.log('This is a known limitation and not a bug in your code.');
      }

      // Check scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`Found ${scheduledNotifications.length} scheduled notifications`);
      
      if (scheduledNotifications.length === 0 && !isExpoGo) {
        console.log('WARNING: No notifications were scheduled! This might be a configuration issue.');
      }
      
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }
}