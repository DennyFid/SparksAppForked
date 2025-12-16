import React, { useState, useEffect } from 'react';
import { Alert, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    SettingsContainer,
    SettingsScrollView,
    SettingsHeader,
    SettingsFeedbackSection,
    SettingsSection,
    SettingsButton,
    SaveCancelButtons,
} from '../../components/SettingsComponents';
import { SuggestWisdomModal } from './SuggestWisdomModal';
import { AdminSuggestionsModal } from './AdminSuggestionsModal';
import { GolfWisdomAdminService } from '../../services/GolfWisdomAdminService';
import { GolfWisdomNotificationService } from '../../services/GolfWisdomNotificationService';
import { NotificationBadge } from '../../components/NotificationBadge';

interface GolfWisdomSettingsProps {
    onClose: () => void;
}

const CACHE_KEY = 'golfWisdom_cachedPages';
const TIMESTAMP_KEY = 'golfWisdom_lastUpdated';

export const GolfWisdomSettings: React.FC<GolfWisdomSettingsProps> = ({ onClose }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showSuggestModal, setShowSuggestModal] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        checkAdminStatus();
    }, []);

    useEffect(() => {
        if (isAdmin) {
            loadPendingCount();
            const interval = setInterval(loadPendingCount, 5000);
            return () => clearInterval(interval);
        }
    }, [isAdmin]);

    const checkAdminStatus = async () => {
        try {
            const admin = await GolfWisdomAdminService.isAdmin();
            setIsAdmin(admin);
        } catch (error) {
            console.error('Error checking admin status:', error);
        }
    };

    const loadPendingCount = async () => {
        try {
            const count = await GolfWisdomNotificationService.getUnreadCount();
            setPendingCount(count);
        } catch (error) {
            console.error('Error loading pending count:', error);
        }
    };

    const handleRefresh = async () => {
        try {
            setIsRefreshing(true);

            // Clear the cache
            await AsyncStorage.removeItem(CACHE_KEY);
            await AsyncStorage.removeItem(TIMESTAMP_KEY);

            Alert.alert(
                'Cache Cleared',
                'Golf Wisdom cache has been cleared. The app will fetch fresh content on next launch.',
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Error clearing cache:', error);
            Alert.alert('Error', 'Failed to clear cache. Please try again.');
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <SettingsContainer>
            <SettingsScrollView>
                <SettingsHeader
                    icon="📖"
                    title="Golf Wisdom Settings"
                    subtitle="Manage your golf wisdom experience"
                />

                {/* Feedback Section - Required First */}
                <SettingsFeedbackSection sparkId="golfWisdom" sparkName="Golf Wisdom" />

                {/* Admin Section */}
                {isAdmin && (
                    <SettingsSection title="Admin">
                        <View style={{ position: 'relative' }}>
                            <SettingsButton
                                title="Review Suggestions"
                                onPress={() => {
                                    setShowAdminModal(true);
                                    loadPendingCount(); // Refresh count when opening
                                }}
                                variant="primary"
                            />
                            {pendingCount > 0 && (
                                <View style={{ position: 'absolute', top: -4, right: -4 }}>
                                    <NotificationBadge sparkId="golfWisdom" size="small" />
                                </View>
                            )}
                        </View>
                        {pendingCount > 0 && (
                            <Text style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                                {pendingCount} pending suggestion{pendingCount !== 1 ? 's' : ''}
                            </Text>
                        )}
                    </SettingsSection>
                )}

                {/* Refresh Section */}
                <SettingsSection title="Content Management">
                    <SettingsButton
                        title="Refresh Content"
                        onPress={handleRefresh}
                        variant="secondary"
                        disabled={isRefreshing}
                    />
                    <SettingsButton
                        title="Suggest Wisdom"
                        onPress={() => setShowSuggestModal(true)}
                        variant="primary"
                    />
                </SettingsSection>

                {/* Cancel Button */}
                <SaveCancelButtons
                    onSave={() => { }} // No-op since there's nothing to save
                    onCancel={onClose}
                />
            </SettingsScrollView>

            {/* Suggest Wisdom Modal */}
            <SuggestWisdomModal
                visible={showSuggestModal}
                onClose={() => setShowSuggestModal(false)}
            />

            {/* Admin Suggestions Modal */}
            {isAdmin && (
                <AdminSuggestionsModal
                    visible={showAdminModal}
                    onClose={async () => {
                        setShowAdminModal(false);
                        await loadPendingCount(); // Refresh count when closing
                    }}
                />
            )}
        </SettingsContainer>
    );
};
