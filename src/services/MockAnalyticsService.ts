import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalyticsEvent, User } from '../types/analytics';

export class MockAnalyticsService {
  private static sessionId: string = MockAnalyticsService.generateSessionId();
  private static userId: string | null = null;
  private static isInitialized: boolean = false;

  static async initialize(): Promise<void> {
    console.log('🚀 MockAnalyticsService.initialize() called (Expo Go mode)');
    
    try {
      // Generate or get device ID
      this.userId = await this.getOrCreateDeviceId();
      console.log('✅ Mock Device ID set:', this.userId);
      
      this.isInitialized = true;
      console.log('✅ Mock Analytics initialized:', this.isInitialized);
      
      // Track app open
      await this.trackSparkOpen('app', 'Sparks App');
      console.log('✅ App open tracked (mock)');
    } catch (error) {
      console.error('❌ Error during mock analytics initialization:', error);
      throw error;
    }
  }

  private static async getOrCreateDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('analytics_device_id');
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('analytics_device_id', deviceId);
        console.log('✅ Created new mock device ID:', deviceId);
      } else {
        console.log('✅ Using existing mock device ID:', deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Error getting mock device ID:', error);
      return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  static async trackSparkOpen(sparkId: string, sparkName?: string): Promise<void> {
    if (!this.isInitialized || !this.userId) return;

    console.log('📊 Mock Analytics: Spark opened', { sparkId, sparkName });
  }

  static async trackSparkComplete(
    sparkId: string, 
    sparkName: string,
    duration: number, 
    actions: string[]
  ): Promise<void> {
    if (!this.isInitialized || !this.userId) return;

    console.log('📊 Mock Analytics: Spark completed', { sparkId, sparkName, duration, actions });
  }

  static async trackError(error: Error, context: string): Promise<void> {
    if (!this.isInitialized || !this.userId) return;

    console.log('📊 Mock Analytics: Error occurred', { error: error.message, context });
  }

  static async trackFeatureUsage(feature: string, sparkId: string = 'app', sparkName?: string, properties?: object): Promise<void> {
    console.log('📊 Mock Analytics: Feature used', { feature, sparkId, sparkName, properties });
  }

  static async trackSettingsAccess(): Promise<void> {
    if (!this.isInitialized || !this.userId) return;

    console.log('📊 Mock Analytics: Settings accessed');
  }

  static async trackFeedbackSubmitted(sparkId: string, sparkName?: string, hasRating?: boolean, hasText?: boolean): Promise<void> {
    if (!this.isInitialized || !this.userId) return;

    console.log('📊 Mock Analytics: Feedback submitted', { sparkId, sparkName, hasRating, hasText });
  }

  static async trackSparkAdded(sparkId: string, sparkName: string): Promise<void> {
    if (!this.isInitialized || !this.userId) return;

    console.log('📊 Mock Analytics: Spark added', { sparkId, sparkName });
  }

  static async trackSparkRemoved(sparkId: string, sparkName: string): Promise<void> {
    if (!this.isInitialized || !this.userId) return;

    console.log('📊 Mock Analytics: Spark removed', { sparkId, sparkName });
  }

  static async trackUserEngagement(action: string, sparkId?: string): Promise<void> {
    if (!this.isInitialized || !this.userId) return;

    console.log('📊 Mock Analytics: User engagement', { action, sparkId });
  }

  static setUserProperties(properties: object): void {
    if (!this.isInitialized || !this.userId) return;

    console.log('📊 Mock Analytics: User properties set', properties);
  }

  static async flushEvents(): Promise<void> {
    console.log('📊 Mock Analytics: Events flushed (no-op in mock)');
  }

  static async endSession(): Promise<void> {
    this.isInitialized = false;
    this.userId = null;
    this.sessionId = MockAnalyticsService.generateSessionId();
    console.log('📊 Mock Analytics: Session ended');
  }

  static async trackPerformance(metric: string, value: number, context?: string): Promise<void> {
    if (!this.isInitialized || !this.userId) return;

    console.log('📊 Mock Analytics: Performance tracked', { metric, value, context });
  }

  static async trackCrash(error: Error, errorInfo: any): Promise<void> {
    if (!this.isInitialized || !this.userId) return;

    console.log('📊 Mock Analytics: Crash tracked', { error: error.message, errorInfo });
  }

  static getSessionInfo(): { sessionId: string; userId: string | null; isInitialized: boolean } {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      isInitialized: this.isInitialized,
    };
  }

  static getUserId(): string | null {
    return this.userId;
  }

  static getSessionId(): string {
    return this.sessionId;
  }

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
