import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Linking, Modal } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { HapticFeedback } from '../utils/haptics';
import { StarRating } from './StarRating';
import { FeedbackService } from '../services/FeedbackService';
import { FeedbackNotificationService } from '../services/FeedbackNotificationService';
import { NotificationBadge } from './NotificationBadge';

interface SettingsContainerProps {
  children: React.ReactNode;
}

export const SettingsContainer: React.FC<SettingsContainerProps> = ({ children }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });

  return <View style={styles.container}>{children}</View>;
};

interface SettingsScrollViewProps {
  children: React.ReactNode;
}

export const SettingsScrollView: React.FC<SettingsScrollViewProps> = ({ children }) => {
  const styles = StyleSheet.create({
    scrollContainer: {
      padding: 20,
    },
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
};

interface SettingsHeaderProps {
  title: string;
  subtitle: string;
  icon?: string;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({ title, subtitle, icon }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    header: {
      alignItems: 'center',
      marginBottom: 30,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{icon && `${icon} `}{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    section: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 12,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 15,
    },
  });

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
};

interface SettingsInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  numberOfLines?: number;
}

export const SettingsInput: React.FC<SettingsInputProps> = ({
  placeholder,
  value,
  onChangeText,
  multiline = false,
  numberOfLines = 1
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    input: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      marginBottom: 12,
      minHeight: multiline ? numberOfLines * 24 + 24 : 44,
    },
  });

  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  );
};

interface SettingsButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
}

export const SettingsButton: React.FC<SettingsButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false
}) => {
  const { colors } = useTheme();

  const getButtonStyle = () => {
    const baseStyle = {
      opacity: disabled ? 0.6 : 1,
    };

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderWidth: 0,
          ...baseStyle
        };
      case 'secondary':
        return {
          backgroundColor: colors.border,
          borderWidth: 0,
          ...baseStyle
        };
      case 'danger':
        return {
          backgroundColor: colors.error,
          borderWidth: 0,
          ...baseStyle
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
          ...baseStyle
        };
      default:
        return {
          backgroundColor: colors.primary,
          borderWidth: 0,
          ...baseStyle
        };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return { color: '#fff' };
      case 'secondary':
        return { color: colors.text };
      case 'danger':
        return { color: '#fff' };
      case 'outline':
        return { color: colors.text };
      default:
        return { color: '#fff' };
    }
  };

  const styles = StyleSheet.create({
    button: {
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 12,
      ...getButtonStyle(),
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      ...getTextStyle(),
    },
  });

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

interface SettingsButtonRowProps {
  children: React.ReactNode;
}

export const SettingsButtonRow: React.FC<SettingsButtonRowProps> = ({ children }) => {
  const styles = StyleSheet.create({
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
  });

  return <View style={styles.buttonContainer}>{children}</View>;
};

interface SaveCancelButtonsProps {
  onSave: () => void;
  onCancel: () => void;
  saveText?: string;
  cancelText?: string;
  saveDisabled?: boolean;
}

export const SaveCancelButtons: React.FC<SaveCancelButtonsProps> = ({
  onSave,
  onCancel,
  saveText = 'Save Changes',
  cancelText = 'Cancel',
  saveDisabled = false
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    cancelButton: {
      backgroundColor: colors.border,
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
        <Text style={styles.cancelButtonText}>{cancelText}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.button,
          styles.saveButton,
          saveDisabled && { opacity: 0.6 }
        ]}
        onPress={onSave}
        disabled={saveDisabled}
      >
        <Text style={styles.saveButtonText}>{saveText}</Text>
      </TouchableOpacity>
    </View>
  );
};

interface SettingsItemProps {
  children: React.ReactNode;
}

export const SettingsItem: React.FC<SettingsItemProps> = ({ children }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    item: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
  });

  return <View style={styles.item}>{children}</View>;
};

interface SettingsTextProps {
  children: React.ReactNode;
  variant?: 'body' | 'caption';
}

export const SettingsText: React.FC<SettingsTextProps> = ({ children, variant = 'body' }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    bodyText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    captionText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });

  const textStyle = variant === 'body' ? styles.bodyText : styles.captionText;

  return <Text style={textStyle}>{children}</Text>;
};

interface SettingsRemoveButtonProps {
  onPress: () => void;
  text?: string;
}

export const SettingsRemoveButton: React.FC<SettingsRemoveButtonProps> = ({
  onPress,
  text = 'Remove'
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    removeButton: {
      backgroundColor: colors.error,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      marginLeft: 10,
    },
    removeButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
  });

  return (
    <TouchableOpacity style={styles.removeButton} onPress={onPress}>
      <Text style={styles.removeButtonText}>{text}</Text>
    </TouchableOpacity>
  );
};

