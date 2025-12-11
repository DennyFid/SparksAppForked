import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { HapticFeedback } from '../utils/haptics';
import { FeedbackService } from '../services/FeedbackService';
import { FeedbackNotificationService } from '../services/FeedbackNotificationService';
import { ServiceFactory } from '../services/ServiceFactory';
import { CommonModal } from './CommonModal';

interface PendingResponseModalProps {
  visible: boolean;
  onClose: () => void;
  sparkId: string;
}

export const PendingResponseModal: React.FC<PendingResponseModalProps> = ({
  visible,
  onClose,
  sparkId,
}) => {
  const { colors } = useTheme();
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadPendingResponses();
    }
  }, [visible, sparkId]);

  const loadPendingResponses = async () => {
    try {
      setIsLoading(true);
      const deviceId = await FeedbackNotificationService.getPersistentDeviceId();
      await ServiceFactory.ensureFirebaseInitialized();
      
      const feedbacks = await FeedbackService.getUserFeedback(deviceId, sparkId);
      
      // Filter for unread responses
      const unreadResponses = feedbacks.filter(
        (f) => f.response && f.response.trim() && f.readByUser !== true
      );
      
      setResponses(unreadResponses);
    } catch (error) {
      console.error('Error loading pending responses:', error);
      setResponses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (feedbackId: string) => {
    try {
      const deviceId = await FeedbackNotificationService.getPersistentDeviceId();
      
      // Immediately remove from local state to hide button
      setResponses(prevResponses => 
        prevResponses.filter(r => r.id !== feedbackId && r.feedbackId !== feedbackId)
      );
      
      // Mark as read in Firebase and clear from pending responses
      await FeedbackNotificationService.markResponseAsRead(deviceId, feedbackId);
      
      // Reload responses to ensure sync with Firebase
      await loadPendingResponses();
      
      HapticFeedback.success();
    } catch (error) {
      console.error('Error marking response as read:', error);
      // Revert on error
      await loadPendingResponses();
      Alert.alert('Error', 'Failed to mark response as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const deviceId = await FeedbackNotificationService.getPersistentDeviceId();
      await FeedbackNotificationService.markAllResponsesAsRead(deviceId, sparkId);
      
      // Reload responses
      await loadPendingResponses();
      
      HapticFeedback.success();
      Alert.alert('Success', 'All responses marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all responses as read');
    }
  };

  const styles = StyleSheet.create({
    responseItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    responseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    responseDate: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    responseText: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 12,
      lineHeight: 20,
    },
    markAsReadButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    markAsReadButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    markAllButton: {
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 16,
    },
    markAllButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    emptyState: {
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: 16,
      paddingVertical: 40,
    },
    loadingText: {
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: 14,
      paddingVertical: 20,
    },
  });

  const footer = (
    <TouchableOpacity
      style={{
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: colors.border,
      }}
      onPress={onClose}
    >
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Close</Text>
    </TouchableOpacity>
  );

  return (
    <CommonModal
      visible={visible}
      title="Pending Responses"
      onClose={onClose}
      footer={footer}
    >
      {isLoading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : responses.length === 0 ? (
        <Text style={styles.emptyState}>No pending responses</Text>
      ) : (
        <>
          {responses.length > 1 && (
            <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
              <Text style={styles.markAllButtonText}>
                Mark All as Read ({responses.length})
              </Text>
            </TouchableOpacity>
          )}
          <ScrollView showsVerticalScrollIndicator={false}>
            {responses.map((item, index) => (
              <View key={index} style={styles.responseItem}>
                <View style={styles.responseHeader}>
                  <Text style={styles.responseDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                  {item.feedbackId && (
                    <TouchableOpacity
                      style={styles.markAsReadButton}
                      onPress={() => handleMarkAsRead(item.feedbackId || item.id)}
                    >
                      <Text style={styles.markAsReadButtonText}>Mark as Read</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {item.comment || item.text ? (
                  <Text style={styles.responseText}>
                    <Text style={{ fontWeight: '600' }}>Your feedback:</Text>{' '}
                    {item.comment || item.text}
                  </Text>
                ) : null}
                <Text style={styles.responseText}>
                  <Text style={{ fontWeight: '600', color: colors.primary }}>Response:</Text>{' '}
                  {item.response}
                </Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </CommonModal>
  );
};
