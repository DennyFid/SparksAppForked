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
      await FirebaseService.updateFeedbackResponse(feedbackId, response);
      
      // Get the feedback details to send notification
      const feedback = await FirebaseService.getFeedbackById(feedbackId);
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
      return await FirebaseService.getAllFeedback();
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
      return await FirebaseService.getFeedbackBySpark(sparkId);
    } catch (error) {
      console.error('Error getting feedback by spark:', error);
      return [];
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
      return FeedbackNotificationService.isAdminDevice(sessionInfo.userId || '');
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }
}
