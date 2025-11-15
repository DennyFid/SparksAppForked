// Quick script to reset Golf Brain data
// Run with: node reset_golf_brain.js

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function resetGolfBrain() {
  try {
    // Get the current storage
    const storageKey = 'sparks-data-storage';
    const data = await AsyncStorage.getItem(storageKey);
    
    if (data) {
      const parsed = JSON.parse(data);
      // Remove golf-brain data
      if (parsed.state && parsed.state.sparkData) {
        delete parsed.state.sparkData['golf-brain'];
        // Save back
        await AsyncStorage.setItem(storageKey, JSON.stringify(parsed));
        console.log('✅ Golf Brain data reset successfully!');
      } else {
        console.log('⚠️ No sparkData found in storage');
      }
    } else {
      console.log('⚠️ No storage data found');
    }
  } catch (error) {
    console.error('❌ Error resetting Golf Brain:', error);
  }
}

resetGolfBrain();
