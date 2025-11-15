import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { FeedbackNotificationService } from '../services/FeedbackNotificationService';
import { ServiceFactory } from '../services/ServiceFactory';

interface PendingResponseNotificationProps {
  sparkId: string;
  onPress?: () => void;
}

export const PendingResponseNotification: React.FC<PendingResponseNotificationProps> = ({ 
  sparkId, 
  onPress 
}) => {
  const { colors } = useTheme();
  const [hasPendingResponse, setHasPendingResponse] = useState(false);

  useEffect(() => {
    checkPendingResponse();
  }, [sparkId]);

  const checkPendingResponse = async () => {
    try {
      // Use persistent device ID to ensure consistency
      const deviceId = await FeedbackNotificationService.getPersistentDeviceId();
      const hasUnread = await FeedbackNotificationService.hasUnreadResponse(deviceId, sparkId);
      setHasPendingResponse(hasUnread);
    } catch (error) {
      console.error('Error checking pending response:', error);
      setHasPendingResponse(false);
    }
  };

  if (!hasPendingResponse) return null;

  const styles = StyleSheet.create({
    notification: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 4,
    },
    notificationText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '600',
      textAlign: 'center',
    },
  });

  return (
    <TouchableOpacity style={styles.notification} onPress={onPress}>
      <Text style={styles.notificationText}>📩 Pending Response</Text>
    </TouchableOpacity>
  );
};
