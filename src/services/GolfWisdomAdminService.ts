import { getFirestore, collection, getDocs, doc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import AuthService from './AuthService';
import { FirestoreWisdomPage } from './golfWisdomService';

const COLLECTION_NAME = 'golfWisdom';

// Firebase Config
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "sparkopedia-330f6.firebaseapp.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "sparkopedia-330f6",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "sparkopedia-330f6.firebasestorage.app",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "229332029977",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:229332029977:web:401c76f507f092c24a9088",
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-K5YN3D4VQ6"
};

export interface WisdomSuggestion extends FirestoreWisdomPage {
    id: string;
}

export class GolfWisdomAdminService {
    /**
     * Check if current user is admin for Golf Wisdom
     */
    static async isAdmin(): Promise<boolean> {
        try {
            return await AuthService.isSparkAdmin('golfWisdom');
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }

    /**
     * Get all pending suggestions (status: "Suggested")
     */
    static async getPendingSuggestions(): Promise<WisdomSuggestion[]> {
        try {
            const { initializeApp, getApps } = require('firebase/app');
            const { getFirestore } = require('firebase/firestore');
            const { getAuth } = require('firebase/auth');

            // Get or initialize Firebase app
            let app;
            if (getApps().length === 0) {
                app = initializeApp(firebaseConfig);
            } else {
                app = getApps()[0];
            }

            const auth = getAuth(app);
            if (!auth.currentUser) {
                throw new Error('User must be authenticated to fetch suggestions');
            }

            const db = getFirestore(app);
            const pagesCollection = collection(db, COLLECTION_NAME);
            
            // Query for documents with status "Suggested"
            const q = query(
                pagesCollection,
                where('status', '==', 'Suggested'),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const suggestions: WisdomSuggestion[] = [];

            querySnapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data() as FirestoreWisdomPage;
                suggestions.push({
                    ...data,
                    id: docSnapshot.id,
                });
            });

            console.log(`✅ Found ${suggestions.length} pending suggestions`);
            return suggestions;
        } catch (error) {
            console.error('❌ Error fetching pending suggestions:', error);
            throw error;
        }
    }

    /**
     * Approve a suggestion (change status to "Approved")
     */
    static async approveSuggestion(suggestionId: string): Promise<void> {
        try {
            const { initializeApp, getApps } = require('firebase/app');
            const { getFirestore } = require('firebase/firestore');
            const { getAuth } = require('firebase/auth');

            // Get or initialize Firebase app
            let app;
            if (getApps().length === 0) {
                app = initializeApp(firebaseConfig);
            } else {
                app = getApps()[0];
            }

            const auth = getAuth(app);
            if (!auth.currentUser) {
                throw new Error('User must be authenticated to approve suggestions');
            }

            const db = getFirestore(app);
            const suggestionRef = doc(db, COLLECTION_NAME, suggestionId);

            await updateDoc(suggestionRef, {
                status: 'Approved',
                updatedAt: Timestamp.now(),
            });

            console.log(`✅ Approved suggestion ${suggestionId}`);
        } catch (error) {
            console.error('❌ Error approving suggestion:', error);
            throw error;
        }
    }

    /**
     * Reject a suggestion (change status to "Rejected")
     */
    static async rejectSuggestion(suggestionId: string): Promise<void> {
        try {
            const { initializeApp, getApps } = require('firebase/app');
            const { getFirestore } = require('firebase/firestore');
            const { getAuth } = require('firebase/auth');

            // Get or initialize Firebase app
            let app;
            if (getApps().length === 0) {
                app = initializeApp(firebaseConfig);
            } else {
                app = getApps()[0];
            }

            const auth = getAuth(app);
            if (!auth.currentUser) {
                throw new Error('User must be authenticated to reject suggestions');
            }

            const db = getFirestore(app);
            const suggestionRef = doc(db, COLLECTION_NAME, suggestionId);

            await updateDoc(suggestionRef, {
                status: 'Rejected',
                updatedAt: Timestamp.now(),
            });

            console.log(`✅ Rejected suggestion ${suggestionId}`);
        } catch (error) {
            console.error('❌ Error rejecting suggestion:', error);
            throw error;
        }
    }
}
