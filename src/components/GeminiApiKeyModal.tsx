import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Linking,
    ActivityIndicator,
    Alert
} from 'react-native';
import { CommonModal } from './CommonModal';
import { useAppStore } from '../store/appStore';
import { useTheme } from '../contexts/ThemeContext';
import { GeminiService } from '../services/GeminiService';
import { RemoteConfigService } from '../services/RemoteConfigService';
import * as Haptics from 'expo-haptics';

interface GeminiApiKeyModalProps {
    visible: boolean;
    onClose: () => void;
}

export const GeminiApiKeyModal: React.FC<GeminiApiKeyModalProps> = ({ visible, onClose }) => {
    const { colors } = useTheme();
    const { preferences, setPreferences } = useAppStore();
    const [apiKey, setApiKey] = useState(preferences.customGeminiApiKey || '');
    const [isTesting, setIsTesting] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [activeKeySource, setActiveKeySource] = useState<'custom' | 'remote' | 'env' | 'none'>('none');

    useEffect(() => {
        if (visible) {
            setApiKey(preferences.customGeminiApiKey || '');
            determineActiveSource();
        }
    }, [visible, preferences.customGeminiApiKey]);

    const determineActiveSource = async () => {
        if (preferences.customGeminiApiKey?.trim()) {
            setActiveKeySource('custom');
            return;
        }

        await RemoteConfigService.ensureInitialized();
        const remoteKey = RemoteConfigService.getDefaultGeminiApiKey();
        if (remoteKey?.trim()) {
            setActiveKeySource('remote');
            return;
        }

        const envKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
        if (envKey?.trim()) {
            setActiveKeySource('env');
            return;
        }

        setActiveKeySource('none');
    };

    const handleSave = () => {
        setPreferences({ customGeminiApiKey: apiKey.trim() || undefined });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
    };

    const handleClear = () => {
        setApiKey('');
        setPreferences({ customGeminiApiKey: undefined });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert('Key Cleared', 'Reverting to default Sparks API key.');
    };

    const handleTestKey = async () => {
        if (!apiKey.trim()) {
            Alert.alert('Error', 'Please enter an API key to test.');
            return;
        }

        setIsTesting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            // A simple test prompt to validate the key
            // We use a separate fetch call here to test accurately without affecting the service state
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: 'Hello, are you working?' }] }]
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Success!', 'Your API key is valid and working correctly.');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                const errorMsg = data.error?.message || 'Invalid API key';
                Alert.alert('Validation Failed', `The API key is invalid: ${errorMsg}`);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        } catch (error: any) {
            Alert.alert('Error', `Failed to test key: ${error.message}`);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsTesting(false);
        }
    };

    const handleGetKey = () => {
        Linking.openURL('https://aistudio.google.com/app/apikey');
    };

    const getStatusText = () => {
        switch (activeKeySource) {
            case 'custom': return 'Using your custom API key';
            case 'remote': return 'Using default Sparks key (Remote Config)';
            case 'env': return 'Using default Sparks key (Internal)';
            default: return 'No API key configured';
        }
    };

    const styles = StyleSheet.create({
        container: {
            padding: 4,
        },
        statusContainer: {
            backgroundColor: colors.background + '80',
            padding: 12,
            borderRadius: 12,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
        },
        statusLabel: {
            fontSize: 12,
            color: colors.textSecondary,
            marginBottom: 4,
        },
        statusValue: {
            fontSize: 14,
            fontWeight: '600',
            color: activeKeySource === 'custom' ? colors.primary : colors.text,
        },
        inputContainer: {
            marginBottom: 20,
        },
        label: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 8,
        },
        inputWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 12,
        },
        input: {
            flex: 1,
            color: colors.text,
            fontSize: 14,
            paddingVertical: 12,
        },
        showButton: {
            padding: 8,
        },
        showButtonText: {
            color: colors.primary,
            fontSize: 12,
            fontWeight: '600',
        },
        helpText: {
            fontSize: 13,
            color: colors.textSecondary,
            lineHeight: 18,
            marginBottom: 20,
        },
        linkButton: {
            marginBottom: 24,
        },
        linkButtonText: {
            color: colors.primary,
            fontSize: 14,
            fontWeight: '600',
            textDecorationLine: 'underline',
        },
        buttonRow: {
            flexDirection: 'row',
            gap: 12,
            marginBottom: 12,
        },
        testButton: {
            flex: 1,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.primary,
            padding: 14,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
        },
        testButtonText: {
            color: colors.primary,
            fontWeight: '600',
            fontSize: 14,
        },
        saveButton: {
            flex: 2,
            backgroundColor: colors.primary,
            padding: 14,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
        },
        saveButtonText: {
            color: '#FFFFFF',
            fontWeight: '700',
            fontSize: 14,
        },
        clearButton: {
            padding: 14,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 8,
        },
        clearButtonText: {
            color: colors.error || '#FF3B30',
            fontSize: 14,
            fontWeight: '500',
        }
    });

    return (
        <CommonModal
            visible={visible}
            title="Gemini API Configuration"
            onClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.statusContainer}>
                    <Text style={styles.statusLabel}>Current Status</Text>
                    <Text style={styles.statusValue}>{getStatusText()}</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Custom API Key</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            value={apiKey}
                            onChangeText={setApiKey}
                            placeholder="Enter your Gemini API key"
                            placeholderTextColor={colors.textSecondary}
                            secureTextEntry={!showKey}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={styles.showButton}
                            onPress={() => setShowKey(!showKey)}
                        >
                            <Text style={styles.showButtonText}>{showKey ? 'Hide' : 'Show'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.helpText}>
                    Sparks uses Google's Gemini AI for recipe generation and schedule scanning.
                    Adding your own key avoids rate limits and ensures these features always work for you.
                </Text>

                <TouchableOpacity style={styles.linkButton} onPress={handleGetKey}>
                    <Text style={styles.linkButtonText}>Get your own free key at Google AI Studio →</Text>
                </TouchableOpacity>

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.testButton}
                        onPress={handleTestKey}
                        disabled={isTesting}
                    >
                        {isTesting ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Text style={styles.testButtonText}>Test Key</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save Configuration</Text>
                    </TouchableOpacity>
                </View>

                {preferences.customGeminiApiKey && (
                    <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                        <Text style={styles.clearButtonText}>Clear Custom Key</Text>
                    </TouchableOpacity>
                )}
            </View>
        </CommonModal>
    );
};
