import { FirebaseService } from './ServiceFactory';
import { FeedbackNotificationService } from './FeedbackNotificationService';

export class AdminResponseService {
  /**
   * Add a response to user feedback
   */
  static async addResponse(
    feedbackId: string, 
    response: string, 
    adminDeviceId: string
  ): Promise<void> {
    try {
      // Update the feedback document with the response
      await (FirebaseService as any).updateFeedbackResponse(feedbackId, {
        adminId: adminDeviceId,
        text: response
      });
      
      // Get the feedback details to send notification
      const feedback = await (FirebaseService as any).getFeedbackById(feedbackId);
      if (feedback) {
        // Send notification to the user who submitted the feedback
        await FeedbackNotificationService.addPendingResponse(
          feedback.userId,
          feedbackId,
          feedback.sparkId,
          feedback.sparkName
        );
        
        console.log('✅ Response added and notification sent to user');
      }
    } catch (error) {
      console.error('Error adding response:', error);
      throw error;
    }
  }

  /**
   * Get all feedback for admin review
   */
  static async getAllFeedback(): Promise<any[]> {
    try {
      return await (FirebaseService as any).getAllFeedback();
    } catch (error) {
      console.error('Error getting all feedback:', error);
      return [];
    }
  }

  /**
   * Get feedback by spark ID
   */
  static async getFeedbackBySpark(sparkId: string): Promise<any[]> {
    try {
      return await (FirebaseService as any).getFeedbackBySpark(sparkId);
    } catch (error) {
      console.error('Error getting feedback by spark:', error);
      return [];
    }
  }

  /**
   * Mark feedback as viewed by admin
   */
  static async markFeedbackAsViewed(feedbackId: string): Promise<void> {
    try {
      await (FirebaseService as any).markFeedbackAsViewedByAdmin(feedbackId);
    } catch (error) {
      console.error('Error marking feedback as viewed:', error);
      throw error;
    }
  }

  /**
   * Mark multiple feedback items as viewed by admin
   */
  static async markMultipleFeedbackAsViewed(feedbackIds: string[]): Promise<void> {
    try {
      await Promise.all(feedbackIds.map(id => this.markFeedbackAsViewed(id)));
    } catch (error) {
      console.error('Error marking multiple feedback as viewed:', error);
      throw error;
    }
  }

  /**
   * Get unread feedback count for admin
   */
  static async getUnreadFeedbackCount(): Promise<number> {
    try {
      const allFeedback = await this.getAllFeedback();
      console.log('🔍 getUnreadFeedbackCount - Total feedback:', allFeedback.length);
      
      const unreadFeedback = allFeedback.filter(
        item => item.viewedByAdmin === undefined || item.viewedByAdmin === false
      );
      
      console.log('🔍 getUnreadFeedbackCount - Unread feedback:', unreadFeedback.length);
      console.log('🔍 Sample unread items:', unreadFeedback.slice(0, 3).map(item => ({
        id: item.id,
        viewedByAdmin: item.viewedByAdmin,
        sparkName: item.sparkName
      })));
      
      return unreadFeedback.length;
    } catch (error) {
      console.error('Error getting unread feedback count:', error);
      return 0;
    }
  }

  /**
   * Check if current device is admin
   */
  static async isAdmin(): Promise<boolean> {
    try {
      const { ServiceFactory } = await import('./ServiceFactory');
      const AnalyticsService = ServiceFactory.getAnalyticsService();
      const sessionInfo = AnalyticsService.getSessionInfo();
      const deviceId = sessionInfo.userId || sessionInfo.sessionId || '';
      console.log('🔍 AdminResponseService.isAdmin - deviceId:', deviceId);
      console.log('🔍 AdminResponseService.isAdmin - userId:', sessionInfo.userId);
      console.log('🔍 AdminResponseService.isAdmin - sessionId:', sessionInfo.sessionId);
      return FeedbackNotificationService.isAdminDevice(deviceId);
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }
}
