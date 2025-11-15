import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { AdminResponseService } from '../services/AdminResponseService';
import { SparkFeedback } from '../types/analytics';

interface AdminReviewsManagerProps {
  visible: boolean;
  onClose: () => void;
}

export const AdminReviewsManager: React.FC<AdminReviewsManagerProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const [reviews, setReviews] = useState<SparkFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadReviewsAndMarkAsViewed();
    }
  }, [visible]);

  const loadReviewsAndMarkAsViewed = async () => {
    try {
      setIsLoading(true);
      const allFeedback = await AdminResponseService.getAllFeedback();
      
      // Mark all unread reviews as viewed when modal opens
      const unreadReviews = allFeedback.filter(
        item => (!item.comment || item.comment.trim() === '') && item.rating && !item.viewedByAdmin && item.id
      );
      if (unreadReviews.length > 0) {
        const unreadIds = unreadReviews.map(item => item.id).filter(Boolean);
        if (unreadIds.length > 0 && AdminResponseService.markMultipleFeedbackAsViewed) {
          await AdminResponseService.markMultipleFeedbackAsViewed(unreadIds);
        } else if (unreadIds.length > 0) {
          // Fallback: mark individually if batch method doesn't exist
          await Promise.all(unreadIds.map(id => AdminResponseService.markFeedbackAsViewed(id)));
        }
      }
      
      // Filter to show only ratings without comments (pure reviews)
      const ratingsOnly = allFeedback.filter(
        item => (!item.comment || item.comment.trim() === '') && item.rating
      );
      // Sort: unread first, then by rating (lowest first), then by date (newest first)
      ratingsOnly.sort((a, b) => {
        const aUnread = !a.viewedByAdmin;
        const bUnread = !b.viewedByAdmin;
        if (aUnread !== bUnread) {
          return aUnread ? -1 : 1; // Unread first
        }
        if (a.rating !== b.rating) {
          return a.rating - b.rating; // Lower ratings first
        }
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Newest first
      });
      setReviews(ratingsOnly);
    } catch (error) {
      console.error('Error loading reviews:', error);
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

  // Helper to get star emoji based on rating
  const getStarEmoji = (rating: number): string => {
    return rating >= 4 ? '⭐' : rating >= 3 ? '⭐' : '⭐';
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
    headerContent: {
      flex: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    reviewCount: {
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
    reviewItem: {
      backgroundColor: colors.surface,
      padding: 16,
      marginBottom: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reviewHeader: {
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
      fontSize: 18,
      fontWeight: '600',
      color: colors.primary,
    },
    date: {
      fontSize: 12,
      color: colors.textSecondary,
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
  });

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Recent Reviews</Text>
            <Text style={styles.reviewCount}>{reviews.length} reviews</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {reviews.map((item) => (
            <View 
              key={item.id} 
              style={[
                styles.reviewItem,
                !item.viewedByAdmin && { borderLeftWidth: 4, borderLeftColor: colors.error }
              ]}
            >
              <View style={styles.reviewHeader}>
                <Text style={styles.sparkName}>{item.sparkName}</Text>
                <Text style={styles.rating}>
                  {item.rating}/5 {getStarEmoji(item.rating)}
                </Text>
              </View>
              <Text style={styles.date}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
          ))}

          {reviews.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No reviews yet</Text>
              <Text style={styles.emptyStateSubtext}>Ratings without comments will appear here</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

