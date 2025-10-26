import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSparkStore, useAppStore } from '../store';
import { useTheme } from '../contexts/ThemeContext';
import { HapticFeedback } from '../utils/haptics';
import { NotificationService } from '../utils/notifications';
import { SettingsFeedbackSection, SettingsScrollView } from '../components/SettingsComponents';
import { AdminFeedbackManager } from '../components/AdminFeedbackManager';
import { AdminResponseService } from '../services/AdminResponseService';
import { ServiceFactory } from '../services/ServiceFactory';
import { FeedbackService } from '../services/FeedbackService';
import { getSparkById } from '../components/SparkRegistry';

export const SettingsScreen: React.FC = () => {
  const { colors } = useTheme();
  
  const { 
    sparkData, 
    sparkProgress, 
    userSparkIds, 
    favoriteSparkIds,
    reorderUserSparks,
    removeSparkFromUser
  } = useSparkStore();
  
  const {
    preferences,
    setPreferences
  } = useAppStore();

  // Admin and initialization state
  const [isInitialized, setIsInitialized] = useState(false);
  const [showAdminManager, setShowAdminManager] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Spark management state
  const [isReordering, setIsReordering] = useState(false);
  
  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  
  // Debug state
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');

  // Initialize analytics service
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        console.log('🚀 SettingsScreen: Starting analytics initialization...');
        await ServiceFactory.ensureAnalyticsInitialized();
        await ServiceFactory.ensureFirebaseInitialized();
        setIsInitialized(true);
        console.log('✅ SettingsScreen: Analytics initialized successfully');
        
        // Track settings access
        const AnalyticsService = ServiceFactory.getAnalyticsService();
        if (AnalyticsService.trackSettingsAccess) {
          AnalyticsService.trackSettingsAccess();
        }
        
        // Check if current device is admin
        const adminStatus = await AdminResponseService.isAdmin();
        setIsAdmin(adminStatus);
        console.log('🔑 Admin status:', adminStatus);
        
        // Debug: Show current device ID
        const sessionInfo = AnalyticsService.getSessionInfo();
        console.log('🔍 Current device ID:', sessionInfo.userId);
        console.log('🔍 Session ID:', sessionInfo.sessionId);
        console.log('🔍 Analytics initialized:', sessionInfo.isInitialized);
        console.log('🔍 Analytics service type:', AnalyticsService.constructor.name);
        
        // Fallback: Get device ID directly from AsyncStorage
        let deviceId = sessionInfo.userId || sessionInfo.sessionId;
        if (!deviceId || deviceId === 'unknown') {
          try {
            deviceId = await AsyncStorage.getItem('analytics_device_id');
            console.log('🔍 Device ID from AsyncStorage:', deviceId);
          } catch (error) {
            console.error('❌ Error getting device ID from AsyncStorage:', error);
          }
        }
        
        setCurrentDeviceId(deviceId || 'Unknown');
      } catch (error) {
        console.error('❌ SettingsScreen: Error initializing analytics:', error);
        setIsInitialized(false);
      }
    };

    initializeAnalytics();
  }, []);





  // Handle daily notification toggle
  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      await NotificationService.scheduleDailyNotification();
    } else {
      await NotificationService.cancelDailyNotification();
    }
    setPreferences({ dailyNotificationsEnabled: enabled });
    HapticFeedback.light();
  };

  const handleResetAllData = () => {
    Alert.alert(
      "Reset All Data",
      "This will permanently delete all your spark progress, scores, and preferences. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
          style: "destructive",
          onPress: () => {
            // Clear all spark data
            Object.keys(sparkData).forEach(sparkId => {
              useSparkStore.getState().setSparkData(sparkId, {});
            });
            
            // Clear all progress
            useSparkStore.setState({ sparkProgress: {} });
            
            // Reset settings
            setPreferences({
              theme: 'system',
              soundEnabled: true,
              hapticsEnabled: true,
              dailyNotificationsEnabled: false
            });
            
            Alert.alert("Success", "All data has been reset.");
          }
        }
      ]
    );
  };


  // Spark management functions
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderUserSparks(index, index - 1);
      HapticFeedback.light();
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < userSparkIds.length - 1) {
      reorderUserSparks(index, index + 1);
      HapticFeedback.light();
    }
  };

  const handleRemoveSpark = (sparkId: string, sparkName: string) => {
    Alert.alert(
      'Remove Spark',
      `Are you sure you want to remove "${sparkName}" from your collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeSparkFromUser(sparkId);
            HapticFeedback.medium();
          }
        }
      ]
    );
  };

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 SettingsScreen: Starting refresh...');
      
      // Refresh analytics initialization
      const AnalyticsService = ServiceFactory.getAnalyticsService();
      await AnalyticsService.initialize();
      
      // Refresh admin status
      const adminStatus = await AdminResponseService.isAdmin();
      setIsAdmin(adminStatus);
      
      // Refresh feedback data (this will be handled by SettingsFeedbackSection)
      console.log('✅ SettingsScreen: Refresh completed');
      
      HapticFeedback.light();
    } catch (error) {
      console.error('❌ SettingsScreen: Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getDataStats = () => {
    const totalSparks = userSparkIds.length;
    const totalProgress = Object.keys(sparkProgress).length;
    const totalFavorites = favoriteSparkIds.length;
    const totalSessions = Object.values(sparkProgress).reduce((sum, progress) => sum + progress.timesPlayed, 0);

    return { totalSparks, totalProgress, totalFavorites, totalSessions };
  };


  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <SettingsScrollView onRefresh={handleRefresh} refreshing={refreshing}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Settings</Text>
        <Text style={styles.subtitle}>Customize your Sparks experience</Text>
      </View>

      <View style={styles.feedbackSection}>
        <SettingsFeedbackSection sparkName="Sparks App" />
      </View>

      {/* Debug Section - Remove after testing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔍 Debug Info</Text>
        <Text style={styles.debugText}>Admin Status: {isAdmin ? '✅ Admin' : '❌ Not Admin'}</Text>
        <Text style={styles.debugText}>Device ID: {currentDeviceId || 'Loading...'}</Text>
        <Text style={styles.debugText}>Analytics Initialized: {isInitialized ? '✅ Yes' : '❌ No'}</Text>
        <Text style={styles.debugText}>Expected Device ID: device_1761186342237_3wfem84rw</Text>
        
        {currentDeviceId && !isAdmin && (
          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => {
              Alert.alert(
                'Add Device to Admin List',
                `Add this device ID to the admin list?\n\n${currentDeviceId}`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Add', 
                    onPress: () => {
                      // This would need to be added to the ADMIN_DEVICE_IDS array in FeedbackNotificationService.ts
                      Alert.alert('Manual Step Required', `Add this device ID to ADMIN_DEVICE_IDS in FeedbackNotificationService.ts:\n\n'${currentDeviceId}'`);
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.debugButtonText}>Add This Device to Admin List</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Admin Section */}
      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔑 Admin Tools</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowAdminManager(true)}
          >
            <Text style={styles.actionButtonText}>📝 Manage Feedback & Responses</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Experience</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Haptic Feedback</Text>
            <Text style={styles.settingDescription}>Feel vibrations on interactions</Text>
          </View>
          <Switch
            value={preferences.hapticsEnabled}
            onValueChange={(value) => {
              HapticFeedback.light();
              setPreferences({ hapticsEnabled: value });
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={preferences.hapticsEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Sound Effects</Text>
            <Text style={styles.settingDescription}>Play audio feedback</Text>
          </View>
          <Switch
            value={preferences.soundEnabled}
            onValueChange={(value) => {
              HapticFeedback.light();
              setPreferences({ soundEnabled: value });
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={preferences.soundEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Daily Spark Reminders</Text>
            <Text style={styles.settingDescription}>Get notified at 8 AM to explore new sparks</Text>
          </View>
          <Switch
            value={preferences.dailyNotificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={preferences.dailyNotificationsEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Spark Management Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Sparks</Text>
          {userSparkIds.length > 1 && (
            <TouchableOpacity
              style={[styles.reorderButton, { backgroundColor: isReordering ? colors.primary : colors.secondary }]}
              onPress={() => setIsReordering(!isReordering)}
            >
              <Text style={[styles.reorderButtonText, { color: colors.background }]}>
                {isReordering ? 'Done' : 'Reorder'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {userSparkIds.length === 0 ? (
          <Text style={styles.emptyText}>No sparks in your collection yet</Text>
        ) : (
          <View style={styles.sparkList}>
            {userSparkIds.map((sparkId, index) => {
              const spark = getSparkById(sparkId);
              if (!spark) return null;
              
              return (
                <View key={sparkId} style={styles.sparkCard}>
                  <View style={styles.sparkCardContent}>
                    <Text style={styles.sparkIcon}>{spark.metadata.icon}</Text>
                    <View style={styles.sparkInfo}>
                      <Text style={styles.sparkTitle}>{spark.metadata.title}</Text>
                      <Text style={styles.sparkDescription}>{spark.metadata.description}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.sparkActions}>
                    {isReordering && (
                      <View style={styles.reorderControls}>
                        <TouchableOpacity
                          style={[styles.reorderButton, { opacity: index > 0 ? 1 : 0.3 }]}
                          onPress={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          <Text style={styles.reorderButtonText}>↑</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.reorderButton, { opacity: index < userSparkIds.length - 1 ? 1 : 0.3 }]}
                          onPress={() => handleMoveDown(index)}
                          disabled={index === userSparkIds.length - 1}
                        >
                          <Text style={styles.reorderButtonText}>↓</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    <TouchableOpacity
                      style={[styles.removeButton, { backgroundColor: colors.error }]}
                      onPress={() => handleRemoveSpark(sparkId, spark.metadata.title)}
                    >
                      <Text style={[styles.removeButtonText, { color: colors.background }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.dangerButton]} 
          onPress={handleResetAllData}
        >
          <Text style={[styles.actionButtonText, styles.dangerText]}>🗑️ Reset All Data</Text>
        </TouchableOpacity>
        
        <Text style={styles.dangerWarning}>
          This will permanently delete all your progress, scores, and preferences.
        </Text>
      </View>

      {/* Admin Feedback Manager Modal */}
      <AdminFeedbackManager
        visible={showAdminManager}
        onClose={() => setShowAdminManager(false)}
      />
      </SettingsScrollView>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  feedbackSection: {
    marginBottom: 20,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: colors.error,
  },
  dangerText: {
    color: '#fff',
  },
  dangerWarning: {
    fontSize: 12,
    color: colors.error,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  
  // Spark management styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reorderButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reorderButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  sparkList: {
    gap: 12,
  },
  sparkCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sparkCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sparkIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sparkInfo: {
    flex: 1,
  },
  sparkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sparkDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sparkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reorderControls: {
    flexDirection: 'row',
    gap: 8,
  },
  removeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  debugText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  debugButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});