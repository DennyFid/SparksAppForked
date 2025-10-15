import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { HapticFeedback } from '../utils/haptics';
import { TranslationService } from '../utils/translation';

export interface Phrase {
  id: string;
  spanish: string;
  english: string;
  speaker: 'friend1' | 'friend2';
}

interface AddPhraseModalProps {
  visible: boolean;
  onClose: () => void;
  onAddPhrase: (phrase: Omit<Phrase, 'id'>) => void;
  initialSpeaker?: 'friend1' | 'friend2';
  showSpeakerSelection?: boolean;
}

const AddPhraseModal: React.FC<AddPhraseModalProps> = ({
  visible,
  onClose,
  onAddPhrase,
  initialSpeaker = 'friend1',
  showSpeakerSelection = true
}) => {
  const { colors } = useTheme();
  const [spanishText, setSpanishText] = useState('');
  const [englishText, setEnglishText] = useState('');
  const [speaker, setSpeaker] = useState<'friend1' | 'friend2'>(initialSpeaker);
  const [isNetworkAvailable, setIsNetworkAvailable] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // Check network connectivity on mount
  useEffect(() => {
    const checkNetwork = async () => {
      const isOnline = await TranslationService.isNetworkAvailable();
      setIsNetworkAvailable(isOnline);
    };
    checkNetwork();
  }, []);

  const handleAddPhrase = () => {
    if (!spanishText.trim() || !englishText.trim()) {
      Alert.alert('Error', 'Please enter both Spanish and English text.');
      return;
    }

    onAddPhrase({
      spanish: spanishText.trim(),
      english: englishText.trim(),
      speaker
    });

    // Reset form
    setSpanishText('');
    setEnglishText('');
    setSpeaker(initialSpeaker);
    
    HapticFeedback.success();
    onClose();
  };

  const handleCancel = () => {
    setSpanishText('');
    setEnglishText('');
    setSpeaker(initialSpeaker);
    onClose();
  };

  const handleLookUp = async () => {
    if (!isNetworkAvailable) {
      Alert.alert('No Internet', 'Translation requires an internet connection.');
      return;
    }

    setIsTranslating(true);
    
    try {
      let result;
      
      // Determine translation direction based on which field has text
      if (spanishText.trim() && !englishText.trim()) {
        // Spanish to English
        result = await TranslationService.translateSpanishToEnglish(spanishText.trim());
        if (result.success && result.translatedText) {
          setEnglishText(result.translatedText);
        } else {
          Alert.alert('Translation Error', result.error || 'Failed to translate Spanish to English');
        }
      } else if (englishText.trim() && !spanishText.trim()) {
        // English to Spanish
        result = await TranslationService.translateEnglishToSpanish(englishText.trim());
        if (result.success && result.translatedText) {
          setSpanishText(result.translatedText);
        } else {
          Alert.alert('Translation Error', result.error || 'Failed to translate English to Spanish');
        }
      }
    } catch (error) {
      Alert.alert('Translation Error', 'An unexpected error occurred during translation.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Button state logic
  const canAddPhrase = spanishText.trim() && englishText.trim();
  const canLookUp = isNetworkAvailable && (
    (spanishText.trim() && !englishText.trim()) || 
    (!spanishText.trim() && englishText.trim())
  );

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 24,
      width: '90%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    fieldLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
      marginBottom: 16,
    },
    speakerContainer: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    speakerButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginHorizontal: 4,
      alignItems: 'center',
    },
    speakerButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    speakerButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    speakerButtonTextActive: {
      color: colors.background,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    button: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      marginHorizontal: 2,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    lookUpButton: {
      backgroundColor: colors.secondary || colors.primary,
    },
    addButton: {
      backgroundColor: colors.primary,
    },
    disabledButton: {
      backgroundColor: colors.border,
      opacity: 0.6,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.text,
    },
    lookUpButtonText: {
      color: colors.background,
    },
    addButtonText: {
      color: colors.background,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Phrase</Text>

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

          {showSpeakerSelection && (
            <>
              <Text style={styles.fieldLabel}>Speaker</Text>
              <View style={styles.speakerContainer}>
                <TouchableOpacity
                  style={[
                    styles.speakerButton,
                    speaker === 'friend1' && styles.speakerButtonActive
                  ]}
                  onPress={() => setSpeaker('friend1')}
                >
                  <Text style={[
                    styles.speakerButtonText,
                    speaker === 'friend1' && styles.speakerButtonTextActive
                  ]}>
                    Friend 1
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.speakerButton,
                    speaker === 'friend2' && styles.speakerButtonActive
                  ]}
                  onPress={() => setSpeaker('friend2')}
                >
                  <Text style={[
                    styles.speakerButtonText,
                    speaker === 'friend2' && styles.speakerButtonTextActive
                  ]}>
                    Friend 2
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.lookUpButton, !canLookUp && styles.disabledButton]}
              onPress={handleLookUp}
              disabled={!canLookUp || isTranslating}
            >
              {isTranslating ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={[styles.buttonText, styles.lookUpButtonText]}>Look Up</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.addButton, !canAddPhrase && styles.disabledButton]}
              onPress={handleAddPhrase}
              disabled={!canAddPhrase}
            >
              <Text style={[styles.buttonText, styles.addButtonText]}>Add Phrase</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddPhraseModal;
