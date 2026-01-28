import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { HapticFeedback } from '../../utils/haptics';
import { Sparklet } from '../../types/sparklet';
import { SparkletService } from '../../services/SparkletService';
import {
    SettingsContainer,
    SettingsScrollView,
    SettingsHeader,
    SettingsSection,
    SettingsFeedbackSection,
    SettingsButton,
    SaveCancelButtons
} from '../../components/SettingsComponents';

interface SparkletEditorProps {
    sparklet: Sparklet;
    onSave: () => void;
    onCancel: () => void;
}

export const SparkletEditor: React.FC<SparkletEditorProps> = ({ sparklet, onSave, onCancel }) => {
    const { colors } = useTheme();

    // Format JSON for better readability if possible
    const initialDefinition = useMemo(() => {
        try {
            return JSON.stringify(JSON.parse(sparklet.definition || '{}'), null, 2);
        } catch (e) {
            return sparklet.definition || '';
        }
    }, [sparklet.definition]);

    const [definition, setDefinition] = useState(initialDefinition);
    const [refinement, setRefinement] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isRefining, setIsRefining] = useState(false);

    const handleSave = async () => {
        if (isSaving || isRefining) return;

        try {
            // Basic JSON validation
            JSON.parse(definition);
        } catch (e) {
            Alert.alert('Invalid JSON', 'Please ensure the definition is valid JSON.');
            return;
        }

        setIsSaving(true);
        HapticFeedback.success();
        try {
            await SparkletService.updateSparkletDefinition(sparklet.metadata.id, definition);
            onSave();
        } catch (error) {
            console.error('Failed to save sparklet:', error);
            Alert.alert('Save Failed', 'Unable to update sparklet definition.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRefine = async () => {
        if (!refinement.trim() || isRefining || isSaving) return;

        setIsRefining(true);
        HapticFeedback.medium();

        try {
            const vision = `CURRENT DEFINITION: ${definition}\n\nREFINEMENT INSTRUCTION: ${refinement}`;
            const newDefinition = await SparkletService.generateSparkletDefinition(vision);
            setDefinition(JSON.stringify(newDefinition, null, 2));
            setRefinement('');
            HapticFeedback.success();
        } catch (error) {
            console.error('Refinement failed:', error);
            Alert.alert('Refinement Failed', 'The Wizard was unable to weave your changes.');
        } finally {
            setIsRefining(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <SettingsContainer>
                <SettingsScrollView>
                    <SettingsHeader
                        title={`Edit ${sparklet.metadata.title}`}
                        subtitle="Modify logic, state, and UI"
                        icon={sparklet.metadata.icon || '♾️'}
                        sparkId="infinite"
                    />

                    <SettingsFeedbackSection sparkId="infinite" sparkName={sparklet.metadata.title} />

                    <SettingsSection title="🧠 AI Refinement">
                        <View style={[styles.refineBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <TextInput
                                style={[styles.refineInput, { color: colors.text }]}
                                placeholder="e.g., Change the grid to 4x4 or add a score tracker"
                                placeholderTextColor={colors.textSecondary}
                                value={refinement}
                                onChangeText={setRefinement}
                                multiline
                            />
                            <TouchableOpacity
                                style={[
                                    styles.refineButton,
                                    { backgroundColor: (refinement.trim() && !isRefining) ? colors.primary : colors.border }
                                ]}
                                onPress={handleRefine}
                                disabled={!refinement.trim() || isRefining}
                            >
                                {isRefining ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.refineButtonText}>Refine with AI ✨</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                        {isRefining && (
                            <View style={styles.pendingContainer}>
                                <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
                                <Text style={[styles.pendingText, { color: colors.primary }]}>
                                    🪄 Weaving new magic...
                                </Text>
                            </View>
                        )}
                    </SettingsSection>

                    <SettingsSection title="📜 Definition (JSON)">
                        <TextInput
                            style={[styles.codeEditor, {
                                backgroundColor: colors.surface,
                                color: colors.text,
                                borderColor: colors.border
                            }]}
                            value={definition}
                            onChangeText={setDefinition}
                            multiline
                            autoCapitalize="none"
                            autoCorrect={false}
                            spellCheck={false}
                        />
                    </SettingsSection>

                    <View style={styles.footerActions}>
                        <SaveCancelButtons
                            onSave={handleSave}
                            onCancel={onCancel}
                            saveText={isSaving ? "Saving..." : "Save Changes"}
                            saveDisabled={isSaving || isRefining}
                        />
                    </View>

                    <View style={styles.spacer} />
                </SettingsScrollView>
            </SettingsContainer>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    refineBox: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        marginBottom: 8,
    },
    refineInput: {
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 12,
    },
    refineButton: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    refineButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    pendingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    pendingText: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    codeEditor: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 12,
        minHeight: 300,
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        textAlignVertical: 'top',
    },
    footerActions: {
        marginTop: 10,
        marginBottom: 20,
    },
    spacer: {
        height: 40,
    }
});
