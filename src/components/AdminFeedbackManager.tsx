import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { AdminResponseService } from '../services/AdminResponseService';
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
      loadFeedback();
    }
  }, [visible]);

  const loadFeedback = async () => {
    try {
      setIsLoading(true);
      const allFeedback = await AdminResponseService.getAllFeedback();
      setFeedback(allFeedback);
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
      await AdminResponseService.addResponse(
        selectedFeedback.id,
        responseText.trim(),
        'admin_device_1' // Replace with actual admin device ID
      );
      
      Alert.alert('Success', 'Response added successfully');
      setResponseText('');
      setSelectedFeedback(null);
      loadFeedback(); // Refresh the list
    } catch (error) {
      console.error('Error adding response:', error);
      Alert.alert('Error', 'Failed to add response');
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Feedback Manager</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
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

            {item.response && (
              <View style={styles.existingResponse}>
                <Text style={styles.responseLabel}>Your Response:</Text>
                <Text style={styles.responseText}>{item.response}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

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
  );
};
