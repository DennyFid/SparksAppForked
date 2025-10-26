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
  const [selectedFeedback, setSelectedFeedback] = useState<SparkFeedback | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      console.log('🔍 AdminFeedbackManager: Modal opened, loading feedback...');
      loadFeedback();
    } else {
      console.log('🔍 AdminFeedbackManager: Modal closed');
    }
  }, [visible]);

  const loadFeedback = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 AdminFeedbackManager: Loading all feedback...');
      const allFeedback = await AdminResponseService.getAllFeedback();
      console.log('🔍 AdminFeedbackManager: Raw feedback count:', allFeedback.length);
      // Filter to show only feedback without responses
      const pendingFeedback = allFeedback.filter(item => !item.response || item.response.trim() === '');
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

  const handleAddResponse = async () => {
    if (!selectedFeedback || !responseText.trim()) {
      Alert.alert('Error', 'Please select feedback and enter a response');
      return;
    }

    try {
      setIsLoading(true);
      
      // Get current admin device ID
      const AnalyticsService = ServiceFactory.getAnalyticsService();
      const sessionInfo = AnalyticsService.getSessionInfo();
      const adminDeviceId = sessionInfo.userId || sessionInfo.sessionId || 'admin_device';
      
      await AdminResponseService.addResponse(
        selectedFeedback.id,
        responseText.trim(),
        adminDeviceId
      );
      
      Alert.alert('Success', 'Response added successfully');
      setResponseText('');
      setSelectedFeedback(null);
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
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    pendingCount: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      fontSize: 16,
      color: colors.primary,
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
      marginTop: 20,
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
          <Text style={styles.title}>Admin Feedback Manager</Text>
          <View style={styles.headerRight}>
            <Text style={styles.pendingCount}>{feedback.length} pending</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content}>
          {feedback.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.feedbackItem,
                selectedFeedback?.id === item.id && { borderColor: colors.primary }
              ]}
              onPress={() => setSelectedFeedback(item)}
            >
              <View style={styles.feedbackHeader}>
                <Text style={styles.sparkName}>{item.sparkName}</Text>
                <Text style={styles.rating}>{item.rating}/5 ⭐</Text>
              </View>
              
              {item.comment && (
                <Text style={styles.comment}>{item.comment}</Text>
              )}
              
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString()}
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
                  setSelectedFeedback(item);
                  setResponseText('');
                }}
              >
                <Text style={styles.customResponseButtonText}>Custom Reply</Text>
              </TouchableOpacity>
            </View>

              {item.response && (
                <View style={styles.existingResponse}>
                  <Text style={styles.responseLabel}>Your Response:</Text>
                  <Text style={styles.responseText}>{item.response}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {feedback.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No pending feedback</Text>
              <Text style={styles.emptyStateSubtext}>All feedback has been responded to!</Text>
            </View>
          )}

          {selectedFeedback && (
            <View style={styles.responseSection}>
              <Text style={styles.responseTitle}>
                Add Response to {selectedFeedback.sparkName}
              </Text>
              
              <TextInput
                style={styles.responseInput}
                placeholder="Enter your response..."
                placeholderTextColor={colors.textSecondary}
                value={responseText}
                onChangeText={setResponseText}
                multiline
              />
              
              <TouchableOpacity
                style={styles.addResponseButton}
                onPress={handleAddResponse}
                disabled={isLoading}
              >
                <Text style={styles.addResponseButtonText}>
                  {isLoading ? 'Adding...' : 'Add Response'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};