// Enhanced Feedback Modal Component
interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  sparkName: string;
  sparkId: string;
  onSubmit: (rating: number, feedback: string) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ visible, onClose, sparkName, sparkId, onSubmit }) => {
  const { colors } = useTheme();
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(0, feedback); // Rating is handled separately now
      HapticFeedback.success();
      onClose();
      // Reset form
      setFeedback('');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      width: '90%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 20,
      textAlign: 'center',
    },
    feedbackInput: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      minHeight: 120,
      textAlignVertical: 'top',
      marginBottom: 20,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.border,
    },
    submitButton: {
      backgroundColor: colors.primary,
      opacity: isSubmitting ? 0.6 : 1,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.text,
    },
    submitButtonText: {
      color: '#fff',
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Share Feedback</Text>
          <Text style={styles.modalSubtitle}>Your feedback helps us improve {sparkName}</Text>

          <TextInput
            style={styles.feedbackInput}
            placeholder="Share your thoughts, suggestions, or issues..."
            placeholderTextColor={colors.textSecondary}
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={5}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.submitButton]} 
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={[styles.buttonText, styles.submitButtonText]}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Feedback Item Component
interface FeedbackItemProps {
  rating: number;
  comment?: string;
  response?: string;
  createdAt: string;
}

const FeedbackItem: React.FC<FeedbackItemProps> = ({ rating, comment, response, createdAt }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    item: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    rating: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 4,
    },
    ratingText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: 8,
    },
    date: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    feedback: {
      fontSize: 14,
      color: colors.text,
      marginBottom: response ? 12 : 0,
    },
    response: {
      backgroundColor: colors.primary + '20',
      borderRadius: 6,
      padding: 12,
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

  return (
    <View style={styles.item}>
      <View style={styles.header}>
        {rating > 0 ? (
          <View style={styles.rating}>
            <StarRating rating={rating} onRatingChange={() => {}} disabled size={16} />
            <Text style={styles.ratingText}>{rating}/5</Text>
          </View>
        ) : (
          <Text style={styles.ratingText}>💬 Feedback</Text>
        )}
        <Text style={styles.date}>{new Date(createdAt).toLocaleDateString()}</Text>
      </View>
      
      {comment ? <Text style={styles.feedback}>{comment}</Text> : null}
      
      {response && (
        <View style={styles.response}>
          <Text style={styles.responseLabel}>Response:</Text>
          <Text style={styles.responseText}>{response}</Text>
        </View>
      )}
    </View>
  );
};

interface SettingsFeedbackSectionProps {
  sparkName: string;
  sparkId?: string;
}

