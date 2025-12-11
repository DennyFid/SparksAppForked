import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { CommonModal } from './CommonModal';
import { createCommonStyles } from '../styles/CommonStyles';
import { StyleTokens } from '../styles/StyleTokens';

export interface TranslationCard {
  id: number;
  english: string;
  spanish: string;
  correctCount: number;
  incorrectCount: number;
  lastAsked: Date | null;
  needsReview: boolean;
}

interface EditFlashcardModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (phrase: { english: string; spanish: string }) => void;
  onDelete: () => void;
  card: TranslationCard;
}

export const EditFlashcardModal: React.FC<EditFlashcardModalProps> = ({
  visible,
  onClose,
  onSave,
  onDelete,
  card
}) => {
  const { colors } = useTheme();
  const [spanishText, setSpanishText] = useState(card.spanish);
  const [englishText, setEnglishText] = useState(card.english);

  useEffect(() => {
    if (visible) {
      setSpanishText(card.spanish);
      setEnglishText(card.english);
    }
  }, [visible, card]);

  const handleSave = () => {
    if (!spanishText.trim() || !englishText.trim()) {
      Alert.alert('Error', 'Please enter both Spanish and English text.');
      return;
    }

    onSave({
      spanish: spanishText.trim(),
      english: englishText.trim(),
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Phrase',
      'Are you sure you want to delete this phrase?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete
        }
      ]
    );
  };

  const commonStyles = createCommonStyles(colors);
  const styles = StyleSheet.create({
    ...commonStyles,
    fieldLabel: {
      fontSize: StyleTokens.fontSize.md,
      fontWeight: '600',
      color: colors.text,
      marginBottom: StyleTokens.spacing.sm,
    },
    textInput: {
      ...commonStyles.input,
      marginBottom: StyleTokens.spacing.md,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: StyleTokens.spacing.xs,
    },
    button: {
      flex: 1,
      padding: StyleTokens.spacing.sm,
      borderRadius: StyleTokens.borderRadius.md,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    deleteButton: {
      backgroundColor: colors.error,
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontSize: StyleTokens.fontSize.md,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.text,
    },
    deleteButtonText: {
      color: colors.background,
    },
    saveButtonText: {
      color: colors.background,
    },
  });

  const footer = (
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={[styles.button, styles.cancelButton]}
        onPress={onClose}
      >
        <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.deleteButton]}
        onPress={handleDelete}
      >
        <Text style={[styles.buttonText, styles.deleteButtonText]}>Delete</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.saveButton]}
        onPress={handleSave}
      >
        <Text style={[styles.buttonText, styles.saveButtonText]}>Save</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <CommonModal
      visible={visible}
      title="Edit Phrase"
      onClose={onClose}
      footer={footer}
    >
      <Text style={styles.fieldLabel}>Spanish phrase</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Enter Spanish phrase..."
        placeholderTextColor={colors.textSecondary}
        value={spanishText}
        onChangeText={setSpanishText}
        multiline
        autoFocus
      />

      <Text style={styles.fieldLabel}>English translation</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Enter English translation..."
        placeholderTextColor={colors.textSecondary}
        value={englishText}
        onChangeText={setEnglishText}
        multiline
      />
    </CommonModal>
  );
};

