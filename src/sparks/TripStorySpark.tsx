import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../contexts/ThemeContext';
import { useSparkStore } from '../store';
import { HapticFeedback } from '../utils/haptics';

const { width } = Dimensions.get('window');

interface TripStorySparkProps {
  showSettings?: boolean;
  onCloseSettings?: () => void;
  onStateChange?: (state: any) => void;
  onComplete?: (result: any) => void;
}

interface Trip {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  origin: string;
  destination: string;
  lodging?: string;
  activities: Activity[];
  photos: TripPhoto[];
  status: 'planned' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

interface Activity {
  id: string;
  tripId: string;
  name: string;
  date: string;
  description?: string;
  photos: TripPhoto[];
  createdAt: string;
}

interface TripPhoto {
  id: string;
  tripId: string;
  activityId?: string;
  uri: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  caption?: string;
  createdAt: string;
}

interface Lodging {
  id: string;
  tripId: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
}

const TripStorySpark: React.FC<TripStorySparkProps> = ({
  showSettings = false,
  onCloseSettings,
  onStateChange,
  onComplete,
}) => {
  const { colors } = useTheme();
  const { getSparkData, setSparkData } = useSparkStore();
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // New trip form
  const [newTripTitle, setNewTripTitle] = useState('');
  const [newTripStartDate, setNewTripStartDate] = useState('');
  const [newTripEndDate, setNewTripEndDate] = useState('');
  const [newTripOrigin, setNewTripOrigin] = useState('');
  const [newTripDestination, setNewTripDestination] = useState('');
  const [newTripLodging, setNewTripLodging] = useState('');

  // New activity form
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityDescription, setNewActivityDescription] = useState('');

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        trips,
        currentTrip,
        selectedDate,
        selectedActivity
      });
    }
  }, [trips, currentTrip, selectedDate, selectedActivity, onStateChange]);

  const loadTrips = async () => {
    try {
      const data = await getSparkData('trip-story');
      if (data?.trips) {
        setTrips(data.trips);
      }
    } catch (error) {
      console.error('Error loading trips:', error);
    }
  };

  const saveTrips = async (updatedTrips: Trip[]) => {
    try {
      await setSparkData('trip-story', { trips: updatedTrips });
      setTrips(updatedTrips);
    } catch (error) {
      console.error('Error saving trips:', error);
    }
  };

  const createTrip = async () => {
    if (!newTripTitle || !newTripStartDate || !newTripEndDate || !newTripOrigin || !newTripDestination) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    const newTrip: Trip = {
      id: Date.now().toString(),
      title: newTripTitle,
      startDate: newTripStartDate,
      endDate: newTripEndDate,
      origin: newTripOrigin,
      destination: newTripDestination,
      lodging: newTripLodging || undefined,
      activities: [],
      photos: [],
      status: new Date(newTripStartDate) > new Date() ? 'planned' : 
              new Date(newTripEndDate) < new Date() ? 'completed' : 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTrips = [...trips, newTrip];
    await saveTrips(updatedTrips);
    
    // Reset form
    setNewTripTitle('');
    setNewTripStartDate('');
    setNewTripEndDate('');
    setNewTripOrigin('');
    setNewTripDestination('');
    setNewTripLodging('');
    setShowCreateTrip(false);
    
    HapticFeedback.success();
  };

  const addActivity = async () => {
    if (!currentTrip || !newActivityName || !selectedDate) {
      Alert.alert('Missing Information', 'Please select a trip, date, and enter activity name.');
      return;
    }

    const newActivity: Activity = {
      id: Date.now().toString(),
      tripId: currentTrip.id,
      name: newActivityName,
      date: selectedDate,
      description: newActivityDescription || undefined,
      photos: [],
      createdAt: new Date().toISOString(),
    };

    const updatedTrips = trips.map(trip => 
      trip.id === currentTrip.id 
        ? { ...trip, activities: [...trip.activities, newActivity], updatedAt: new Date().toISOString() }
        : trip
    );

    await saveTrips(updatedTrips);
    setCurrentTrip(updatedTrips.find(t => t.id === currentTrip.id) || null);
    
    // Reset form
    setNewActivityName('');
    setNewActivityDescription('');
    setShowAddActivity(false);
    
    HapticFeedback.success();
  };

  const capturePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Get location
        let location = null;
        try {
          const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
          if (locationStatus === 'granted') {
            const locationData = await Location.getCurrentPositionAsync({});
            location = {
              latitude: locationData.coords.latitude,
              longitude: locationData.coords.longitude,
            };
          }
        } catch (error) {
          console.log('Location not available:', error);
        }

        const newPhoto: TripPhoto = {
          id: Date.now().toString(),
          tripId: currentTrip!.id,
          activityId: selectedActivity?.id,
          uri: asset.uri,
          timestamp: new Date().toISOString(),
          location,
          caption: '',
          createdAt: new Date().toISOString(),
        };

        const updatedTrips = trips.map(trip => 
          trip.id === currentTrip!.id 
            ? { 
                ...trip, 
                photos: [...trip.photos, newPhoto], 
                updatedAt: new Date().toISOString() 
              }
            : trip
        );

        await saveTrips(updatedTrips);
        setCurrentTrip(updatedTrips.find(t => t.id === currentTrip!.id) || null);
        
        setShowPhotoCapture(false);
        HapticFeedback.success();
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo.');
    }
  };

  const getTripStatus = (trip: Trip) => {
    const now = new Date();
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    
    if (now < startDate) return 'planned';
    if (now > endDate) return 'completed';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return '#FFA500';
      case 'active': return '#00FF00';
      case 'completed': return '#808080';
      default: return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned': return 'Planned';
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const renderTripCard = (trip: Trip) => {
    const status = getTripStatus(trip);
    const statusColor = getStatusColor(status);
    const statusText = getStatusText(status);

    return (
      <TouchableOpacity
        key={trip.id}
        style={[styles.tripCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setCurrentTrip(trip)}
      >
        <View style={styles.tripHeader}>
          <Text style={[styles.tripTitle, { color: colors.text }]}>{trip.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
        <Text style={[styles.tripDates, { color: colors.textSecondary }]}>
          {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
        </Text>
        <Text style={[styles.tripRoute, { color: colors.textSecondary }]}>
          {trip.origin} → {trip.destination}
        </Text>
        <Text style={[styles.photoCount, { color: colors.textSecondary }]}>
          {trip.photos.length} photos • {trip.activities.length} activities
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCreateTripModal = () => (
    <Modal visible={showCreateTrip} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Trip</Text>
          <TouchableOpacity onPress={() => setShowCreateTrip(false)}>
            <Text style={[styles.modalClose, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Trip Title *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={newTripTitle}
              onChangeText={setNewTripTitle}
              placeholder="Enter trip title"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Start Date *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={newTripStartDate}
                onChangeText={setNewTripStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>End Date *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={newTripEndDate}
                onChangeText={setNewTripEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Origin *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={newTripOrigin}
                onChangeText={setNewTripOrigin}
                placeholder="From where?"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Destination *</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={newTripDestination}
                onChangeText={setNewTripDestination}
                placeholder="To where?"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Lodging (Optional)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={newTripLodging}
              onChangeText={setNewTripLodging}
              placeholder="Hotel, Airbnb, etc."
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={createTrip}
          >
            <Text style={[styles.createButtonText, { color: colors.background }]}>Create Trip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (showSettings) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>📸✈️ TripStory Settings</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Manage your trip documentation preferences
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.primary }]}
          onPress={onCloseSettings}
        >
          <Text style={[styles.closeButtonText, { color: colors.background }]}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (currentTrip) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.tripHeader}>
          <TouchableOpacity onPress={() => setCurrentTrip(null)}>
            <Text style={[styles.backButton, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.tripTitle, { color: colors.text }]}>{currentTrip.title}</Text>
          <TouchableOpacity onPress={() => setShowAddActivity(true)}>
            <Text style={[styles.addButton, { color: colors.primary }]}>+ Activity</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.tripContent}>
          {/* Trip photos and activities will be rendered here */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Trip Photos</Text>
          <View style={styles.photoGrid}>
            {currentTrip.photos.map(photo => (
              <Image key={photo.id} source={{ uri: photo.uri }} style={styles.photoThumbnail} />
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.captureButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowPhotoCapture(true)}
        >
          <Text style={[styles.captureButtonText, { color: colors.background }]}>📸 Capture Photo</Text>
        </TouchableOpacity>

        {renderCreateTripModal()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>📸✈️ TripStory</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Capture and share your trip
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {trips.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No trips yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Create your first trip to start documenting your journey
            </Text>
          </View>
        ) : (
          trips.map(renderTripCard)
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.createTripButton, { backgroundColor: colors.primary }]}
        onPress={() => setShowCreateTrip(true)}
      >
        <Text style={[styles.createTripButtonText, { color: colors.background }]}>+ Create New Trip</Text>
      </TouchableOpacity>

      {renderCreateTripModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tripCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  tripDates: {
    fontSize: 14,
    marginBottom: 4,
  },
  tripRoute: {
    fontSize: 14,
    marginBottom: 4,
  },
  photoCount: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  createTripButton: {
    margin: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createTripButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  tripContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 20,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoThumbnail: {
    width: (width - 60) / 3,
    height: (width - 60) / 3,
    borderRadius: 8,
  },
  captureButton: {
    margin: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  captureButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  createButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    margin: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default TripStorySpark;
