import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string; // Auto-generated user ID
  uid?: string; // Firebase Auth ID
  deviceId?: string; // Unique device identifier
  platform?: 'ios' | 'android' | 'web';
  appVersion?: string;
  createdAt: Timestamp | Date;
  lastActiveAt?: Timestamp | Date;
  lastSignInAt?: Timestamp | Date;
  isAnonymous?: boolean;
  preferences?: {
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
  text?: string; // Alias for comment
  response?: string; // Response from developer/admin
  adminResponse?: string; // Alias for response
  viewedByAdmin?: boolean; // Whether admin has viewed this feedback
  viewedByAdminAt?: string | Date; // When admin viewed this feedback
  readByUser?: boolean; // Whether user has read the response
  readByUserAt?: string | Date; // When user read the response
  hasUnreadAdminResponse?: boolean;
  sessionDuration: number; // in seconds
  completedActions: string[]; // list of actions completed
  feedbackType: 'rating' | 'quick' | 'detailed';
  timestamp: Timestamp;
  createdAt: string | Date; // ISO string or Date
  updatedAt?: Timestamp | Date;
  appVersion: string;
  platform: 'ios' | 'android' | 'web';
}

export interface AnalyticsEvent {
  id: string;
  userId?: string | null; // Can be null for anonymous users
  deviceId?: string; // Unique device identifier (used when userId is null)
  eventType: 'spark_opened' | 'spark_completed' | 'settings_accessed' | 'error_occurred' | 'feature_used' | 'spark_added' | 'spark_removed' | 'user_engagement';
  eventName?: string; // Alias for eventType
  sparkId?: string;
  eventData: {
    [key: string]: any; // Flexible event properties
  };
  properties?: {
    [key: string]: any; // Alias for eventData
  };
  timestamp: Timestamp | Date;
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
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface AggregatedRating {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: { [rating: number]: number };
}

export interface AggregatedRatingItem {
  rating: number;
  count: number;
  percentage: number;
}

export interface AnalyticsData {
  sparkId?: string;
  dateRange?: { start: Date; end: Date };
  startDate?: Date;
  endDate?: Date;
  metrics?: {
    totalSessions: number;
    averageSessionDuration: number;
    completionRate: number;
    userRetention: number;
    errorRate: number;
  };
  totalEvents?: number;
  uniqueUsers?: number;
  sparkOpens?: number;
  sparkCompletes?: number;
  events?: AnalyticsEvent[];
}

export interface SessionData {
  sessionId: string;
  userId: string;
  sparkId: string;
  startTime: Timestamp | Date;
  endTime?: Timestamp | Date;
  duration?: number;
  actions: string[];
  completed: boolean;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  eventCount?: number;
}
