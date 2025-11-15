import { Timestamp } from '@react-native-firebase/firestore';

export interface User {
  id: string; // Auto-generated user ID
  deviceId: string; // Unique device identifier
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
  preferences: {
    allowsAnalytics: boolean;
    allowsFeedback: boolean;
    notificationsEnabled: boolean;
  };
  demographics?: {
    ageRange?: string;
    region?: string;
    language?: string;
  };
}

export interface SparkFeedback {
  id: string;
  userId: string;
  sparkId: string;
  sparkName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  response?: string; // Response from developer/admin
  viewedByAdmin?: boolean; // Whether admin has viewed this feedback
  viewedByAdminAt?: string | Date; // When admin viewed this feedback
  readByUser?: boolean; // Whether user has read the response
  readByUserAt?: string | Date; // When user read the response
  sessionDuration: number; // in seconds
  completedActions: string[]; // list of actions completed
  feedbackType: 'rating' | 'quick' | 'detailed';
  timestamp: Timestamp;
  createdAt: string; // ISO string for easier handling
  appVersion: string;
  platform: 'ios' | 'android' | 'web';
}

export interface AnalyticsEvent {
  id: string;
  userId: string;
  eventType: 'spark_opened' | 'spark_completed' | 'settings_accessed' | 'error_occurred' | 'feature_used';
  sparkId?: string;
  eventData: {
    [key: string]: any; // Flexible event properties
  };
  timestamp: Timestamp;
  sessionId: string;
  appVersion: string;
  platform: 'ios' | 'android' | 'web';
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  targetAudience?: {
    platforms?: ('ios' | 'android' | 'web')[];
    appVersions?: string[];
    userSegments?: string[];
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AggregatedRating {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: { [rating: number]: number };
}

export interface AnalyticsData {
  sparkId?: string;
  dateRange?: { start: Date; end: Date };
  metrics: {
    totalSessions: number;
    averageSessionDuration: number;
    completionRate: number;
    userRetention: number;
    errorRate: number;
  };
}

export interface SessionData {
  sessionId: string;
  userId: string;
  sparkId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  duration?: number;
  actions: string[];
  completed: boolean;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
}
