import { 
  User, 
  SparkFeedback, 
  AnalyticsEvent, 
  FeatureFlag, 
  AggregatedRating, 
  AnalyticsData,
  SessionData 
} from '../types/analytics';
import { MockFirebaseService } from './MockFirebaseService';
import { MockAnalyticsService } from './MockAnalyticsService';

// Check if Firebase is available
let firestore: any = null;
let isFirebaseAvailable = false;

try {
  const firebaseModule = require('@react-native-firebase/firestore');
  firestore = firebaseModule.default;
  isFirebaseAvailable = true;
  console.log('✅ Firebase is available - using real Firebase service');
} catch (error) {
  console.log('⚠️ Firebase not available, using mock service:', error.message);
  isFirebaseAvailable = false;
}

// Service factory that uses real Firebase in development builds, falls back to mock if needed
export class ServiceFactory {
  static getFirebaseService() {
    console.log('🏭 ServiceFactory.getFirebaseService called');
    console.log('🏭 Firebase available:', isFirebaseAvailable);
    
    if (isFirebaseAvailable) {
      console.log('✅ Returning real Firebase service');
      // Import FirebaseService directly to avoid circular dependency issues
      const { FirebaseService: RealFirebaseService } = require('./FirebaseService');
      return RealFirebaseService;
    }
    
    console.log('⚠️ Returning mock Firebase service');
    return MockFirebaseService;
  }

  static getAnalyticsService() {
    console.log('🏭 ServiceFactory.getAnalyticsService called');
    console.log('🏭 Firebase available:', isFirebaseAvailable);
    
    if (isFirebaseAvailable) {
      console.log('✅ Returning real Analytics service');
      // Import AnalyticsService directly to avoid circular dependency issues
      const { AnalyticsService: RealAnalyticsService } = require('./AnalyticsService');
      return RealAnalyticsService;
    }
    
    console.log('⚠️ Returning mock Analytics service');
    return MockAnalyticsService;
  }

  static isUsingMock() {
    return !isFirebaseAvailable;
  }
}

// Export the FirebaseService directly
export const FirebaseService = ServiceFactory.getFirebaseService();
