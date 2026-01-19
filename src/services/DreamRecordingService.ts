import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface RecordingResult {
  uri: string;
  duration: number; // in seconds
}

class DreamRecordingServiceClass {
  private recording: Audio.Recording | null = null;
  private recordingTimer: NodeJS.Timeout | null = null;
  private maxDuration: number = 120; // 120 seconds max

  /**
   * Setup audio mode for recording
   */
  private async setupAudioMode(isRecording: boolean) {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: isRecording,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Failed to setup audio mode:', error);
    }
  }

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }

  /**
   * Check if microphone permissions are granted
   */
  async hasPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      return false;
    }
  }

  /**
   * Start recording with optional duration limit
   */
  async startRecording(maxDurationSeconds: number = 120): Promise<void> {
    try {
      // Check permissions
      const hasPermissions = await this.hasPermissions();
      if (!hasPermissions) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Microphone permission denied');
        }
      }

      // Cleanup any existing recording
      if (this.recording) {
        try {
          await this.recording.stopAndUnloadAsync();
        } catch (error) {
          console.warn('Failed to cleanup existing recording:', error);
        }
        this.recording = null;
      }

      // Setup audio mode
      await this.setupAudioMode(true);

      // Add a small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // Configure recording options
      const recordingOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      // Create recording
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      this.recording = recording;
      this.maxDuration = maxDurationSeconds;

      // Setup auto-stop timer
      this.recordingTimer = setTimeout(() => {
        this.stopRecording();
      }, maxDurationSeconds * 1000);

    } catch (error: any) {
      console.error('Failed to start recording:', error);
      throw new Error(error.message || 'Failed to start recording');
    }
  }

  /**
   * Stop recording and return the result
   */
  async stopRecording(): Promise<RecordingResult | null> {
    try {
      // Clear timer
      if (this.recordingTimer) {
        clearTimeout(this.recordingTimer);
        this.recordingTimer = null;
      }

      if (!this.recording) {
        return null;
      }

      // Get status to determine duration
      const status = await this.recording.getStatusAsync();
      const duration = status.durationMillis ? status.durationMillis / 1000 : 0;

      // Stop and unload
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();

      // Reset recording
      const result: RecordingResult = {
        uri: uri || '',
        duration,
      };

      this.recording = null;

      return result;
    } catch (error: any) {
      console.error('Failed to stop recording:', error);
      throw new Error(error.message || 'Failed to stop recording');
    }
  }

  /**
   * Get current recording status
   */
  async getStatus(): Promise<{ isRecording: boolean; duration: number }> {
    if (!this.recording) {
      return { isRecording: false, duration: 0 };
    }

    try {
      const status = await this.recording.getStatusAsync();
      return {
        isRecording: status.isRecording || false,
        duration: status.durationMillis ? status.durationMillis / 1000 : 0,
      };
    } catch (error) {
      return { isRecording: false, duration: 0 };
    }
  }

  /**
   * Play back a recorded audio file
   */
  async playRecording(uri: string): Promise<Audio.Sound> {
    try {
      await this.setupAudioMode(false);

      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();

      return sound;
    } catch (error: any) {
      console.error('Failed to play recording:', error);
      throw new Error(error.message || 'Failed to play recording');
    }
  }

  /**
   * Delete a recording file
   */
  async deleteRecording(uri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
    } catch (error) {
      console.error('Failed to delete recording:', error);
      // Don't throw - file might already be deleted
    }
  }

  /**
   * Save recording to permanent storage
   */
  async saveRecordingToStorage(sourceUri: string, filename: string): Promise<string> {
    try {
      // Create dream-catcher directory
      const dreamDir = `${FileSystem.documentDirectory}dream-catcher/`;
      await FileSystem.makeDirectoryAsync(dreamDir, { intermediates: true });

      const newPath = `${dreamDir}${filename}`;

      // Copy file to permanent location
      await FileSystem.copyAsync({
        from: sourceUri,
        to: newPath,
      });

      // Verify file was copied
      const fileInfo = await FileSystem.getInfoAsync(newPath);
      if (!fileInfo.exists) {
        throw new Error('Failed to save recording to permanent storage');
      }

      return newPath;
    } catch (error: any) {
      console.error('Failed to save recording:', error);
      throw new Error(error.message || 'Failed to save recording');
    }
  }
}

export const DreamRecordingService = new DreamRecordingServiceClass();

