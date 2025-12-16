import AsyncStorage from '@react-native-async-storage/async-storage';
import { GolfWisdomAdminService } from './GolfWisdomAdminService';

const STORAGE_KEY = 'golfWisdom_viewedSuggestions';
const SPARK_ID = 'golfWisdom';

export class GolfWisdomNotificationService {
    /**
     * Get unread suggestion count for admin users
     */
    static async getUnreadCount(): Promise<number> {
        try {
            // Only admins see notifications
            const isAdmin = await GolfWisdomAdminService.isAdmin();
            if (!isAdmin) {
                return 0;
            }

            // Get all pending suggestions
            const suggestions = await GolfWisdomAdminService.getPendingSuggestions();
            
            // Get viewed suggestion IDs from AsyncStorage
            const viewedIds = await this.getViewedSuggestionIds();
            
            // Count unread (suggestions not in viewed list)
            const unreadCount = suggestions.filter(s => !viewedIds.includes(s.id)).length;
            
            return unreadCount;
        } catch (error) {
            console.error('Error getting unread suggestion count:', error);
            return 0;
        }
    }

    /**
     * Mark suggestions as viewed (clear notifications)
     */
    static async markSuggestionsAsViewed(suggestionIds: string[]): Promise<void> {
        try {
            const viewedIds = await this.getViewedSuggestionIds();
            const updatedIds = [...new Set([...viewedIds, ...suggestionIds])];
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedIds));
        } catch (error) {
            console.error('Error marking suggestions as viewed:', error);
        }
    }

    /**
     * Get viewed suggestion IDs from AsyncStorage
     */
    private static async getViewedSuggestionIds(): Promise<string[]> {
        try {
            const viewed = await AsyncStorage.getItem(STORAGE_KEY);
            return viewed ? JSON.parse(viewed) : [];
        } catch (error) {
            console.error('Error getting viewed suggestion IDs:', error);
            return [];
        }
    }

    /**
     * Clear all viewed suggestions (for testing/debugging)
     */
    static async clearViewedSuggestions(): Promise<void> {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing viewed suggestions:', error);
        }
    }
}