export const SettingsFeedbackSection: React.FC<SettingsFeedbackSectionProps> = ({ sparkName, sparkId = 'app' }) => {
  const { colors } = useTheme();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [userFeedbacks, setUserFeedbacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user feedback on mount
  useEffect(() => {
    loadUserFeedback();
  }, []);

  // Mark responses as read when feedback is loaded
  useEffect(() => {
    const markResponsesAsRead = async () => {
      try {
        const sessionInfo = AnalyticsService.getSessionInfo();
        const deviceId = sessionInfo.userId || 'anonymous';
        
        // Mark all responses as read for this spark
        await FeedbackNotificationService.markAllResponsesAsRead(deviceId, sparkId);
      } catch (error) {
        console.error('Error marking responses as read:', error);
      }
    };

    if (userFeedbacks.length > 0) {
      markResponsesAsRead();
    }
  }, [userFeedbacks, sparkId]);

  const loadUserFeedback = async () => {
    try {
      setIsLoading(true);
      // Get device ID for this user
      const sessionInfo = AnalyticsService.getSessionInfo();
      const deviceId = sessionInfo.userId || 'anonymous';
      const feedbacks = await FeedbackService.getUserFeedback(deviceId, sparkId);
      setUserFeedbacks(feedbacks || []);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFeedback = async (rating: number, feedback: string) => {
    try {
      console.log('🚀 SettingsFeedbackSection: Starting feedback submission...');
      
      // Ensure analytics is initialized
      const sessionInfo = AnalyticsService.getSessionInfo();
      if (!sessionInfo.isInitialized || !sessionInfo.userId) {
        console.log('⚠️ Analytics not initialized, attempting to initialize...');
        try {
          await AnalyticsService.initialize();
          console.log('✅ Analytics initialized for feedback submission');
        } catch (error) {
          console.error('❌ Failed to initialize analytics:', error);
          Alert.alert('Error', 'Failed to initialize analytics. Please try again.');
          return;
        }
      }
      
      const deviceId = sessionInfo.userId || 'anonymous';
      console.log('📝 Submitting feedback for user:', deviceId);
      
      // Submit feedback only (rating is handled separately)
      const feedbackData: any = {
        userId: deviceId,
        sparkId,
        sparkName,
        rating: 0, // No rating for feedback-only submissions
        sessionId: sessionInfo.sessionId,
        platform: 'ios' as 'ios' | 'android' | 'web',
      };
      
      // Only add feedback if it's not empty
      if (feedback.trim()) {
        feedbackData.feedback = feedback.trim();
      }
      
      await FeedbackService.submitFeedback(feedbackData);
      console.log('✅ Feedback submitted successfully');

      // Track analytics
      await AnalyticsService.trackFeatureUsage('feedback_submitted', sparkId, sparkName, {
        rating: 0,
        hasFeedback: !!feedback.trim(),
      });
      console.log('✅ Analytics tracked');

      // Reload feedback list
      await loadUserFeedback();
      
      Alert.alert('Thank You!', 'Your feedback has been submitted successfully.');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  };

  const handleRatingSubmit = async (rating: number) => {
    try {
      console.log('🚀 SettingsFeedbackSection: Starting rating submission...');
      
      // Ensure analytics is initialized
      const sessionInfo = AnalyticsService.getSessionInfo();
      if (!sessionInfo.isInitialized || !sessionInfo.userId) {
        console.log('⚠️ Analytics not initialized, attempting to initialize...');
        try {
          await AnalyticsService.initialize();
          console.log('✅ Analytics initialized for rating submission');
        } catch (error) {
          console.error('❌ Failed to initialize analytics:', error);
          Alert.alert('Error', 'Failed to initialize analytics. Please try again.');
          return;
        }
      }
      
      const deviceId = sessionInfo.userId || 'anonymous';
      console.log('⭐ Submitting rating for user:', deviceId);
      
      // Submit rating only
      await FeedbackService.submitFeedback({
        userId: deviceId,
        sparkId,
        sparkName,
        rating,
        sessionId: sessionInfo.sessionId,
        platform: 'ios' as 'ios' | 'android' | 'web',
      });
      console.log('✅ Rating submitted successfully');

      // Track analytics
      await AnalyticsService.trackFeatureUsage('rating_submitted', sparkId, sparkName, {
        rating,
        hasFeedback: false,
      });
      console.log('✅ Analytics tracked');

      // Reload feedback list
      await loadUserFeedback();
      
      HapticFeedback.success();
      Alert.alert('Thank You!', `Your ${rating}-star rating has been recorded.`);
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    }
  };

  const styles = StyleSheet.create({
    section: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 12,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 15,
    },
    appRatingContainer: {
      alignItems: 'center',
      marginBottom: 20,
      paddingVertical: 20,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderRadius: 8,
      minHeight: 80,
    },
    appRatingLabel: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 16,
    },
    feedbackButton: {
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 16,
    },
    feedbackButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    feedbackList: {
      marginTop: 8,
    },
    emptyState: {
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: 14,
      fontStyle: 'italic',
    },
  });

  return (
    <SettingsSection title="Feedback & Rating">
      {/* Notification Badge */}
      <View style={{ position: 'relative', alignSelf: 'flex-start' }}>
        <NotificationBadge sparkId={sparkId} size="small" />
      </View>
      
      {/* App Rating */}
      <View style={styles.appRatingContainer}>
        <Text style={styles.appRatingLabel}>Rate {sparkName}</Text>
        <StarRating
          rating={0}
          onRatingChange={(rating) => {
            if (rating > 0) {
              handleRatingSubmit(rating);
            }
          }}
          size={18}
        />
      </View>

      {/* Submit Feedback Button */}
      <TouchableOpacity style={styles.feedbackButton} onPress={() => setShowFeedbackModal(true)}>
        <Text style={styles.feedbackButtonText}>💬 Share Feedback</Text>
      </TouchableOpacity>

      {/* Feedback List */}
      {userFeedbacks.length > 0 && (
        <View style={styles.feedbackList}>
          <Text style={styles.sectionTitle}>Your Feedback</Text>
          {userFeedbacks.map((item, index) => (
            <FeedbackItem
              key={index}
              rating={item.rating}
              comment={item.comment || ''}
              response={item.response}
              createdAt={item.createdAt}
            />
          ))}
        </View>
      )}

      {!isLoading && userFeedbacks.length === 0 && (
        <Text style={styles.emptyState}>No feedback submitted yet</Text>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        sparkName={sparkName}
        sparkId={sparkId}
        onSubmit={handleSubmitFeedback}
      />
    </SettingsSection>
  );
};