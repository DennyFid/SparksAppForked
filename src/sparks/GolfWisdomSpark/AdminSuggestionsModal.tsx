import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { CommonModal } from '../../components/CommonModal';
import { createCommonStyles } from '../../styles/CommonStyles';
import { GolfWisdomAdminService, WisdomSuggestion } from '../../services/GolfWisdomAdminService';
import { GolfWisdomNotificationService } from '../../services/GolfWisdomNotificationService';
import { HapticFeedback } from '../../utils/haptics';

interface AdminSuggestionsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const AdminSuggestionsModal: React.FC<AdminSuggestionsModalProps> = ({ visible, onClose }) => {
    const { colors } = useTheme();
    const commonStyles = createCommonStyles(colors);
    const [suggestions, setSuggestions] = useState<WisdomSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (visible) {
            loadSuggestions();
        }
    }, [visible]);

    const loadSuggestions = async () => {
        try {
            setIsLoading(true);
            const pending = await GolfWisdomAdminService.getPendingSuggestions();
            setSuggestions(pending);
            
            // Mark all suggestions as viewed when modal opens
            if (pending.length > 0) {
                const suggestionIds = pending.map(s => s.id);
                await GolfWisdomNotificationService.markSuggestionsAsViewed(suggestionIds);
            }
        } catch (error) {
            console.error('Error loading suggestions:', error);
            Alert.alert('Error', 'Failed to load suggestions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (suggestion: WisdomSuggestion) => {
        Alert.alert(
            'Approve Suggestion',
            `Approve this wisdom suggestion?\n\n"${suggestion.content.substring(0, 100)}${suggestion.content.length > 100 ? '...' : ''}"`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        try {
                            setProcessingIds(prev => new Set(prev).add(suggestion.id));
                            HapticFeedback.light();

                            await GolfWisdomAdminService.approveSuggestion(suggestion.id);
                            
                            // Remove from list immediately
                            setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
                            
                            HapticFeedback.success();
                            Alert.alert('Success', 'Suggestion approved and will appear in the wisdom list.');
                        } catch (error: any) {
                            console.error('Error approving suggestion:', error);
                            HapticFeedback.error();
                            Alert.alert('Error', error.message || 'Failed to approve suggestion');
                        } finally {
                            setProcessingIds(prev => {
                                const next = new Set(prev);
                                next.delete(suggestion.id);
                                return next;
                            });
                        }
                    },
                },
            ]
        );
    };

    const handleReject = async (suggestion: WisdomSuggestion) => {
        Alert.alert(
            'Reject Suggestion',
            `Reject this wisdom suggestion?\n\n"${suggestion.content.substring(0, 100)}${suggestion.content.length > 100 ? '...' : ''}"`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setProcessingIds(prev => new Set(prev).add(suggestion.id));
                            HapticFeedback.light();

                            await GolfWisdomAdminService.rejectSuggestion(suggestion.id);
                            
                            // Remove from list immediately
                            setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
                            
                            HapticFeedback.success();
                        } catch (error: any) {
                            console.error('Error rejecting suggestion:', error);
                            HapticFeedback.error();
                            Alert.alert('Error', error.message || 'Failed to reject suggestion');
                        } finally {
                            setProcessingIds(prev => {
                                const next = new Set(prev);
                                next.delete(suggestion.id);
                                return next;
                            });
                        }
                    },
                },
            ]
        );
    };

    const footer = (
        <TouchableOpacity
            style={commonStyles.secondaryButton}
            onPress={onClose}
        >
            <Text style={commonStyles.secondaryButtonText}>Close</Text>
        </TouchableOpacity>
    );

    return (
        <CommonModal
            visible={visible}
            title="Pending Wisdom Suggestions"
            onClose={onClose}
            footer={footer}
        >
            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Loading suggestions...
                    </Text>
                </View>
            ) : suggestions.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        No pending suggestions
                    </Text>
                </View>
            ) : (
                <ScrollView style={styles.suggestionsList}>
                    {suggestions.map((suggestion) => {
                        const isProcessing = processingIds.has(suggestion.id);
                        const createdAt = suggestion.createdAt?.toDate?.() || new Date();
                        
                        return (
                            <View key={suggestion.id} style={[styles.suggestionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <View style={styles.suggestionHeader}>
                                    <Text style={[styles.contributor, { color: colors.primary }]}>
                                        {suggestion.contributor || 'Anonymous'}
                                    </Text>
                                    <Text style={[styles.date, { color: colors.textSecondary }]}>
                                        {createdAt.toLocaleDateString()}
                                    </Text>
                                </View>
                                
                                <Text style={[styles.content, { color: colors.text }]}>
                                    {suggestion.content}
                                </Text>
                                
                                <View style={styles.actions}>
                                    <TouchableOpacity
                                        style={[commonStyles.secondaryButton, styles.rejectButton, isProcessing && { opacity: 0.5 }]}
                                        onPress={() => handleReject(suggestion)}
                                        disabled={isProcessing}
                                    >
                                        <Text style={[commonStyles.secondaryButtonText, { color: colors.error }]}>
                                            Reject
                                        </Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                        style={[commonStyles.primaryButton, styles.approveButton, isProcessing && { opacity: 0.5 }]}
                                        onPress={() => handleApprove(suggestion)}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <Text style={commonStyles.primaryButtonText}>Approve</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </CommonModal>
    );
};

const styles = StyleSheet.create({
    centerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
    suggestionsList: {
        maxHeight: 500,
    },
    suggestionCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    suggestionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    contributor: {
        fontSize: 14,
        fontWeight: '600',
    },
    date: {
        fontSize: 12,
    },
    content: {
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 12,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    rejectButton: {
        flex: 1,
    },
    approveButton: {
        flex: 1,
    },
});
