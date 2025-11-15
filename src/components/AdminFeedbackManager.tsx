import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Modal } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { AdminResponseService } from '../services/AdminResponseService';
import { ServiceFactory } from '../services/ServiceFactory';
import { SparkFeedback } from '../types/analytics';

interface AdminFeedbackManagerProps {
  visible: boolean;
  onClose: () => void;
}

export const AdminFeedbackManager: React.FC<AdminFeedbackManagerProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const [feedback, setFeedback] = useState<SparkFeedback[]>([]);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      console.log('🔍 AdminFeedbackManager: Modal opened, loading feedback...');
      loadFeedbackAndMarkAsViewed();
    } else {
      console.log('🔍 AdminFeedbackManager: Modal closed');
    }
  }, [visible]);

  const loadFeedbackAndMarkAsViewed = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 AdminFeedbackManager: Loading all feedback...');
      const allFeedback = await AdminResponseService.getAllFeedback();
      console.log('🔍 AdminFeedbackManager: Raw feedback count:', allFeedback.length);
      
      // Mark all unread feedback as viewed when modal opens
      const unreadFeedback = allFeedback.filter(item => !item.viewedByAdmin && item.id);
      if (unreadFeedback.length > 0) {
        const unreadIds = unreadFeedback.map(item => item.id).filter(Boolean);
        if (unreadIds.length > 0 && AdminResponseService.markMultipleFeedbackAsViewed) {
          await AdminResponseService.markMultipleFeedbackAsViewed(unreadIds);
          console.log('✅ Marked', unreadIds.length, 'feedback items as viewed');
        } else if (unreadIds.length > 0) {
          // Fallback: mark individually if batch method doesn't exist
          await Promise.all(unreadIds.map(id => AdminResponseService.markFeedbackAsViewed(id)));
          console.log('✅ Marked', unreadIds.length, 'feedback items as viewed (individual)');
        }
      }
      
      // Filter to show only feedback with comments (not just ratings) and without responses
      const pendingFeedback = allFeedback.filter(
        item => (item.comment && item.comment.trim() !== '') && (!item.response || item.response.trim() === '')
      );
      // Sort: unread first, then by date (newest first)
      pendingFeedback.sort((a, b) => {
        const aUnread = !a.viewedByAdmin;
        const bUnread = !b.viewedByAdmin;
        if (aUnread !== bUnread) {
          return aUnread ? -1 : 1; // Unread first
        }
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Newest first
      });
      console.log('🔍 AdminFeedbackManager: Pending feedback count:', pendingFeedback.length);
      setFeedback(pendingFeedback);
      console.log('📝 Loaded pending feedback:', pendingFeedback.length);
    } catch (error) {
      console.error('Error loading feedback:', error);
      Alert.alert('Error', 'Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFeedback = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 AdminFeedbackManager: Loading all feedback...');
      const allFeedback = await AdminResponseService.getAllFeedback();
      console.log('🔍 AdminFeedbackManager: Raw feedback count:', allFeedback.length);
      // Filter to show only feedback with comments (not just ratings) and without responses
      const pendingFeedback = allFeedback.filter(
        item => (item.comment && item.comment.trim() !== '') && (!item.response || item.response.trim() === '')
      );
      // Sort: unread first, then by date (newest first)
      pendingFeedback.sort((a, b) => {
        const aUnread = !a.viewedByAdmin;
        const bUnread = !b.viewedByAdmin;
        if (aUnread !== bUnread) {
          return aUnread ? -1 : 1; // Unread first
        }
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Newest first
      });
      console.log('🔍 AdminFeedbackManager: Pending feedback count:', pendingFeedback.length);
      setFeedback(pendingFeedback);
      console.log('📝 Loaded pending feedback:', pendingFeedback.length);
    } catch (error) {
      console.error('Error loading feedback:', error);
      Alert.alert('Error', 'Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddResponse = async (feedbackId: string) => {
    const responseText = responseTexts[feedbackId];
    if (!responseText || !responseText.trim()) {
      Alert.alert('Error', 'Please enter a response');
      return;
    }

    try {
      setIsLoading(true);
      
      // Get current admin device ID
      const AnalyticsService = ServiceFactory.getAnalyticsService();
      const sessionInfo = AnalyticsService.getSessionInfo();
      const adminDeviceId = sessionInfo.userId || sessionInfo.sessionId || 'admin_device';
      
      await AdminResponseService.addResponse(
        feedbackId,
        responseText.trim(),
        adminDeviceId
      );
      
      Alert.alert('Success', 'Response added successfully');
      setResponseTexts(prev => {
        const next = { ...prev };
        delete next[feedbackId];
        return next;
      });
      setSelectedFeedbackId(null);
      await loadFeedback(); // Refresh the list
    } catch (error) {
      console.error('Error adding response:', error);
      Alert.alert('Error', 'Failed to add response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleThankYouResponse = async (feedbackItem: any) => {
    try {
      setIsLoading(true);
      
      // Get current admin device ID
      const AnalyticsService = ServiceFactory.getAnalyticsService();
      const sessionInfo = AnalyticsService.getSessionInfo();
      const adminDeviceId = sessionInfo.userId || sessionInfo.sessionId || 'admin_device';
      
      await AdminResponseService.addResponse(
        feedbackItem.id,
        'Thank you for your feedback!',
        adminDeviceId
      );
      
      Alert.alert('Success', 'Thank you response added successfully');
      await loadFeedback(); // Refresh the list
    } catch (error) {
      console.error('Error adding thank you response:', error);
      Alert.alert('Error', 'Failed to add thank you response');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format date safely
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return 'Unknown date';
    try {
      let date: Date;
      
      // Handle Firestore Timestamp objects
      if (dateValue && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate();
      }
      // Handle string dates
      else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      }
      // Handle Date objects
      else if (dateValue instanceof Date) {
        date = dateValue;
      }
      // Handle objects with seconds/nanoseconds (Firestore Timestamp structure)
      else if (dateValue && typeof dateValue.seconds === 'number') {
        date = new Date(dateValue.seconds * 1000);
      }
      // Fallback: try to create a Date from the value
      else {
        date = new Date(dateValue);
      }
      
      // Validate the date
      if (!date || isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'dateValue:', dateValue);
      return 'Invalid date';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerContent: {
      flex: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    pendingCount: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    feedbackItem: {
      backgroundColor: colors.surface,
      padding: 16,
      marginBottom: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    feedbackHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    sparkName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    rating: {
      fontSize: 14,
      color: colors.primary,
    },
    comment: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
    },
    date: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
      marginBottom: 8,
    },
    thankYouButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      flex: 1,
    },
    thankYouButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },
    customResponseButton: {
      backgroundColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      flex: 1,
    },
    customResponseButtonText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },
    responseSection: {
      marginTop: 12,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    responseTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    responseInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: colors.text,
      minHeight: 80,
      textAlignVertical: 'top',
      marginBottom: 12,
    },
    addResponseButton: {
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    addResponseButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      padding: 40,
      marginTop: 20,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    existingResponse: {
      backgroundColor: colors.primary + '20',
      padding: 12,
      borderRadius: 6,
      marginTop: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    responseLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 4,
    },
    responseText: {
      fontSize: 14,
      color: colors.text,
    },
  });

  if (!visible) return null;

  console.log('🔍 AdminFeedbackManager: Rendering modal with', feedback.length, 'feedback items');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Admin Feedback Manager</Text>
            <Text style={styles.pendingCount}>{feedback.length} pending</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {feedback.map((item) => (
            <View key={item.id}>
              <View
                style={[
                  styles.feedbackItem,
                  selectedFeedbackId === item.id && { borderColor: colors.primary },
                  !item.viewedByAdmin && { borderLeftWidth: 4, borderLeftColor: colors.error }
                ]}
              >
                <View style={styles.feedbackHeader}>
                  <Text style={styles.sparkName}>{item.sparkName}</Text>
                  {/* Only show rating if there's no comment */}
                  {!item.comment && (
                    <Text style={styles.rating}>{item.rating}/5 ⭐</Text>
                  )}
                </View>
                
                {item.comment && (
                  <Text style={styles.comment}>{item.comment}</Text>
                )}
                
                <Text style={styles.date}>
                  {formatDate(item.createdAt)}
                </Text>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.thankYouButton}
                    onPress={() => handleThankYouResponse(item)}
                  >
                    <Text style={styles.thankYouButtonText}>Thank you for your feedback!</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.customResponseButton}
                    onPress={() => {
                      if (selectedFeedbackId === item.id) {
                        setSelectedFeedbackId(null);
                        setResponseTexts(prev => {
                          const next = { ...prev };
                          delete next[item.id];
                          return next;
                        });
                      } else {
                        setSelectedFeedbackId(item.id);
                        if (!responseTexts[item.id]) {
                          setResponseTexts(prev => ({ ...prev, [item.id]: '' }));
                        }
                      }
                    }}
                  >
                    <Text style={styles.customResponseButtonText}>
                      {selectedFeedbackId === item.id ? 'Cancel' : 'Custom Reply'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {item.response && (
                  <View style={styles.existingResponse}>
                    <Text style={styles.responseLabel}>Your Response:</Text>
                    <Text style={styles.responseText}>{item.response}</Text>
                  </View>
                )}
              </View>

              {/* Response input appears immediately below the feedback item */}
              {selectedFeedbackId === item.id && (
                <View style={styles.responseSection}>
                  <Text style={styles.responseTitle}>
                    Add Response to {item.sparkName}
                  </Text>
                  
                  <TextInput
                    style={styles.responseInput}
                    placeholder="Enter your response..."
                    placeholderTextColor={colors.textSecondary}
                    value={responseTexts[item.id] || ''}
                    onChangeText={(text) => {
                      setResponseTexts(prev => ({ ...prev, [item.id]: text }));
                    }}
                    multiline
                  />
                  
                  <TouchableOpacity
                    style={styles.addResponseButton}
                    onPress={() => handleAddResponse(item.id)}
                    disabled={isLoading}
                  >
                    <Text style={styles.addResponseButtonText}>
                      {isLoading ? 'Adding...' : 'Add Response'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          {feedback.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No pending feedback</Text>
              <Text style={styles.emptyStateSubtext}>All feedback has been responded to!</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};
