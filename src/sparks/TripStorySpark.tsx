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
  Linking,
  Share,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
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
  startDate: string;
  time: string;
  description?: string;
  photos: TripPhoto[];
  location?: {
    address?: string;
    latitude?: number;
    longitude?: number;
  };
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
  const [showTripDetail, setShowTripDetail] = useState(false);
  const [showPhotoDetail, setShowPhotoDetail] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<TripPhoto | null>(null);
  const [showActivitySelector, setShowActivitySelector] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [mapLoadError, setMapLoadError] = useState(false);
  const [showEditActivity, setShowEditActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editActivityName, setEditActivityName] = useState('');
  const [editActivityTime, setEditActivityTime] = useState('');
  const [editActivityDescription, setEditActivityDescription] = useState('');
  const [editActivityLocation, setEditActivityLocation] = useState('');
  const [showEditTrip, setShowEditTrip] = useState(false);
  const [editTripTitle, setEditTripTitle] = useState('');
  const [editTripStartDate, setEditTripStartDate] = useState('');
  const [editTripEndDate, setEditTripEndDate] = useState('');
  const [editTripOrigin, setEditTripOrigin] = useState('');
  const [editTripDestination, setEditTripDestination] = useState('');

  // New trip form
  const [newTripTitle, setNewTripTitle] = useState('');
  const [newTripStartDate, setNewTripStartDate] = useState('');
  const [newTripEndDate, setNewTripEndDate] = useState('');
  const [newTripOrigin, setNewTripOrigin] = useState('');
  const [newTripDestination, setNewTripDestination] = useState('');

  // New activity form
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityDescription, setNewActivityDescription] = useState('');
  const [newActivityTime, setNewActivityTime] = useState('');

  // Photo detail form
  const [photoName, setPhotoName] = useState('');
  const [photoDate, setPhotoDate] = useState('');
  const [photoActivityId, setPhotoActivityId] = useState<string | null>(null);

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
      activities: [],
      photos: [],
      status: new Date(newTripStartDate + 'T00:00:00') > new Date() ? 'planned' : 
              new Date(newTripEndDate + 'T00:00:00') < new Date() ? 'completed' : 'active',
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
      startDate: selectedDate,
      time: newActivityTime || '12:00',
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
    setNewActivityTime('');
    setSelectedDate('');
    setShowAddActivity(false);
    
    HapticFeedback.success();
  };

  const capturePhoto = async (activity?: Activity) => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required', 
          'Please allow camera access in your device settings to take photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => ImagePicker.requestCameraPermissionsAsync() }
          ]
        );
        return;
      }

      // Check if camera is available
      const cameraAvailable = await ImagePicker.getCameraPermissionsAsync();
      if (!cameraAvailable.granted) {
        Alert.alert('Camera Not Available', 'Camera access is not available on this device.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
      });

      if (result.canceled) {
        setShowPhotoCapture(false);
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        Alert.alert('Error', 'No photo was captured. Please try again.');
        return;
      }

      if (result.assets[0]) {
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

        // Use activity's date if available, otherwise selectedDate, otherwise today
        const dateToUse = (activity?.startDate || selectedDate) || new Date().toISOString().split('T')[0];
        const photoDate = new Date(dateToUse + 'T12:00:00').toISOString();
        
        const newPhoto: TripPhoto = {
          id: Date.now().toString(),
          tripId: currentTrip!.id,
          activityId: (activity || selectedActivity)?.id,
          uri: asset.uri,
          timestamp: photoDate,
          location: location || undefined,
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
        const updatedTrip = updatedTrips.find(t => t.id === currentTrip!.id) || null;
        setCurrentTrip(updatedTrip);
        
        setShowPhotoCapture(false);
        setSelectedActivity(null);
        setSelectedDate('');
        HapticFeedback.success();
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      if (error instanceof Error && error.message && error.message.includes('simulator')) {
        Alert.alert(
          'Camera Not Available',
          'Camera functionality is not available in emulators. Please test on a physical device or use "Add" to select from gallery.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
      }
    }
  };

  const addFromGallery = async (activity?: Activity) => {
    console.log('📷 addFromGallery called with activity:', activity?.id, activity?.name);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
      });

      if (result.canceled) {
        setShowPhotoCapture(false);
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        Alert.alert('Error', 'No photo was selected. Please try again.');
        return;
      }

      if (result.assets[0]) {
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

        // Use activity's date if available, otherwise selectedDate, otherwise today
        const dateToUse = (activity?.startDate || selectedDate) || new Date().toISOString().split('T')[0];
        const photoDate = new Date(dateToUse + 'T12:00:00').toISOString();
        
        const newPhoto: TripPhoto = {
          id: Date.now().toString(),
          tripId: currentTrip!.id,
          activityId: (activity || selectedActivity)?.id,
          uri: asset.uri,
          timestamp: photoDate,
          location: location || undefined,
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

        console.log('Before save - currentTrip photos count:', currentTrip?.photos.length);
        console.log('New photo being added from gallery:', newPhoto);
        
        await saveTrips(updatedTrips);
        const updatedTrip = updatedTrips.find(t => t.id === currentTrip!.id) || null;
        setCurrentTrip(updatedTrip);
        
        console.log('After save - updatedTrip photos count:', updatedTrip?.photos.length);
        console.log('Updated trip photos:', updatedTrip?.photos.map(p => ({ id: p.id, activityId: p.activityId })));
        
        setShowPhotoCapture(false);
        setSelectedActivity(null);
        setSelectedDate('');
        HapticFeedback.success();
      }
    } catch (error) {
      console.error('Error adding photo from gallery:', error);
      Alert.alert('Error', 'Failed to add photo from gallery.');
    }
  };

  const handlePhotoPress = (photo: TripPhoto) => {
    setSelectedPhoto(photo);
    setPhotoName(photo.caption || '');
    setPhotoDate(new Date(photo.timestamp).toISOString().split('T')[0]);
    setPhotoActivityId(photo.activityId || null);
    setShowPhotoDetail(true);
  };

  const updatePhotoDetails = async () => {
    if (!selectedPhoto || !currentTrip) return;

    const updatedPhoto: TripPhoto = {
      ...selectedPhoto,
      caption: photoName,
      timestamp: new Date(photoDate + 'T00:00:00').toISOString(),
      activityId: photoActivityId || undefined,
    };

    const updatedTrips = trips.map(trip => 
      trip.id === currentTrip.id 
        ? { 
            ...trip, 
            photos: trip.photos.map(p => p.id === selectedPhoto.id ? updatedPhoto : p),
            updatedAt: new Date().toISOString() 
          }
        : trip
    );

    await saveTrips(updatedTrips);
    setCurrentTrip(updatedTrips.find(t => t.id === currentTrip.id) || null);
    setShowPhotoDetail(false);
    setSelectedPhoto(null);
    HapticFeedback.success();
  };

  const deletePhoto = async () => {
    if (!selectedPhoto || !currentTrip) return;

    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const updatedTrips = trips.map(trip => 
              trip.id === currentTrip.id 
                ? { 
                    ...trip, 
                    photos: trip.photos.filter(p => p.id !== selectedPhoto.id),
                    updatedAt: new Date().toISOString() 
                  }
                : trip
            );

            await saveTrips(updatedTrips);
            setCurrentTrip(updatedTrips.find(t => t.id === currentTrip.id) || null);
            setShowPhotoDetail(false);
            setSelectedPhoto(null);
            HapticFeedback.success();
          }
        }
      ]
    );
  };

  const openEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setEditActivityName(activity.name);
    setEditActivityTime(activity.time);
    setEditActivityDescription(activity.description || '');
    setEditActivityLocation(activity.location?.address || '');
    setShowEditActivity(true);
  };

  const updateActivity = async () => {
    if (!editingActivity || !currentTrip) return;

    const updatedActivity: Activity = {
      ...editingActivity,
      name: editActivityName,
      time: editActivityTime,
      description: editActivityDescription,
      location: editActivityLocation ? { address: editActivityLocation } : undefined,
    };

    const updatedTrips = trips.map(trip => 
      trip.id === currentTrip.id 
        ? { 
            ...trip, 
            activities: trip.activities.map(a => a.id === editingActivity.id ? updatedActivity : a),
            updatedAt: new Date().toISOString() 
          }
        : trip
    );

    await saveTrips(updatedTrips);
    setCurrentTrip(updatedTrips.find(t => t.id === currentTrip.id) || null);
    setShowEditActivity(false);
    setEditingActivity(null);
    HapticFeedback.success();
  };

  const deleteActivity = async () => {
    if (!editingActivity || !currentTrip) return;

    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity? This will also delete all associated photos. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const updatedTrips = trips.map(trip => 
              trip.id === currentTrip.id 
                ? { 
                    ...trip, 
                    activities: trip.activities.filter(a => a.id !== editingActivity.id),
                    photos: trip.photos.filter(p => p.activityId !== editingActivity.id),
                    updatedAt: new Date().toISOString() 
                  }
                : trip
            );

            await saveTrips(updatedTrips);
            setCurrentTrip(updatedTrips.find(t => t.id === currentTrip.id) || null);
            setShowEditActivity(false);
            setEditingActivity(null);
            HapticFeedback.success();
          }
        }
      ]
    );
  };

  const openEditTrip = () => {
    if (!currentTrip) return;
    setEditTripTitle(currentTrip.title);
    setEditTripStartDate(currentTrip.startDate);
    setEditTripEndDate(currentTrip.endDate);
    setEditTripOrigin(currentTrip.origin);
    setEditTripDestination(currentTrip.destination);
    setShowEditTrip(true);
  };

  const updateTrip = async () => {
    if (!currentTrip) return;

    const updatedTrip: Trip = {
      ...currentTrip,
      title: editTripTitle,
      startDate: editTripStartDate,
      endDate: editTripEndDate,
      origin: editTripOrigin,
      destination: editTripDestination,
      updatedAt: new Date().toISOString()
    };

    const updatedTrips = trips.map(trip => trip.id === currentTrip.id ? updatedTrip : trip);
    await saveTrips(updatedTrips);
    setCurrentTrip(updatedTrip);
    setShowEditTrip(false);
    HapticFeedback.success();
  };

  const deleteTrip = async () => {
    if (!currentTrip) return;

    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this trip? This will also delete all activities and photos. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const updatedTrips = trips.filter(trip => trip.id !== currentTrip.id);
            await saveTrips(updatedTrips);
            setCurrentTrip(null);
            setShowTripDetail(false);
            setShowEditTrip(false);
            HapticFeedback.success();
          }
        }
      ]
    );
  };

  const openInMaps = () => {
    if (!selectedPhoto?.location) return;
    
    const { latitude, longitude } = selectedPhoto.location;
    const url = `https://maps.google.com/maps?q=${latitude},${longitude}`;
    
    Linking.openURL(url).catch(err => {
      console.error('Error opening maps:', err);
      Alert.alert('Error', 'Could not open maps application');
    });
  };

  const selectActivityForPhoto = (activityId: string | null) => {
    setPhotoActivityId(activityId);
    setShowActivitySelector(false);
  };

  const generateTripStoryImage = async () => {
    if (!currentTrip) return;

    try {
      // Create a simple HTML template for the trip story
      const tripDates = getTripDates();
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
              color: #333;
            }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .dates { font-size: 16px; color: #666; }
            .day { margin-bottom: 30px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; }
            .day-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; }
            .activity { margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px; }
            .activity-name { font-weight: bold; margin-bottom: 5px; }
            .activity-time { color: #666; font-size: 14px; }
            .photos { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
            .photo { width: 100px; height: 100px; object-fit: cover; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${currentTrip.title || 'Untitled Trip'}</div>
            <div class="dates">${formatDate(currentTrip.startDate || '')} - ${formatDate(currentTrip.endDate || '')}</div>
          </div>
          ${tripDates.map((date, index) => {
            const dayActivities = currentTrip.activities.filter(activity => activity.startDate === date);
            const dayPhotos = currentTrip.photos.filter(photo => {
              const photoDate = new Date(photo.timestamp).toISOString().split('T')[0];
              return photoDate === date;
            });
            
            return `
              <div class="day">
                <div class="day-title">Day ${index + 1} - ${formatDate(date)}</div>
                ${dayActivities.map(activity => `
                  <div class="activity">
                    <div class="activity-name">${activity.name || 'Untitled Activity'}</div>
                    <div class="activity-time">${activity.time || 'No time specified'}</div>
                    ${activity.description ? `<div>${activity.description}</div>` : ''}
                    <div class="photos">
                      ${dayPhotos.filter(photo => photo.activityId === activity.id).map(photo => 
                        `<img src="${photo.uri || ''}" class="photo" alt="Trip photo" />`
                      ).join('')}
                    </div>
                  </div>
                `).join('')}
                ${dayPhotos.filter(photo => !photo.activityId).length > 0 ? `
                  <div class="activity">
                    <div class="activity-name">Day Photos</div>
                    <div class="photos">
                      ${dayPhotos.filter(photo => !photo.activityId).map(photo => 
                        `<img src="${photo.uri || ''}" class="photo" alt="Trip photo" />`
                      ).join('')}
                    </div>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Share the PDF
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share ${currentTrip.title} Trip Story`,
      });

      HapticFeedback.success();
    } catch (error) {
      console.error('Error generating trip story:', error);
      Alert.alert('Error', 'Failed to generate trip story. Please try again.');
    }
  };

  const shareTripAsImage = async () => {
    if (!currentTrip) return;

    try {
      // For now, we'll create a simple text-based share
      const tripDates = getTripDates();
      const tripSummary = `
🏖️ ${currentTrip.title || 'Untitled Trip'}
📅 ${formatDate(currentTrip.startDate || '')} - ${formatDate(currentTrip.endDate || '')}
📍 ${currentTrip.origin || 'Unknown'} → ${currentTrip.destination || 'Unknown'}

${tripDates.map((date, index) => {
  const dayActivities = currentTrip.activities.filter(activity => activity.startDate === date);
  const dayPhotos = currentTrip.photos.filter(photo => {
    const photoDate = new Date(photo.timestamp).toISOString().split('T')[0];
    return photoDate === date;
  });
  
  return `Day ${index + 1} - ${formatDate(date)}
${dayActivities.map(activity => `• ${activity.name} at ${activity.time}`).join('\n')}
📸 ${dayPhotos.length} photos`;
}).join('\n\n')}

Created with TripStory ✈️
      `;

      await Share.share({
        message: tripSummary,
        title: `Share ${currentTrip.title} Trip Story`,
      });

      HapticFeedback.success();
    } catch (error) {
      console.error('Error sharing trip:', error);
      Alert.alert('Error', 'Failed to share trip story. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Handle both YYYY-MM-DD and other formats
      const date = new Date(dateString + 'T00:00:00');
      if (isNaN(date.getTime())) {
        return dateString; // Return original if parsing fails
      }
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      return dateString; // Return original if parsing fails
    }
  };

  const getTripDates = () => {
    if (!currentTrip) return [];
    
    const startDate = new Date(currentTrip.startDate + 'T00:00:00');
    const endDate = new Date(currentTrip.endDate + 'T00:00:00');
    const dates = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const getTripStatus = (trip: Trip) => {
    const now = new Date();
    const startDate = new Date(trip.startDate + 'T00:00:00');
    const endDate = new Date(trip.endDate + 'T00:00:00');
    
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

  const getSortedTrips = () => {
    const now = new Date();
    const plannedTrips = trips.filter(trip => {
      const startDate = new Date(trip.startDate + 'T00:00:00');
      return startDate > now;
    }).sort((a, b) => {
      const dateA = new Date(a.startDate + 'T00:00:00');
      const dateB = new Date(b.startDate + 'T00:00:00');
      return dateA.getTime() - dateB.getTime(); // Next planned to furthest
    });

    const pastTrips = trips.filter(trip => {
      const endDate = new Date(trip.endDate + 'T00:00:00');
      return endDate <= now;
    }).sort((a, b) => {
      const dateA = new Date(a.endDate + 'T00:00:00');
      const dateB = new Date(b.endDate + 'T00:00:00');
      return dateB.getTime() - dateA.getTime(); // Most recent to oldest
    });

    return [...plannedTrips, ...pastTrips];
  };

  const renderTripCard = (trip: Trip) => {
    const status = getTripStatus(trip);
    const statusColor = getStatusColor(status);
    const statusText = getStatusText(status);

    return (
      <TouchableOpacity
        key={trip.id}
        style={[styles.tripCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => {
          setCurrentTrip(trip);
          setShowTripDetail(true);
        }}
      >
        <View style={styles.tripHeader}>
          <Text style={[styles.tripTitle, { color: colors.text }]}>{trip.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
        <Text style={[styles.tripDates, { color: colors.textSecondary }]}>
          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
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

  const renderAddActivityModal = () => (
    <Modal visible={showAddActivity} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Add Activity</Text>
          <TouchableOpacity onPress={() => setShowAddActivity(false)}>
            <Text style={[styles.modalClose, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Activity Name *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={newActivityName}
              onChangeText={setNewActivityName}
              placeholder="Enter activity name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Date *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScrollView}>
              {getTripDates().map(date => (
                <TouchableOpacity
                  key={date}
                  style={[
                    styles.dateOption,
                    { 
                      backgroundColor: selectedDate === date ? colors.primary : colors.surface,
                      borderColor: colors.border 
                    }
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[
                    styles.dateOptionText,
                    { color: selectedDate === date ? colors.background : colors.text }
                  ]}>
                    {formatDate(date)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Time</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={newActivityTime}
              onChangeText={setNewActivityTime}
              placeholder="HH:MM (e.g., 14:30)"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={newActivityDescription}
              onChangeText={setNewActivityDescription}
              placeholder="Enter activity description"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={addActivity}
          >
            <Text style={[styles.createButtonText, { color: colors.background }]}>Add Activity</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderPhotoCaptureModal = () => (
    <Modal visible={showPhotoCapture} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Add Photo</Text>
          <TouchableOpacity onPress={() => setShowPhotoCapture(false)}>
            <Text style={[styles.modalClose, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalContent}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Select Activity (Optional)</Text>
          <ScrollView style={styles.activityList}>
            <TouchableOpacity
              style={[
                styles.activityOption, 
                { 
                  backgroundColor: selectedActivity === null ? colors.primary : colors.surface, 
                  borderColor: colors.border 
                }
              ]}
              onPress={() => setSelectedActivity(null)}
            >
              <Text style={[
                styles.activityOptionText, 
                { color: selectedActivity === null ? colors.background : colors.text }
              ]}>No Activity</Text>
            </TouchableOpacity>
            {currentTrip?.activities.map(activity => (
              <TouchableOpacity
                key={activity.id}
                style={[
                  styles.activityOption, 
                  { 
                    backgroundColor: selectedActivity?.id === activity.id ? colors.primary : colors.surface, 
                    borderColor: colors.border 
                  }
                ]}
                onPress={() => setSelectedActivity(activity)}
              >
                <Text style={[
                  styles.activityOptionText, 
                  { color: selectedActivity?.id === activity.id ? colors.background : colors.text }
                ]}>{activity.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.modalFooter}>
          <View style={styles.photoButtonContainer}>
            <TouchableOpacity
              style={[styles.photoButton, { backgroundColor: colors.primary }]}
              onPress={() => capturePhoto()}
            >
              <Text style={[styles.photoButtonText, { color: colors.background }]}>📸 Snap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.photoButton, styles.addPhotoButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
              onPress={() => addFromGallery()}
            >
              <Text style={[styles.photoButtonText, { color: colors.primary }]}>📷 Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderPhotoDetailModal = () => {
    if (!selectedPhoto) return null;

    const associatedActivity = currentTrip?.activities.find(a => a.id === selectedPhoto.activityId);
    const photoDate = new Date(selectedPhoto.timestamp).toISOString().split('T')[0];

    return (
      <Modal visible={showPhotoDetail} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Photo Details</Text>
            <TouchableOpacity onPress={() => setShowPhotoDetail(false)}>
              <Text style={[styles.modalClose, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Photo Preview */}
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: selectedPhoto.uri }} style={styles.photoPreviewFullWidth} />
            </View>

            {/* Photo Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Photo Name</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={photoName}
                onChangeText={setPhotoName}
                placeholder="Enter photo name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Photo Date */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Date</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={photoDate}
                onChangeText={setPhotoDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
              />
            </View>


            {/* Location Info */}
            {selectedPhoto.location && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Location</Text>
                <TouchableOpacity 
                  style={[styles.locationContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={openInMaps}
                >
                  <Text style={[styles.locationText, { color: colors.text }]}>
                    📍 {selectedPhoto.location.latitude.toFixed(6)}, {selectedPhoto.location.longitude.toFixed(6)}
                  </Text>
                  <Text style={[styles.locationSubtext, { color: colors.textSecondary }]}>
                    Tap to open in maps
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Current Activity Info */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Currently Associated With</Text>
              <TouchableOpacity 
                style={[styles.currentActivityContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowActivitySelector(true)}
              >
                <Text style={[styles.currentActivityText, { color: colors.text }]}>
                  {associatedActivity ? associatedActivity.name : 'No Activity'}
                </Text>
                {associatedActivity && (
                  <Text style={[styles.currentActivitySubtext, { color: colors.textSecondary }]}>
                    {formatDate(associatedActivity.startDate)} at {associatedActivity.time}
                  </Text>
                )}
                <Text style={[styles.tapToChangeText, { color: colors.textSecondary }]}>
                  Tap to change
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: '#FF3B30' }]}
              onPress={deletePhoto}
            >
              <Text style={[styles.deleteButtonText, { color: 'white' }]}>🗑️ Delete Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={updatePhotoDetails}
            >
              <Text style={[styles.createButtonText, { color: colors.background }]}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderActivitySelectorModal = () => {
    return (
      <Modal visible={showActivitySelector} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Activity</Text>
            <TouchableOpacity onPress={() => setShowActivitySelector(false)}>
              <Text style={[styles.modalClose, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <TouchableOpacity
              style={[
                styles.activityOption,
                { 
                  backgroundColor: photoActivityId === null ? colors.primary : colors.surface,
                  borderColor: colors.border 
                }
              ]}
              onPress={() => selectActivityForPhoto(null)}
            >
              <Text style={[
                styles.activityOptionText,
                { color: photoActivityId === null ? colors.background : colors.text }
              ]}>
                No Activity
              </Text>
            </TouchableOpacity>
            {currentTrip?.activities.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={[
                  styles.activityOption,
                  { 
                    backgroundColor: photoActivityId === activity.id ? colors.primary : colors.surface,
                    borderColor: colors.border 
                  }
                ]}
                onPress={() => selectActivityForPhoto(activity.id)}
              >
                <Text style={[
                  styles.activityOptionText,
                  { color: photoActivityId === activity.id ? colors.background : colors.text }
                ]}>
                  {activity.name}
                </Text>
                <Text style={[
                  styles.activityOptionSubtext,
                  { color: photoActivityId === activity.id ? colors.background : colors.textSecondary }
                ]}>
                  {formatDate(activity.startDate)} at {activity.time}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderEditActivityModal = () => (
    <Modal visible={showEditActivity} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Activity</Text>
          <TouchableOpacity onPress={() => setShowEditActivity(false)}>
            <Text style={[styles.modalClose, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Activity Name *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={editActivityName}
              onChangeText={setEditActivityName}
              placeholder="Enter activity name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Time</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={editActivityTime}
              onChangeText={setEditActivityTime}
              placeholder="HH:MM (e.g., 14:30)"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={editActivityDescription}
              onChangeText={setEditActivityDescription}
              placeholder="Enter activity description"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Location (Optional)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={editActivityLocation}
              onChangeText={setEditActivityLocation}
              placeholder="Enter location address"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: '#FF3B30' }]}
            onPress={deleteActivity}
          >
            <Text style={[styles.deleteButtonText, { color: 'white' }]}>🗑️ Delete Activity</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={updateActivity}
          >
            <Text style={[styles.createButtonText, { color: colors.background }]}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderEditTripModal = () => (
    <Modal visible={showEditTrip} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Trip</Text>
          <TouchableOpacity onPress={() => setShowEditTrip(false)}>
            <Text style={[styles.modalClose, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Trip Title *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={editTripTitle}
              onChangeText={setEditTripTitle}
              placeholder="Enter trip title"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Start Date *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={editTripStartDate}
              onChangeText={setEditTripStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>End Date *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={editTripEndDate}
              onChangeText={setEditTripEndDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Origin</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={editTripOrigin}
              onChangeText={setEditTripOrigin}
              placeholder="Where are you traveling from?"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Destination</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              value={editTripDestination}
              onChangeText={setEditTripDestination}
              placeholder="Where are you traveling to?"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: '#FF3B30' }]}
            onPress={deleteTrip}
          >
            <Text style={[styles.deleteButtonText, { color: 'white' }]}>🗑️ Delete Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={updateTrip}
          >
            <Text style={[styles.createButtonText, { color: colors.background }]}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderMapViewModal = () => {
    if (!currentTrip) return null;

    // Get all activities with locations (either from activity location or inferred from photos)
    
    const activitiesWithLocations = currentTrip.activities.map(activity => {
      // First check if activity has explicit location
      if (activity.location?.latitude && activity.location?.longitude) {
        return {
          ...activity,
          latitude: activity.location.latitude,
          longitude: activity.location.longitude,
          hasPhoto: activity.photos.length > 0
        };
      }

      // If no explicit location, try to infer from photos
      const activityPhotos = currentTrip.photos.filter(photo => photo.activityId === activity.id);
      if (activityPhotos.length > 0 && activityPhotos[0].location) {
        return {
          ...activity,
          latitude: activityPhotos[0].location!.latitude,
          longitude: activityPhotos[0].location!.longitude,
          hasPhoto: true
        };
      }

      return null;
    }).filter((activity): activity is NonNullable<typeof activity> => activity !== null);

    // Generate OpenStreetMap tile URL
    const generateMapTileUrl = () => {
      if (activitiesWithLocations.length === 0) return null;
      
      // Calculate center point
      const avgLat = activitiesWithLocations.reduce((sum, a) => sum + a.latitude, 0) / activitiesWithLocations.length;
      const avgLng = activitiesWithLocations.reduce((sum, a) => sum + a.longitude, 0) / activitiesWithLocations.length;
      
      // Use zoom level 13 for good detail
      const zoom = 13;
      const tileX = Math.floor((avgLng + 180) / 360 * Math.pow(2, zoom));
      const tileY = Math.floor((1 - Math.log(Math.tan(avgLat * Math.PI / 180) + 1 / Math.cos(avgLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
      
      return `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;
    };

    // Calculate marker position on the map
    const calculateMarkerPosition = (lat: number, lng: number) => {
      if (activitiesWithLocations.length === 0) return { x: 0, y: 0 };
      
      // Calculate center point
      const avgLat = activitiesWithLocations.reduce((sum, a) => sum + a.latitude, 0) / activitiesWithLocations.length;
      const avgLng = activitiesWithLocations.reduce((sum, a) => sum + a.longitude, 0) / activitiesWithLocations.length;
      
      // Simple positioning relative to center (this is approximate)
      const latDiff = lat - avgLat;
      const lngDiff = lng - avgLng;
      
      // Map to screen coordinates (400x300 is our map size)
      const x = 200 + (lngDiff * 1000); // Scale factor for longitude
      const y = 150 - (latDiff * 1000); // Scale factor for latitude, inverted for screen coordinates
      
      return { x: Math.max(0, Math.min(400, x)), y: Math.max(0, Math.min(300, y)) };
    };

    return (
      <Modal visible={showMapView} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Trip Map</Text>
            <TouchableOpacity onPress={() => setShowMapView(false)}>
              <Text style={[styles.modalClose, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.mapContainer}>
              {activitiesWithLocations.length === 0 ? (
                <View style={[styles.mapImage, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: '#666', textAlign: 'center', fontSize: 16 }}>
                    📍 No location data available{'\n'}
                    Take photos with location enabled{'\n'}
                    or add manual locations to activities
                  </Text>
                </View>
              ) : (
                <View style={styles.mapImageContainer}>
                  {/* OpenStreetMap Background */}
                  {generateMapTileUrl() && (
                    <Image 
                      source={{ uri: generateMapTileUrl()! }} 
                      style={styles.mapBackground}
                      resizeMode="cover"
                    />
                  )}
                  
                  {/* Activity Markers with Photos */}
                  {activitiesWithLocations.map((activity, index) => {
                    const firstPhoto = currentTrip.photos.find(p => p.activityId === activity.id);
                    const markerPosition = calculateMarkerPosition(activity.latitude, activity.longitude);
                    
                    return (
                      <View 
                        key={activity.id} 
                        style={[
                          styles.mapMarker, 
                          { 
                            left: markerPosition.x, 
                            top: markerPosition.y 
                          }
                        ]}
                      >
                        {firstPhoto ? (
                          <TouchableOpacity
                            onPress={() => {
                              const url = `https://maps.apple.com/?q=${activity.latitude},${activity.longitude}`;
                              Linking.openURL(url).catch(err => {
                                console.error('Error opening maps:', err);
                                Alert.alert('Error', 'Could not open maps application');
                              });
                            }}
                          >
                            <Image 
                              source={{ uri: firstPhoto.uri }} 
                              style={styles.markerPhoto}
                            />
                            <View style={styles.markerLabel}>
                              <Text style={styles.markerText}>{activity.name}</Text>
                            </View>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={styles.markerDot}
                            onPress={() => {
                              const url = `https://maps.apple.com/?q=${activity.latitude},${activity.longitude}`;
                              Linking.openURL(url).catch(err => {
                                console.error('Error opening maps:', err);
                                Alert.alert('Error', 'Could not open maps application');
                              });
                            }}
                          >
                            <Text style={styles.markerDotText}>{index + 1}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
              
              <View style={styles.mapLegend}>
                <Text style={[styles.legendTitle, { color: colors.text }]}>Legend:</Text>
                <View style={styles.legendItem}>
                  <View style={[styles.legendMarker, { backgroundColor: '#007AFF', borderRadius: 15, width: 20, height: 20 }]} />
                  <Text style={[styles.legendText, { color: colors.text }]}>Activities with photos (shows first photo)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendMarker, { backgroundColor: '#007AFF', borderRadius: 15, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>1</Text>
                  </View>
                  <Text style={[styles.legendText, { color: colors.text }]}>Activities without photos (numbered)</Text>
                </View>
                <Text style={[styles.legendText, { color: colors.textSecondary, fontSize: 12, marginTop: 8 }]}>
                  Tap any marker to open in Maps
                </Text>
              </View>

              <View style={styles.mapActivityList}>
                <Text style={[styles.activityListTitle, { color: colors.text }]}>Activities on Map:</Text>
                {activitiesWithLocations.map((activity, index) => (
                  <View key={activity.id} style={[styles.activityListItem, { borderColor: colors.border }]}>
                    <View style={[styles.activityMarker, { backgroundColor: activity.hasPhoto ? 'red' : 'blue' }]} />
                    <Text style={[styles.mapActivityName, { color: colors.text }]}>{activity.name}</Text>
                    <Text style={[styles.mapActivityTime, { color: colors.textSecondary }]}>{activity.time}</Text>
                  </View>
                ))}
                {activitiesWithLocations.length === 0 && (
                  <Text style={[styles.noActivitiesText, { color: colors.textSecondary }]}>
                    No activities with location data found. Add photos with location or set activity locations manually.
                  </Text>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderTripDetailView = () => {
    if (!currentTrip) return null;

    const tripDates = getTripDates();
    
    return (
      <View style={[styles.tripDetailContainer, { backgroundColor: colors.background }]}>
        <View style={styles.tripDetailHeader}>
          <TouchableOpacity 
            style={styles.backButtonContainer}
            onPress={() => {
              setShowTripDetail(false);
              setCurrentTrip(null);
            }}
          >
            <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tripTitleContainer}>
          <View style={styles.tripTitleRow}>
            <Text style={[styles.tripDetailTitle, { color: colors.text }]}>{currentTrip.title}</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={openEditTrip}
            >
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.tripDetailContent}>
          {tripDates.map((date, index) => {
            const dayActivities = currentTrip.activities.filter(activity => activity.startDate === date);
            const dayPhotos = currentTrip.photos.filter(photo => {
              const photoDate = new Date(photo.timestamp).toISOString().split('T')[0];
              return photoDate === date;
            });

            return (
              <View key={date} style={[styles.dayContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.dayHeader}>
                  <Text style={[styles.dayTitle, { color: colors.text }]}>
                    Day {index + 1} - {formatDate(date)}
                  </Text>
                </View>

                {/* Day-level buttons */}
                <View style={[styles.dayButtons, { flexDirection: 'row', gap: 8 }]}>
                  <TouchableOpacity
                    style={[
                      styles.dayButton,
                      {
                        backgroundColor: 'white',
                        borderColor: colors.primary,
                        borderWidth: 1,
                        borderRadius: 9999, // pill shaped
                        height: 32, // make skinny
                        paddingVertical: 0, // reduce height
                        alignItems: 'center',
                        justifyContent: 'center',
                      }
                    ]}
                    onPress={() => {
                      setSelectedDate(date);
                      setShowAddActivity(true);
                    }}
                  >
                    <Text style={[styles.dayButtonText, { color: colors.primary, fontSize: 14 }]}>+ Activity</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.dayButton,
                      {
                        borderColor: colors.primary,
                        borderWidth: 1,
                        backgroundColor: 'transparent',
     
                        borderRadius: 9999, // pill shaped
                        
                        height: 32, // make skinny
                        paddingVertical: 0, // reduce height
                        alignItems: 'center',
                        justifyContent: 'center',
                      }
                    ]}
                    onPress={() => {
                      setSelectedDate(date);
                      setSelectedActivity(null);
                      setShowPhotoCapture(true);
                    }}
                  >
                    <Text style={[styles.dayButtonText, { color: colors.primary, fontSize: 14 }]}>+ Add Picture</Text>
                  </TouchableOpacity>
                </View>

                {/* Activities for this day */}
                {dayActivities.map((activity) => (
                  <View key={activity.id} style={[styles.activityContainer, { borderColor: colors.border }]}>
                    <View style={styles.activityHeader}>
                      <View style={styles.activityTitleContainer}>
                        <Text style={[styles.activityName, { color: colors.text }]}>{activity.name}</Text>
                        <TouchableOpacity 
                          style={styles.editButton}
                          onPress={() => openEditActivity(activity)}
                        >
                          <Text style={styles.editButtonText}>✏️</Text>
                        </TouchableOpacity>
                      </View>
                      {activity.time && (
                        <Text style={[styles.activityTime, { color: colors.textSecondary }]}>{activity.time}</Text>
                      )}
                    </View>
                    {activity.description && (
                      <Text style={[styles.activityDescription, { color: colors.textSecondary }]}>
                        {activity.description}
                      </Text>
                    )}
                    
                    {/* Activity photos */}
                    {dayPhotos.filter(photo => photo.activityId === activity.id).length > 0 && (
                      <View style={styles.activityPhotos}>
                        {dayPhotos
                          .filter(photo => photo.activityId === activity.id)
                          .map((photo) => (
                            <TouchableOpacity key={photo.id} onPress={() => handlePhotoPress(photo)}>
                              <Image source={{ uri: photo.uri }} style={styles.activityPhoto} />
                            </TouchableOpacity>
                          ))
                        }
                      </View>
                    )}

                    {/* Activity-level photo buttons */}
                    <View style={styles.activityPhotoButtons}>
                      <TouchableOpacity
                        style={[styles.snapButton, { backgroundColor: '#f5f5f5', borderColor: colors.primary }]}
                        onPress={() => {
                          console.log('📸 Snap button pressed for activity:', activity.id, activity.name);
                          setSelectedActivity(activity);
                          setSelectedDate(activity.startDate);
                          capturePhoto(activity);
                        }}
                      >
                        <Text style={[styles.snapButtonText, { color: colors.primary }]}>📸 Snap</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: '#f5f5f5', borderColor: colors.primary }]}
                        onPress={() => {
                          console.log('📷 Add button pressed for activity:', activity.id, activity.name);
                          setSelectedActivity(activity);
                          setSelectedDate(activity.startDate);
                          addFromGallery(activity);
                        }}
                      >
                        <Text style={[styles.addButtonText, { color: colors.primary }]}>📷 Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Day photos (not associated with activities) */}
                <View style={styles.dayPhotos}>
                  <Text style={[styles.dayPhotosTitle, { color: colors.text }]}>
                    Day Photos ({dayPhotos.filter(photo => !photo.activityId).length})
                  </Text>
                  <View style={styles.dayPhotosGrid}>
                    {dayPhotos
                      .filter(photo => !photo.activityId)
                      .map((photo) => (
                        <TouchableOpacity key={photo.id} onPress={() => handlePhotoPress(photo)}>
                          <Image source={{ uri: photo.uri }} style={styles.dayPhoto} />
                        </TouchableOpacity>
                      ))
                    }
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Share and Map View Buttons - Side by Side */}
        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity
            style={[styles.bottomButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              Alert.alert(
                'Share Trip Story',
                'Choose how you\'d like to share your trip:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: '📄 PDF', onPress: generateTripStoryImage },
                  { text: '📱 Text Summary', onPress: shareTripAsImage },
                ]
              );
            }}
          >
            <Text style={[styles.bottomButtonText, { color: colors.background }]}>
              📤 Share
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.bottomButton, { backgroundColor: colors.secondary }]}
            onPress={() => {
              setMapLoadError(false);
              setShowMapView(true);
            }}
          >
            <Text style={[styles.bottomButtonText, { color: colors.background }]}>
              🗺️ Map
            </Text>
          </TouchableOpacity>
        </View>

        {renderCreateTripModal()}
        {renderAddActivityModal()}
        {renderPhotoCaptureModal()}
        {renderPhotoDetailModal()}
        {renderActivitySelectorModal()}
        {renderMapViewModal()}
        {renderEditActivityModal()}
        {renderEditTripModal()}
      </View>
    );
  };

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


  if (showTripDetail) {
    return renderTripDetailView();
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
          getSortedTrips().map(renderTripCard)
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.createTripButton, { backgroundColor: colors.primary }]}
        onPress={() => setShowCreateTrip(true)}
      >
        <Text style={[styles.createTripButtonText, { color: colors.background }]}>+ Create New Trip</Text>
      </TouchableOpacity>

      {renderCreateTripModal()}
      {renderAddActivityModal()}
      {renderPhotoCaptureModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 44,
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
    paddingVertical: 40,
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
  backButtonContainer: {
    alignSelf: 'flex-start',
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  tripTitleContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tripTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  addButtonContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
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
  captureButtonContainer: {
    flexDirection: 'row',
    margin: 20,
    gap: 12,
  },
  captureButton: {
    flex: 1,
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
    minHeight: 48,
    textAlignVertical: 'center',
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
  deleteButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteButtonText: {
    fontSize: 16,
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
  activityList: {
    maxHeight: 200,
    marginTop: 8,
  },
  activityOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  activityOptionText: {
    fontSize: 16,
  },
  dateScrollView: {
    marginTop: 8,
  },
  dateOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  dateOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  photoButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addPhotoButton: {
    borderWidth: 2,
  },
  photoButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  // Trip Detail View Styles
  tripDetailContainer: {
    flex: 1,
  },
  tripDetailHeader: {
    padding: 0,
    paddingLeft: 32,
    paddingTop: 0,
    paddingBottom: 0,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tripDetailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  addActivityButton: {
    padding: 8,
  },
  addActivityButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tripDetailContent: {
    flex: 1,
    padding: 4,
  },
  dayContainer: {
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
  },
  dayHeader: {
    marginBottom: 6,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dayButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dayButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  activityContainer: {
    marginBottom: 4,
    padding: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  activityHeader: {
    marginBottom: 2,
  },
  activityTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  editButton: {
    padding: 4,
  },
  editButtonText: {
    fontSize: 16,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  activityTime: {
    fontSize: 14,
  },
  activityDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  activityPhotos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginBottom: 2,
  },
  activityPhoto: {
    width: (screenWidth - 40) / 3, // Account for padding and gaps
    aspectRatio: 1,
    borderRadius: 2,
  },
  activityPhotoButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  snapButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 9999, // pill shaped
    borderWidth: 1,
    alignItems: 'center',
  },
  snapButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 9999, // pill shaped
    borderWidth: 1,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addPictureButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 4,
  },
  addPictureButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayPhotos: {
    marginTop: 4,
  },
  dayPhotosTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayPhotosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  dayPhoto: {
    width: (screenWidth - 40) / 3, // Account for padding and gaps
    aspectRatio: 1,
    borderRadius: 2,
  },
  // Photo Detail Modal Styles
  photoPreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoPreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  photoPreviewFullWidth: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  locationContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  locationSubtext: {
    fontSize: 14,
  },
  currentActivityContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  currentActivityText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  currentActivitySubtext: {
    fontSize: 14,
  },
  tapToChangeText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  activityOptionSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  bottomButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  bottomButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  mapContainer: {
    alignItems: 'center',
    padding: 16,
  },
  mapImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  mapImageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  mapBackground: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  mapMarker: {
    position: 'absolute',
    zIndex: 10,
  },
  markerPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerLabel: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'center',
  },
  markerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  markerDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerDotText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  mapLegend: {
    width: '100%',
    marginBottom: 16,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
  },
  mapActivityList: {
    width: '100%',
  },
  activityListTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  activityListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  activityMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  mapActivityName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  mapActivityTime: {
    fontSize: 14,
  },
  noActivitiesText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default TripStorySpark;
