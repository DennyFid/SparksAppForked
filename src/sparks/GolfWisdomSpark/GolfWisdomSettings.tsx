import React, { useState } from 'react';
import { Alert, Linking } from 'react-native';
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

interface GolfWisdomSettingsProps {
    onClose: () => void;
}

const CACHE_KEY = 'golfWisdom_cachedPages';
const TIMESTAMP_KEY = 'golfWisdom_lastUpdated';

export const GolfWisdomSettings: React.FC<GolfWisdomSettingsProps> = ({ onClose }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);

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

                {/* Refresh Section */}
                <SettingsSection title="Content Management">
                    <SettingsButton
                        title="Refresh Content"
                        onPress={handleRefresh}
                        variant="secondary"
                        disabled={isRefreshing}
                    />
                    <SettingsButton
                        title="Add Golf Wisdom"
                        onPress={() => {
                            Linking.openURL('https://console.firebase.google.com/project/sparkopedia-330f6/firestore/databases/-default-/data/~2FgolfWisdom~2FD2vro2RXLhdgX0qI80na').catch(err => {
                                console.error('Failed to open URL:', err);
                                Alert.alert('Error', 'Failed to open Firebase Console');
                            });
                        }}
                        variant="primary"
                    />
                </SettingsSection>

                {/* Cancel Button */}
                <SaveCancelButtons
                    onSave={() => { }} // No-op since there's nothing to save
                    onCancel={onClose}
                />
            </SettingsScrollView>
        </SettingsContainer>
    );
};
