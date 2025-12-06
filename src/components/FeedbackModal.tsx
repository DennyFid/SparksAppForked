import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { StarRating } from './StarRating';
import { HapticFeedback } from '../utils/haptics';
import { FirebaseService } from '../services/ServiceFactory';
import { SparkFeedback } from '../types/analytics';

interface FeedbackModalProps {
  visible: boolean;
  sparkId: string;
  sessionDuration: number;
  completedActions: string[];
  onClose: () => void;
  onSubmit?: (feedback: SparkFeedback) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  sparkId,
  sessionDuration,
  completedActions,
  onClose,
  onSubmit,
}) => {
  const { colors } = useTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'rating' | 'quick' | 'detailed'>('rating');

  useEffect(() => {
    if (visible) {
      setRating(0);
      setComment('');
      setFeedbackType('rating');
    }
  }, [visible]);

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    setFeedbackType('rating');
    HapticFeedback.light();
  };

  const handleQuickFeedback = (type: 'thumbs_up' | 'thumbs_down') => {
    const quickRating = type === 'thumbs_up' ? 5 : 1;
    setRating(quickRating);
    setFeedbackType('quick');
    HapticFeedback.light();
  };

  const handleCommentChange = (text: string) => {
    setComment(text);
    if (text.length > 0) {
      setFeedbackType('detailed');
    } else if (rating > 0) {
      setFeedbackType('rating');
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please provide a rating before submitting feedback.');
      return;
    }

    setIsSubmitting(true);
    HapticFeedback.medium();

    try {
      const feedback: Omit<SparkFeedback, 'id' | 'timestamp'> = {
        userId: 'anonymous', // TODO: Get actual user ID
        sparkId,
        sparkName: sparkId, // Use sparkId as sparkName for now
        rating: rating as 1 | 2 | 3 | 4 | 5,
        comment: comment.trim() || '',
        sessionDuration,
        completedActions,
        feedbackType,
        appVersion: '1.0.0', // TODO: Get from app config
        platform: Platform.OS as 'ios' | 'android' | 'web',
        createdAt: new Date(),
      };

      await FirebaseService.submitFeedback(feedback);

      if (onSubmit) {
        onSubmit(feedback as SparkFeedback);
      }

      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted successfully.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert(
        'Error',
        'Failed to submit feedback. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    HapticFeedback.light();
    onClose();
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              How was your experience?
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Session duration: {formatDuration(sessionDuration)}
            </Text>
          </View>

          {/* Star Rating */}
          <View style={styles.ratingSection}>
            <StarRating
              rating={rating}
              onRatingChange={handleRatingChange}
              size={50}
              showLabel={true}
            />
          </View>

          {/* Quick Feedback Buttons */}
          <View style={styles.quickFeedbackSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Quick Feedback
            </Text>
            <View style={styles.quickFeedbackButtons}>
              <TouchableOpacity
                style={[
                  styles.quickButton,
                  {
                    backgroundColor: rating === 5 ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleQuickFeedback('thumbs_up')}
              >
                <Text style={[styles.quickButtonText, { color: rating === 5 ? colors.background : colors.text }]}>
                  👍
                </Text>
                <Text style={[styles.quickButtonLabel, { color: rating === 5 ? colors.background : colors.text }]}>
                  Great!
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickButton,
                  {
                    backgroundColor: rating === 1 ? colors.error : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleQuickFeedback('thumbs_down')}
              >
                <Text style={[styles.quickButtonText, { color: rating === 1 ? colors.background : colors.text }]}>
                  👎
                </Text>
                <Text style={[styles.quickButtonLabel, { color: rating === 1 ? colors.background : colors.text }]}>
                  Needs Work
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comment Section */}
          <View style={styles.commentSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Additional Comments (Optional)
            </Text>
            <TextInput
              style={[
                styles.commentInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Tell us more about your experience..."
              placeholderTextColor={colors.textSecondary}
              value={comment}
              onChangeText={handleCommentChange}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
              {comment.length}/500
            </Text>
          </View>

          {/* Completed Actions */}
          {completedActions.length > 0 && (
            <View style={styles.actionsSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Actions Completed
              </Text>
              <View style={styles.actionsList}>
                {completedActions.map((action, index) => (
                  <View
                    key={index}
                    style={[styles.actionItem, { backgroundColor: colors.surface }]}
                  >
                    <Text style={[styles.actionText, { color: colors.text }]}>
                      ✓ {action}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Buttons */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.skipButton, { borderColor: colors.border }]}
            onPress={handleSkip}
            disabled={isSubmitting}
          >
            <Text style={[styles.skipButtonText, { color: colors.text }]}>
              Skip
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: rating > 0 ? colors.primary : colors.border,
              },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            <Text
              style={[
                styles.submitButtonText,
                {
                  color: rating > 0 ? colors.background : colors.textSecondary,
                },
              ]}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  quickFeedbackSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickFeedbackButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 100,
  },
  quickButtonText: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentSection: {
    marginBottom: 30,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  actionsSection: {
    marginBottom: 30,
  },
  actionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
