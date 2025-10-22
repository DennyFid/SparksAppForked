import { FirebaseService } from './ServiceFactory';
import { AnalyticsService } from './AnalyticsService';
import { SparkFeedback, AggregatedRating } from '../types/analytics';

export class FeedbackService {
  private static feedbackQueue: SparkFeedback[] = [];
  private static sessionStartTime: number = 0;
  private static currentSparkId: string | null = null;
  private static completedActions: string[] = [];

  // Session Management
  static startSession(sparkId: string): void {
    this.sessionStartTime = Date.now();
    this.currentSparkId = sparkId;
    this.completedActions = [];
    
    // Track session start
    AnalyticsService.trackSparkOpen(sparkId);
  }

  static endSession(): void {
    if (!this.currentSparkId) return;

    const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    
    // Track session completion
    AnalyticsService.trackSparkComplete(
      this.currentSparkId,
      sessionDuration,
      this.completedActions
    );

    // Reset session data
    this.sessionStartTime = 0;
    this.currentSparkId = null;
    this.completedActions = [];
  }

  // Action Tracking
  static trackAction(action: string): void {
    if (!this.completedActions.includes(action)) {
      this.completedActions.push(action);
    }
    
    // Track user engagement
    AnalyticsService.trackUserEngagement(action, this.currentSparkId || undefined);
  }

  // Feedback Submission
  static async submitFeedback(feedbackData: {
    userId: string;
    sparkId: string;
    sparkName: string;
    rating: number;
    feedback?: string;
    sessionId?: string;
    platform: 'ios' | 'android' | 'web';
  }): Promise<void> {
    const sessionDuration = this.sessionStartTime > 0 
      ? Math.floor((Date.now() - this.sessionStartTime) / 1000)
      : 0;

    const feedback: Omit<SparkFeedback, 'id' | 'timestamp'> = {
      userId: feedbackData.userId,
      sparkId: feedbackData.sparkId,
      sparkName: feedbackData.sparkName,
      rating: feedbackData.rating as 1 | 2 | 3 | 4 | 5,
      comment: feedbackData.feedback || null,
      sessionDuration,
      completedActions: [...this.completedActions],
      feedbackType: feedbackData.feedback ? 'detailed' : 'rating',
      appVersion: '1.0.0',
      platform: feedbackData.platform,
    };

    try {
      await FirebaseService.submitFeedback(feedback);
      
      // Track feedback submission
      AnalyticsService.trackFeatureUsage('feedback_submitted', feedbackData.sparkId, feedbackData.sparkName, {
        rating: feedbackData.rating,
        hasComment: !!feedbackData.feedback,
      });

      // Add to local queue for offline support
      this.feedbackQueue.push(feedback as SparkFeedback);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  // Legacy method for backward compatibility
  static async submitFeedbackLegacy(
    sparkId: string,
    rating: number,
    comment?: string,
    feedbackType: 'rating' | 'quick' | 'detailed' = 'rating'
  ): Promise<void> {
    const sessionDuration = this.sessionStartTime > 0 
      ? Math.floor((Date.now() - this.sessionStartTime) / 1000)
      : 0;

    const feedback: Omit<SparkFeedback, 'id' | 'timestamp'> = {
      userId: 'anonymous',
      sparkId,
      rating: rating as 1 | 2 | 3 | 4 | 5,
      comment,
      sessionDuration,
      completedActions: [...this.completedActions],
      feedbackType,
      appVersion: '1.0.0',
      platform: 'ios',
    };

    try {
      await FirebaseService.submitFeedback(feedback);
      
      // Track feedback submission
      AnalyticsService.trackFeatureUsage('feedback_submitted', sparkId, sparkId, {
        rating,
        hasComment: !!comment,
        feedbackType,
      });

      // Add to local queue for offline support
      this.feedbackQueue.push(feedback as SparkFeedback);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  // Rating Retrieval
  static async getSparkRating(sparkId: string): Promise<AggregatedRating> {
    try {
      return await FirebaseService.getAggregatedRatings(sparkId);
    } catch (error) {
      console.error('Error getting spark rating:', error);
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
  }

  // Feedback History
  static async getFeedbackHistory(sparkId: string): Promise<SparkFeedback[]> {
    try {
      return await FirebaseService.getFeedbackForSpark(sparkId);
    } catch (error) {
      console.error('Error getting feedback history:', error);
      return [];
    }
  }

  // Get user's feedback for a specific spark
  static async getUserFeedback(userId: string, sparkId: string): Promise<SparkFeedback[]> {
    try {
      return await FirebaseService.getUserFeedback(userId, sparkId);
    } catch (error) {
      console.error('Error getting user feedback:', error);
      return [];
    }
  }

  // Quick Feedback
  static async submitQuickFeedback(
    sparkId: string,
    isPositive: boolean
  ): Promise<void> {
    const rating = isPositive ? 5 : 1;
    const feedbackType = 'quick';
    
    await this.submitFeedback(sparkId, rating, undefined, feedbackType);
  }

  // Batch Operations
  static async flushPendingFeedback(): Promise<void> {
    if (this.feedbackQueue.length === 0) return;

    try {
      // Process all pending feedback
      for (const feedback of this.feedbackQueue) {
        await FirebaseService.submitFeedback(feedback);
      }
      
      // Clear queue
      this.feedbackQueue = [];
    } catch (error) {
      console.error('Error flushing pending feedback:', error);
    }
  }

  // Analytics Integration
  static async trackFeedbackModalOpen(sparkId: string): Promise<void> {
    AnalyticsService.trackFeatureUsage('feedback_modal_opened', { sparkId });
  }

  static async trackFeedbackModalClose(sparkId: string, submitted: boolean): Promise<void> {
    AnalyticsService.trackFeatureUsage('feedback_modal_closed', { 
      sparkId, 
      submitted 
    });
  }

  // Utility Methods
  static getSessionDuration(): number {
    if (this.sessionStartTime === 0) return 0;
    return Math.floor((Date.now() - this.sessionStartTime) / 1000);
  }

  static getCompletedActions(): string[] {
    return [...this.completedActions];
  }

  static getCurrentSparkId(): string | null {
    return this.currentSparkId;
  }

  // Feedback Triggers
  static shouldShowFeedback(sparkId: string): boolean {
    // TODO: Implement logic to determine when to show feedback
    // This could be based on:
    // - Session duration
    // - Number of completed actions
    // - User preferences
    // - Previous feedback frequency
    return true;
  }

  // Privacy Controls
  static async clearUserFeedback(userId: string): Promise<void> {
    try {
      await FirebaseService.deleteUserData(userId);
    } catch (error) {
      console.error('Error clearing user feedback:', error);
      throw error;
    }
  }
}
