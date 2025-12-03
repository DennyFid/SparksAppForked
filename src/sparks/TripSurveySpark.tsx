import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Share,
  Clipboard,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useSparkStore } from '../store';
import { HapticFeedback } from '../utils/haptics';
import {
  SettingsContainer,
  SettingsScrollView,
  SettingsHeader,
  SettingsFeedbackSection,
} from '../components/SettingsComponents';

interface TripSurveySparkProps {
  showSettings?: boolean;
  onCloseSettings?: () => void;
  onStateChange?: (state: any) => void;
  onComplete?: (result: any) => void;
}

interface DateRange {
  id: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

interface Package {
  id: string;
  name: string;
  price: number;
  days: number;
}

interface Trip {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isFinalized: boolean;
  possibleDates: DateRange[];
  blackoutDates: string[];
  locations: string[];
  packages: Package[];
  people: string[];
  finalStartDate?: string;
  finalEndDate?: string;
  finalLocations?: string[];
  finalPackages?: string[];
  finalPeople?: string[];
}

interface ParsedAnswer {
  optionType: 'date' | 'location' | 'package';
  optionId: string;
  answer: string; // "yes", "no", "maybe"
}

interface TripResponse {
  id: string;
  tripId: string;
  participantName: string;
  rawText: string;
  parsedAnswers: ParsedAnswer[];
  blackoutDatesText?: string;
  receivedAt: string;
}

type ViewMode = 'list' | 'details' | 'matrix' | 'share';

export const TripSurveySpark: React.FC<TripSurveySparkProps> = ({
  showSettings = false,
  onCloseSettings,
}) => {
  const { colors } = useTheme();
  const { getSparkData, setSparkData } = useSparkStore();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [responses, setResponses] = useState<TripResponse[]>([]);

  // Modal states
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [showAddResponseModal, setShowAddResponseModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');

  // Form states
  const [newTripName, setNewTripName] = useState('');
  const [responseParticipant, setResponseParticipant] = useState('');
  const [responseText, setResponseText] = useState('');

  // Finalize form states
  const [finalStartDate, setFinalStartDate] = useState('');
  const [finalEndDate, setFinalEndDate] = useState('');
  const [selectedFinalLocations, setSelectedFinalLocations] = useState<string[]>([]);
  const [selectedFinalPackages, setSelectedFinalPackages] = useState<string[]>([]);
  const [selectedFinalPeople, setSelectedFinalPeople] = useState<string[]>([]);

  // Load trips and responses
  useEffect(() => {
    loadTrips();
    loadResponses();
  }, []);

  const loadTrips = () => {
    const data = getSparkData('trip-survey');
    if (data?.trips) {
      // Migrate blackout dates from DateRange[] to string[] if needed
      const migratedTrips = data.trips.map((trip: any) => {
        if (trip.blackoutDates && Array.isArray(trip.blackoutDates) && trip.blackoutDates.length > 0) {
          // Check if first item is a DateRange object (has id, startDate, endDate)
          const firstItem = trip.blackoutDates[0];
          if (firstItem && typeof firstItem === 'object' && firstItem.startDate && firstItem.endDate) {
            // Migrate from DateRange[] to string[]
            return {
              ...trip,
              blackoutDates: trip.blackoutDates.map((dr: DateRange) => formatDateRange(dr)),
            };
          }
        }
        return trip;
      });
      setTrips(migratedTrips);
    }
  };

  const loadResponses = () => {
    const data = getSparkData('trip-survey');
    if (data?.responses) {
      setResponses(data.responses);
    }
  };

  const saveTrips = (updatedTrips: Trip[]) => {
    setTrips(updatedTrips);
    const data = getSparkData('trip-survey');
    setSparkData('trip-survey', { ...data, trips: updatedTrips });
  };

  const saveResponses = (updatedResponses: TripResponse[]) => {
    setResponses(updatedResponses);
    const data = getSparkData('trip-survey');
    setSparkData('trip-survey', { ...data, responses: updatedResponses });
  };

  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  // Get local date string in YYYY-MM-DD format
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get local ISO string (for timestamps)
  const getLocalISOString = (): string => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localTime = new Date(now.getTime() - (offset * 60 * 1000));
    return localTime.toISOString();
  };

  // Parse YYYY-MM-DD as local date (not UTC)
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDate = (dateString: string): string => {
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateRange = (dateRange: DateRange): string => {
    return `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`;
  };

  // Create new trip
  const handleCreateTrip = () => {
    if (!newTripName.trim()) {
      Alert.alert('Error', 'Please enter a trip name');
      return;
    }

    const newTrip: Trip = {
      id: generateId(),
      name: newTripName.trim(),
      createdAt: getLocalISOString(),
      updatedAt: getLocalISOString(),
      isFinalized: false,
      possibleDates: [],
      blackoutDates: [],
      locations: [],
      packages: [],
      people: [],
    };

    const updatedTrips = [...trips, newTrip];
    saveTrips(updatedTrips);
    setNewTripName('');
    setShowCreateTripModal(false);
    HapticFeedback.success();
  };

  // Navigate to trip details
  const handleSelectTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setCurrentView('details');
    HapticFeedback.light();
  };

  // Add possible date
  const handleAddPossibleDate = (trip: Trip) => {
    setDateRangeStart('');
    setDateRangeEnd('');
    setShowDateRangeModal(true);
    HapticFeedback.light();
  };

  // Add blackout date
  const handleAddBlackoutDate = (trip: Trip) => {
    Alert.prompt(
      'Add Blackout Date',
      'Enter blackout date text (e.g., "Out for August" or "July 2, 2025 to Jul 5, 2025"):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (text?: string) => {
            if (text?.trim()) {
              const updatedTrip = {
                ...trip,
                blackoutDates: [...trip.blackoutDates, text.trim()],
                updatedAt: getLocalISOString(),
              };
              const updatedTrips = trips.map((t) => (t.id === trip.id ? updatedTrip : t));
              saveTrips(updatedTrips);
              setSelectedTrip(updatedTrip);
              HapticFeedback.success();
            }
          },
        },
      ],
      'plain-text',
      ''
    );
  };

  // Save date range (only for possible dates now)
  const handleSaveDateRange = () => {
    if (!selectedTrip) return;

    if (!dateRangeStart.trim() || !dateRangeEnd.trim()) {
      Alert.alert('Error', 'Please enter both start and end dates');
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateRangeStart) || !dateRegex.test(dateRangeEnd)) {
      Alert.alert('Error', 'Please enter dates in YYYY-MM-DD format');
      return;
    }

    // Validate that start is before end (using local dates)
    const start = parseLocalDate(dateRangeStart);
    const end = parseLocalDate(dateRangeEnd);
    if (start > end) {
      Alert.alert('Error', 'Start date must be before end date');
      return;
    }

    const newDateRange: DateRange = {
      id: generateId(),
      startDate: dateRangeStart,
      endDate: dateRangeEnd,
    };

    const updatedTrip = {
      ...selectedTrip,
      possibleDates: [...selectedTrip.possibleDates, newDateRange],
      updatedAt: getLocalISOString(),
    };

    const updatedTrips = trips.map((t) => (t.id === selectedTrip.id ? updatedTrip : t));
    saveTrips(updatedTrips);
    setSelectedTrip(updatedTrip);
    setShowDateRangeModal(false);
    setDateRangeStart('');
    setDateRangeEnd('');
    HapticFeedback.success();
  };

  // Add location
  const handleAddLocation = (trip: Trip) => {
    Alert.prompt(
      'Add Location',
      'Enter location name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (location?: string) => {
            if (location?.trim()) {
              const updatedTrip = {
                ...trip,
                locations: [...trip.locations, location.trim()],
                updatedAt: getLocalISOString(),
              };
              const updatedTrips = trips.map((t) => (t.id === trip.id ? updatedTrip : t));
              saveTrips(updatedTrips);
              setSelectedTrip(updatedTrip);
              HapticFeedback.success();
            }
          },
        },
      ],
      'plain-text',
      ''
    );
  };

  // Helper function to clean and parse price
  const parsePrice = (priceStr: string): number => {
    if (!priceStr) return 0;
    // Remove $, commas, and any non-numeric characters except decimal point
    const cleaned = priceStr.replace(/[$,]/g, '').trim();
    // Parse as float and round to 2 decimal places (remove cents)
    const price = parseFloat(cleaned);
    return isNaN(price) ? 0 : Math.round(price);
  };

  // Add package
  const handleAddPackage = (trip: Trip) => {
    Alert.prompt(
      'Add Package',
      'Enter package name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Next',
          onPress: (name?: string) => {
            if (name?.trim()) {
              Alert.prompt(
                'Add Package',
                'Enter price (e.g., 1200 or $1,200):',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Next',
                    onPress: (priceStr?: string) => {
                      const price = parsePrice(priceStr || '0');
                      if (price > 0) {
                        Alert.prompt(
                          'Add Package',
                          'Enter number of days:',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Add',
                              onPress: (daysStr?: string) => {
                                const days = parseInt(daysStr || '0', 10);
                                if (!isNaN(days) && days > 0) {
                                  const newPackage: Package = {
                                    id: generateId(),
                                    name: name.trim(),
                                    price: price,
                                    days: days,
                                  };
                                  const updatedTrip = {
                                    ...trip,
                                    packages: [...trip.packages, newPackage],
                                    updatedAt: getLocalISOString(),
                                  };
                                  const updatedTrips = trips.map((t) => (t.id === trip.id ? updatedTrip : t));
                                  saveTrips(updatedTrips);
                                  setSelectedTrip(updatedTrip);
                                  HapticFeedback.success();
                                } else {
                                  Alert.alert('Error', 'Please enter a valid number of days');
                                }
                              },
                            },
                          ],
                          'plain-text',
                          ''
                        );
                      } else {
                        Alert.alert('Error', 'Please enter a valid price');
                      }
                    },
                  },
                ],
                'plain-text',
                ''
              );
            }
          },
        },
      ],
      'plain-text',
      ''
    );
  };

  // Add person
  const handleAddPerson = (trip: Trip) => {
    Alert.prompt(
      'Add Person',
      'Enter person name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (name?: string) => {
            if (name?.trim()) {
              const updatedTrip = {
                ...trip,
                people: [...trip.people, name.trim()],
                updatedAt: getLocalISOString(),
              };
              const updatedTrips = trips.map((t) => (t.id === trip.id ? updatedTrip : t));
              saveTrips(updatedTrips);
              setSelectedTrip(updatedTrip);
              HapticFeedback.success();
            }
          },
        },
      ],
      'plain-text',
      ''
    );
  };

  // Delete possible date
  const handleDeletePossibleDate = (trip: Trip, dateRangeId: string) => {
    Alert.alert(
      'Delete Date Range',
      'Are you sure you want to delete this date range?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedTrip = {
              ...trip,
              possibleDates: trip.possibleDates.filter((dr) => dr.id !== dateRangeId),
              updatedAt: getLocalISOString(),
            };
            const updatedTrips = trips.map((t) => (t.id === trip.id ? updatedTrip : t));
            saveTrips(updatedTrips);
            setSelectedTrip(updatedTrip);
            HapticFeedback.success();
          },
        },
      ]
    );
  };

  // Delete blackout date
  const handleDeleteBlackoutDate = (trip: Trip, blackoutIndex: number) => {
    Alert.alert(
      'Delete Blackout Date',
      'Are you sure you want to delete this blackout date?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedTrip = {
              ...trip,
              blackoutDates: trip.blackoutDates.filter((_, idx) => idx !== blackoutIndex),
              updatedAt: getLocalISOString(),
            };
            const updatedTrips = trips.map((t) => (t.id === trip.id ? updatedTrip : t));
            saveTrips(updatedTrips);
            setSelectedTrip(updatedTrip);
            HapticFeedback.success();
          },
        },
      ]
    );
  };

  // Delete location
  const handleDeleteLocation = (trip: Trip, locationIndex: number) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedTrip = {
              ...trip,
              locations: trip.locations.filter((_, idx) => idx !== locationIndex),
              updatedAt: getLocalISOString(),
            };
            const updatedTrips = trips.map((t) => (t.id === trip.id ? updatedTrip : t));
            saveTrips(updatedTrips);
            setSelectedTrip(updatedTrip);
            HapticFeedback.success();
          },
        },
      ]
    );
  };

  // Delete package
  const handleDeletePackage = (trip: Trip, packageId: string) => {
    Alert.alert(
      'Delete Package',
      'Are you sure you want to delete this package?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedTrip = {
              ...trip,
              packages: trip.packages.filter((pkg) => pkg.id !== packageId),
              updatedAt: getLocalISOString(),
            };
            const updatedTrips = trips.map((t) => (t.id === trip.id ? updatedTrip : t));
            saveTrips(updatedTrips);
            setSelectedTrip(updatedTrip);
            HapticFeedback.success();
          },
        },
      ]
    );
  };

  // Delete person
  const handleDeletePerson = (trip: Trip, personIndex: number) => {
    Alert.alert(
      'Delete Person',
      'Are you sure you want to delete this person?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedTrip = {
              ...trip,
              people: trip.people.filter((_, idx) => idx !== personIndex),
              updatedAt: getLocalISOString(),
            };
            const updatedTrips = trips.map((t) => (t.id === trip.id ? updatedTrip : t));
            saveTrips(updatedTrips);
            setSelectedTrip(updatedTrip);
            HapticFeedback.success();
          },
        },
      ]
    );
  };

  // Generate share text
  const generateShareText = (trip: Trip): string => {
    let text = `Trip Survey: ${trip.name}\n\n`;

    text += 'Possible Dates:\n';
    if (trip.possibleDates.length === 0) {
      text += '- None -yes\n';
    } else {
      trip.possibleDates.forEach((dateRange) => {
        text += `- ${formatDateRange(dateRange)} -yes\n`;
      });
    }

    text += '\nLocations:\n';
    if (trip.locations.length === 0) {
      text += '- None -yes\n';
    } else {
      trip.locations.forEach((location) => {
        text += `- ${location} -yes\n`;
      });
    }

    text += '\nPackages:\n';
    if (trip.packages.length === 0) {
      text += '- None -yes\n';
    } else {
      trip.packages.forEach((pkg) => {
        text += `- ${pkg.name} - $${pkg.price} - ${pkg.days} days -yes\n`;
      });
    }

    text += '\nPlease respond with your preferences for each option above by adding a yes, no, or maybe at the end of each line (you can replace -yes with -no or -maybe, or just add yes/no/maybe). Do not change the value or add values - just modify the yes/no/maybe at the end of each option.\n\n';
    text += 'If you have any Blackout Dates that you cannot travel, list them below (each date on a new line starting with *):\n';
    if (trip.blackoutDates.length === 0) {
      text += '* None\n';
    } else {
      trip.blackoutDates.forEach((blackoutText) => {
        text += `* ${blackoutText}\n`;
      });
    }

    return text;
  };

  // Share survey
  const handleShareSurvey = async (trip: Trip) => {
    const shareText = generateShareText(trip);
    try {
      await Share.share({
        message: shareText,
      });
      HapticFeedback.success();
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Parse response text
  const parseResponse = (trip: Trip, text: string): { answers: ParsedAnswer[]; blackoutDates?: string } => {
    const answers: ParsedAnswer[] = [];
    let blackoutDates: string | undefined;
    const lines = text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);

    let currentSection = '';
    let blackoutSection = false;

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      // Detect sections
      if (lowerLine.includes('date') && !lowerLine.includes('blackout')) {
        currentSection = 'dates';
        continue;
      }
      if (lowerLine.includes('location')) {
        currentSection = 'locations';
        continue;
      }
      if (lowerLine.includes('package')) {
        currentSection = 'packages';
        continue;
      }
      if (lowerLine.includes('blackout')) {
        blackoutSection = true;
        currentSection = '';
        continue;
      }

      // Skip section headers
      if (line.match(/^[A-Z][a-z]+:$/)) {
        continue;
      }

      // Parse blackout dates (lines starting with *)
      if (blackoutSection) {
        if (line.startsWith('*')) {
          const blackoutDate = line.substring(1).trim();
          if (blackoutDate && blackoutDate.toLowerCase() !== 'none') {
            blackoutDates = (blackoutDates ? blackoutDates + '\n' : '') + blackoutDate;
          }
        }
        continue;
      }

      // Extract yes/no/maybe - check for -yes/-no/-maybe or yes/no/maybe at the end
      const answerMatch = line.match(/\s*[-]?\s*(yes|no|maybe|y|n|m)\s*$/i);
      let answer = '';
      if (answerMatch) {
        const answerText = answerMatch[1].toLowerCase();
        if (answerText.startsWith('y')) answer = 'yes';
        else if (answerText.startsWith('n')) answer = 'no';
        else if (answerText.startsWith('m')) answer = 'maybe';
      }

      if (!answer) continue;

      // Remove yes/no/maybe from line to get the option text (remove trailing -yes/-no/-maybe or yes/no/maybe)
      const optionText = line.replace(/\s*[-]?\s*(yes|no|maybe|y|n|m)\s*$/gi, '').trim();

      if (currentSection === 'dates') {
        // Match date ranges
        for (const dateRange of trip.possibleDates) {
          const dateRangeText = formatDateRange(dateRange);
          if (optionText.includes(dateRangeText) || dateRangeText.includes(optionText)) {
            answers.push({
              optionType: 'date',
              optionId: dateRange.id,
              answer: answer,
            });
            break;
          }
        }
      } else if (currentSection === 'locations') {
        // Match locations (case-insensitive, partial matching)
        for (const location of trip.locations) {
          if (optionText.toLowerCase().includes(location.toLowerCase()) ||
            location.toLowerCase().includes(optionText.toLowerCase())) {
            answers.push({
              optionType: 'location',
              optionId: location,
              answer: answer,
            });
            break;
          }
        }
      } else if (currentSection === 'packages') {
        // Match packages
        for (const pkg of trip.packages) {
          const pkgText = `${pkg.name} - $${pkg.price} - ${pkg.days} days`;
          if (optionText.includes(pkg.name) || pkgText.includes(optionText)) {
            answers.push({
              optionType: 'package',
              optionId: pkg.id,
              answer: answer,
            });
            break;
          }
        }
      }
    }

    return { answers, blackoutDates };
  };

  // Add response
  const handleAddResponse = () => {
    if (!selectedTrip) return;

    if (!responseParticipant) {
      Alert.alert('Error', 'Please select a participant');
      return;
    }

    if (!responseText.trim()) {
      Alert.alert('Error', 'Please paste the response text');
      return;
    }

    const { answers, blackoutDates } = parseResponse(selectedTrip, responseText);

    const newResponse: TripResponse = {
      id: generateId(),
      tripId: selectedTrip.id,
      participantName: responseParticipant,
      rawText: responseText,
      parsedAnswers: answers,
      blackoutDatesText: blackoutDates,
      receivedAt: getLocalISOString(),
    };

    // Remove any existing response from this participant for this trip
    const updatedResponses = responses.filter(
      (r) => !(r.tripId === selectedTrip.id && r.participantName === responseParticipant)
    );
    updatedResponses.push(newResponse);

    saveResponses(updatedResponses);
    setResponseParticipant('');
    setResponseText('');
    setShowAddResponseModal(false);
    HapticFeedback.success();
    Alert.alert('Success', 'Response added successfully');
  };

  // Finalize trip
  const handleFinalizeTrip = () => {
    if (!selectedTrip) return;

    if (!finalStartDate || !finalEndDate) {
      Alert.alert('Error', 'Please select start and end dates');
      return;
    }

    if (selectedFinalLocations.length === 0) {
      Alert.alert('Error', 'Please select at least one location');
      return;
    }

    const updatedTrip: Trip = {
      ...selectedTrip,
      isFinalized: true,
      finalStartDate: finalStartDate,
      finalEndDate: finalEndDate,
      finalLocations: selectedFinalLocations,
      finalPackages: selectedFinalPackages.length > 0 ? selectedFinalPackages : undefined,
      finalPeople: selectedFinalPeople.length > 0 ? selectedFinalPeople : undefined,
      updatedAt: getLocalISOString(),
    };

    const updatedTrips = trips.map((t) => (t.id === selectedTrip.id ? updatedTrip : t));
    saveTrips(updatedTrips);
    setSelectedTrip(updatedTrip);
    setShowFinalizeModal(false);
    HapticFeedback.success();
    Alert.alert('Success', 'Trip finalized successfully');
  };

  // Unfinalize trip (Edit Trip)
  const handleEditTrip = () => {
    if (!selectedTrip) return;

    const updatedTrip: Trip = {
      ...selectedTrip,
      isFinalized: false,
      updatedAt: getLocalISOString(),
    };

    const updatedTrips = trips.map((t) => (t.id === selectedTrip.id ? updatedTrip : t));
    saveTrips(updatedTrips);
    setSelectedTrip(updatedTrip);
    HapticFeedback.success();
  };

  // Share finalized trip
  const handleShareFinalizedTrip = async () => {
    if (!selectedTrip || !selectedTrip.isFinalized) return;

    let text = `🎉 Trip Finalized: ${selectedTrip.name}\n\n`;

    if (selectedTrip.finalStartDate && selectedTrip.finalEndDate) {
      text += `📅 Dates: ${formatDate(selectedTrip.finalStartDate)} - ${formatDate(selectedTrip.finalEndDate)}\n\n`;
    }

    if (selectedTrip.finalLocations && selectedTrip.finalLocations.length > 0) {
      text += `📍 Locations:\n${selectedTrip.finalLocations.map(l => `  • ${l}`).join('\n')}\n\n`;
    }

    if (selectedTrip.finalPackages && selectedTrip.finalPackages.length > 0) {
      const finalPkgs = selectedTrip.packages.filter(pkg => selectedTrip.finalPackages?.includes(pkg.id));
      text += `🎁 Packages:\n${finalPkgs.map(pkg => `  • ${pkg.name} - $${pkg.price} - ${pkg.days} days`).join('\n')}\n\n`;
    }

    if (selectedTrip.finalPeople && selectedTrip.finalPeople.length > 0) {
      text += `👥 People:\n${selectedTrip.finalPeople.map(p => `  • ${p}`).join('\n')}\n`;
    }

    try {
      await Share.share({ message: text });
      HapticFeedback.success();
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Get response for participant and option
  const getResponseForOption = (tripId: string, participantName: string, optionType: 'date' | 'location' | 'package', optionId: string): string => {
    const response = responses.find(
      (r) => r.tripId === tripId && r.participantName === participantName
    );
    if (!response) return '';

    const answer = response.parsedAnswers.find(
      (a) => a.optionType === optionType && a.optionId === optionId
    );
    return answer?.answer || '';
  };

  // Render Trip List View
  const renderTripList = () => {
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      scrollContent: {
        padding: 16,
      },
      title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
      },
      subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: 24,
      },
      createButton: {
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
      },
      createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
      },
      tripCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      },
      tripName: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
      },
      tripMeta: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 4,
      },
      tripStatus: {
        fontSize: 12,
        color: colors.primary,
        marginTop: 8,
        fontWeight: '600',
      },
    });

    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollContent}>
          <Text style={styles.title}>🧭 Trip Survey</Text>
          <Text style={styles.subtitle}>Plan trips with group input</Text>

          <TouchableOpacity
            style={styles.createButton}
            onPress={() => {
              setShowCreateTripModal(true);
              HapticFeedback.light();
            }}
          >
            <Text style={styles.createButtonText}>Create New Trip</Text>
          </TouchableOpacity>

          {trips.length === 0 ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40 }}>
              No trips yet. Create your first trip to get started!
            </Text>
          ) : (
            trips.map((trip) => {
              const tripResponses = responses.filter((r) => r.tripId === trip.id);
              const responseCount = tripResponses.length;

              return (
                <TouchableOpacity
                  key={trip.id}
                  style={styles.tripCard}
                  onPress={() => handleSelectTrip(trip)}
                >
                  <Text style={styles.tripName}>{trip.name}</Text>
                  <Text style={styles.tripMeta}>
                    {trip.people.length} participant{trip.people.length !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.tripMeta}>
                    {responseCount} response{responseCount !== 1 ? 's' : ''} received
                  </Text>
                  <Text style={styles.tripStatus}>
                    {trip.isFinalized ? '✓ Finalized' : 'Planning'}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  };

  // Render Trip Details View
  const renderTripDetails = () => {
    if (!selectedTrip) return null;

    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      scrollContent: {
        padding: 16,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
      },
      backButton: {
        marginRight: 12,
        padding: 8,
      },
      backButtonText: {
        fontSize: 18,
        color: colors.primary,
      },
      title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        flex: 1,
      },
      section: {
        marginBottom: 24,
      },
      sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 12,
      },
      item: {
        backgroundColor: colors.surface,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      itemText: {
        fontSize: 14,
        color: colors.text,
        flex: 1,
      },
      deleteButton: {
        padding: 8,
        marginLeft: 8,
      },
      deleteButtonText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
      },
      addButton: {
        backgroundColor: colors.primary + '20',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 8,
        borderWidth: 1,
        borderColor: colors.primary,
      },
      addButtonText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
      },
      actionButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
      },
      actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
      },
    });

    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setCurrentView('list');
                setSelectedTrip(null);
                HapticFeedback.light();
              }}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{selectedTrip.name}</Text>
          </View>

          {/* Possible Dates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Possible Dates</Text>
            {selectedTrip.possibleDates.length === 0 ? (
              <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>No dates added</Text>
            ) : (
              selectedTrip.possibleDates.map((dateRange) => (
                <View key={dateRange.id} style={styles.item}>
                  <Text style={styles.itemText}>{formatDateRange(dateRange)}</Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePossibleDate(selectedTrip, dateRange.id)}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddPossibleDate(selectedTrip)}
            >
              <Text style={styles.addButtonText}>+ Add Date Range</Text>
            </TouchableOpacity>
          </View>

          {/* Locations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Locations</Text>
            {selectedTrip.locations.length === 0 ? (
              <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>No locations added</Text>
            ) : (
              selectedTrip.locations.map((location, index) => (
                <View key={index} style={styles.item}>
                  <Text style={styles.itemText}>{location}</Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteLocation(selectedTrip, index)}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddLocation(selectedTrip)}
            >
              <Text style={styles.addButtonText}>+ Add Location</Text>
            </TouchableOpacity>
          </View>

          {/* Packages */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Packages</Text>
            {selectedTrip.packages.length === 0 ? (
              <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>No packages added</Text>
            ) : (
              selectedTrip.packages.map((pkg) => (
                <View key={pkg.id} style={styles.item}>
                  <Text style={styles.itemText}>
                    {pkg.name} - ${pkg.price} - {pkg.days} days
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePackage(selectedTrip, pkg.id)}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddPackage(selectedTrip)}
            >
              <Text style={styles.addButtonText}>+ Add Package</Text>
            </TouchableOpacity>
          </View>

          {/* People */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>People</Text>
            {selectedTrip.people.length === 0 ? (
              <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>No people added</Text>
            ) : (
              selectedTrip.people.map((person, index) => (
                <View key={index} style={styles.item}>
                  <Text style={styles.itemText}>{person}</Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePerson(selectedTrip, index)}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddPerson(selectedTrip)}
            >
              <Text style={styles.addButtonText}>+ Add Person</Text>
            </TouchableOpacity>
          </View>

          {/* Blackout Dates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Blackout Dates</Text>
            {selectedTrip.blackoutDates.length === 0 ? (
              <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>No blackout dates</Text>
            ) : (
              selectedTrip.blackoutDates.map((blackoutText, index) => (
                <View key={index} style={styles.item}>
                  <Text style={styles.itemText}>{blackoutText}</Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteBlackoutDate(selectedTrip, index)}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddBlackoutDate(selectedTrip)}
            >
              <Text style={styles.addButtonText}>+ Add Blackout Date</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          {!selectedTrip.isFinalized && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setShowShareModal(true);
                  HapticFeedback.light();
                }}
              >
                <Text style={styles.actionButtonText}>Share Survey</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  if (selectedTrip.people.length === 0) {
                    Alert.alert('Error', 'Please add people first');
                    return;
                  }
                  setShowAddResponseModal(true);
                  HapticFeedback.light();
                }}
              >
                <Text style={styles.actionButtonText}>Add Response</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setCurrentView('matrix');
                  HapticFeedback.light();
                }}
              >
                <Text style={styles.actionButtonText}>View Responses Matrix</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  if (selectedTrip.possibleDates.length === 0) {
                    Alert.alert('Error', 'Please add possible dates first');
                    return;
                  }
                  if (selectedTrip.locations.length === 0) {
                    Alert.alert('Error', 'Please add locations first');
                    return;
                  }
                  setFinalStartDate('');
                  setFinalEndDate('');
                  setSelectedFinalLocations([]);
                  setSelectedFinalPackages([]);
                  setSelectedFinalPeople([]);
                  setShowFinalizeModal(true);
                  HapticFeedback.light();
                }}
              >
                <Text style={styles.actionButtonText}>Finalize Trip</Text>
              </TouchableOpacity>
            </>
          )}

          {selectedTrip.isFinalized && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  handleShareFinalizedTrip();
                  HapticFeedback.light();
                }}
              >
                <Text style={styles.actionButtonText}>Share Finalized Trip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.textSecondary }]}
                onPress={() => {
                  Alert.alert(
                    'Edit Trip',
                    'This will unfinalize the trip and allow you to make changes. Continue?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Edit', onPress: handleEditTrip },
                    ]
                  );
                  HapticFeedback.light();
                }}
              >
                <Text style={styles.actionButtonText}>Edit Trip</Text>
              </TouchableOpacity>
            </>
          )}

          {selectedTrip.isFinalized && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Finalized Details</Text>
              {selectedTrip.finalStartDate && selectedTrip.finalEndDate && (
                <View style={styles.item}>
                  <Text style={styles.itemText}>
                    Dates: {formatDate(selectedTrip.finalStartDate)} - {formatDate(selectedTrip.finalEndDate)}
                  </Text>
                </View>
              )}
              {selectedTrip.finalLocations && selectedTrip.finalLocations.length > 0 && (
                <View style={styles.item}>
                  <Text style={styles.itemText}>
                    Locations: {selectedTrip.finalLocations.join(', ')}
                  </Text>
                </View>
              )}
              {selectedTrip.finalPackages && selectedTrip.finalPackages.length > 0 && (
                <View style={styles.item}>
                  <Text style={styles.itemText}>
                    Packages: {selectedTrip.packages
                      .filter((pkg) => selectedTrip.finalPackages?.includes(pkg.id))
                      .map((pkg) => pkg.name)
                      .join(', ')}
                  </Text>
                </View>
              )}
              {selectedTrip.finalPeople && selectedTrip.finalPeople.length > 0 && (
                <View style={styles.item}>
                  <Text style={styles.itemText}>
                    People: {selectedTrip.finalPeople.join(', ')}
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // Render Response Matrix View
  const renderMatrix = () => {
    if (!selectedTrip) return null;

    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      backButton: {
        marginRight: 12,
        padding: 8,
      },
      backButtonText: {
        fontSize: 18,
        color: colors.primary,
      },
      title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        flex: 1,
      },
      matrixContainer: {
        flex: 1,
      },
      row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      rowHeader: {
        width: 150,
        padding: 12,
        backgroundColor: colors.surface,
        borderRightWidth: 1,
        borderRightColor: colors.border,
        justifyContent: 'center',
      },
      rowHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
      },
      cell: {
        width: 120,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
      },
      cellText: {
        fontSize: 12,
        color: colors.text,
      },
      cellTextYes: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '600',
      },
      cellTextNo: {
        fontSize: 12,
        color: '#F44336',
        fontWeight: '600',
      },
      cellTextMaybe: {
        fontSize: 12,
        color: '#FF9800',
        fontWeight: '600',
      },
      columnHeader: {
        width: 120,
        padding: 12,
        backgroundColor: colors.surface,
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: colors.border,
      },
      columnHeaderText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.text,
      },
      emptyCell: {
        width: 120,
        padding: 12,
      },
    });

    // Build matrix data
    const options: Array<{ type: 'date' | 'location' | 'package' | 'blackout'; id: string; label: string }> = [];

    selectedTrip.possibleDates.forEach((dateRange) => {
      options.push({
        type: 'date',
        id: dateRange.id,
        label: formatDateRange(dateRange),
      });
    });

    selectedTrip.locations.forEach((location) => {
      options.push({
        type: 'location',
        id: location,
        label: location,
      });
    });

    selectedTrip.packages.forEach((pkg) => {
      options.push({
        type: 'package',
        id: pkg.id,
        label: `${pkg.name} - $${pkg.price} - ${pkg.days} days`,
      });
    });

    // Add blackout dates from the trip (as text entries)
    // Collect all unique blackout dates from responses and trip
    const allBlackoutDates = new Set<string>();
    
    // Add trip's blackout dates
    selectedTrip.blackoutDates.forEach((blackoutText) => {
      allBlackoutDates.add(blackoutText.trim());
    });
    
    // Add blackout dates from responses (extract individual lines)
    responses
      .filter((r) => r.tripId === selectedTrip.id && r.blackoutDatesText)
      .forEach((response) => {
        const lines = response.blackoutDatesText!.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
        lines.forEach((line) => {
          if (line.toLowerCase() !== 'none') {
            allBlackoutDates.add(line);
          }
        });
      });
    
    // Add each unique blackout date as an option
    Array.from(allBlackoutDates).forEach((blackoutText) => {
      options.push({
        type: 'blackout',
        id: blackoutText, // Use text as ID
        label: `🚫 ${blackoutText}`,
      });
    });

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setCurrentView('details');
              HapticFeedback.light();
            }}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Response Matrix</Text>
        </View>

        <ScrollView horizontal>
          <View style={styles.matrixContainer}>
            {/* Header row */}
            <View style={styles.row}>
              <View style={styles.emptyCell} />
              {selectedTrip.people.map((person) => (
                <View key={person} style={styles.columnHeader}>
                  <Text style={styles.columnHeaderText} numberOfLines={2}>
                    {person}
                  </Text>
                </View>
              ))}
            </View>

            {/* Data rows */}
            {options.map((option) => (
              <View key={`${option.type}-${option.id}`} style={styles.row}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowHeaderText} numberOfLines={2}>
                    {option.label}
                  </Text>
                </View>
                {selectedTrip.people.map((person) => {
                  // For blackout dates, check if this specific blackout date text matches
                  if (option.type === 'blackout') {
                    const response = responses.find(
                      (r) => r.tripId === selectedTrip.id && r.participantName === person
                    );
                    if (response?.blackoutDatesText) {
                      const responseLines = response.blackoutDatesText
                        .split('\n')
                        .map((line) => line.trim())
                        .filter((line) => line.length > 0 && line.toLowerCase() !== 'none');
                      // Check for exact match (case-insensitive)
                      const hasMatch = responseLines.some(
                        (line) => line.toLowerCase() === option.id.toLowerCase()
                      );
                      return (
                        <View key={person} style={styles.cell}>
                          <Text style={styles.cellText}>{hasMatch ? '✓' : '-'}</Text>
                        </View>
                      );
                    }
                    return (
                      <View key={person} style={styles.cell}>
                        <Text style={styles.cellText}>-</Text>
                      </View>
                    );
                  }

                  // For regular options (dates, locations, packages)
                  const answer = getResponseForOption(selectedTrip.id, person, option.type, option.id);
                  let cellStyle = styles.cellText;
                  if (answer === 'yes') cellStyle = styles.cellTextYes;
                  else if (answer === 'no') cellStyle = styles.cellTextNo;
                  else if (answer === 'maybe') cellStyle = styles.cellTextMaybe;

                  return (
                    <View key={person} style={styles.cell}>
                      <Text style={cellStyle}>{answer || '-'}</Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render modals
  const renderCreateTripModal = () => (
    <Modal visible={showCreateTripModal} transparent animationType="slide">
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ backgroundColor: colors.background, borderRadius: 12, padding: 20, width: '90%', maxWidth: 400 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>
              Create New Trip
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: colors.text,
                marginBottom: 16,
              }}
              placeholder="Trip name"
              placeholderTextColor={colors.textSecondary}
              value={newTripName}
              onChangeText={setNewTripName}
              autoFocus
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity
                style={{ padding: 12, marginRight: 12 }}
                onPress={() => {
                  setShowCreateTripModal(false);
                  setNewTripName('');
                }}
              >
                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}
                onPress={handleCreateTrip}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderAddResponseModal = () => {
    if (!selectedTrip) return null;

    return (
      <Modal visible={showAddResponseModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ backgroundColor: colors.background, borderRadius: 12, padding: 20, maxHeight: '80%', width: '90%', maxWidth: 400 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>
                Add Response
              </Text>

              <Text style={{ fontSize: 14, color: colors.text, marginBottom: 8 }}>Participant:</Text>
              <ScrollView style={{ maxHeight: 150, marginBottom: 16 }}>
                {selectedTrip.people.map((person) => (
                  <TouchableOpacity
                    key={person}
                    style={{
                      padding: 12,
                      backgroundColor: responseParticipant === person ? colors.primary + '20' : colors.surface,
                      borderRadius: 8,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: responseParticipant === person ? colors.primary : colors.border,
                    }}
                    onPress={() => setResponseParticipant(person)}
                  >
                    <Text style={{ color: colors.text }}>{person}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={{ fontSize: 14, color: colors.text, marginBottom: 8 }}>Response Text:</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  color: colors.text,
                  marginBottom: 16,
                  minHeight: 200,
                  textAlignVertical: 'top',
                }}
                placeholder="Paste the response text here..."
                placeholderTextColor={colors.textSecondary}
                value={responseText}
                onChangeText={setResponseText}
                multiline
              />

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity
                  style={{ padding: 12, marginRight: 12 }}
                  onPress={() => {
                    setShowAddResponseModal(false);
                    setResponseParticipant('');
                    setResponseText('');
                  }}
                >
                  <Text style={{ color: colors.textSecondary }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}
                  onPress={handleAddResponse}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const renderFinalizeModal = () => {
    if (!selectedTrip) return null;

    // Create unique list of all start and end dates from possibleDates
    const allStartDates = Array.from(new Set(selectedTrip.possibleDates.map(dr => dr.startDate)));
    const allEndDates = Array.from(new Set(selectedTrip.possibleDates.map(dr => dr.endDate)));

    return (
      <Modal visible={showFinalizeModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ backgroundColor: colors.background, borderRadius: 12, padding: 20, width: '90%', maxWidth: 400 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>
              Finalize Trip
            </Text>

            <Text style={{ fontSize: 14, color: colors.text, marginBottom: 8 }}>Start Date:</Text>
            <ScrollView style={{ maxHeight: 150, marginBottom: 16 }}>
              {allStartDates.map((startDate, index) => (
                <TouchableOpacity
                  key={`start-${index}`}
                  style={{
                    padding: 12,
                    backgroundColor: finalStartDate === startDate ? colors.primary + '20' : colors.surface,
                    borderRadius: 8,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: finalStartDate === startDate ? colors.primary : colors.border,
                  }}
                  onPress={() => setFinalStartDate(startDate)}
                >
                  <Text style={{ color: colors.text }}>{formatDate(startDate)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={{ fontSize: 14, color: colors.text, marginBottom: 8 }}>End Date:</Text>
            <ScrollView style={{ maxHeight: 150, marginBottom: 16 }}>
              {allEndDates.map((endDate, index) => (
                <TouchableOpacity
                  key={`end-${index}`}
                  style={{
                    padding: 12,
                    backgroundColor: finalEndDate === endDate ? colors.primary + '20' : colors.surface,
                    borderRadius: 8,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: finalEndDate === endDate ? colors.primary : colors.border,
                  }}
                  onPress={() => setFinalEndDate(endDate)}
                >
                  <Text style={{ color: colors.text }}>{formatDate(endDate)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={{ fontSize: 14, color: colors.text, marginBottom: 8 }}>Locations (select at least one):</Text>
            <ScrollView style={{ maxHeight: 150, marginBottom: 16 }}>
              {selectedTrip.locations.map((location) => {
                const isSelected = selectedFinalLocations.includes(location);
                return (
                  <TouchableOpacity
                    key={location}
                    style={{
                      padding: 12,
                      backgroundColor: isSelected ? colors.primary + '20' : colors.surface,
                      borderRadius: 8,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedFinalLocations(selectedFinalLocations.filter((l) => l !== location));
                      } else {
                        setSelectedFinalLocations([...selectedFinalLocations, location]);
                      }
                    }}
                  >
                    <Text style={{ color: colors.text, flex: 1 }}>{location}</Text>
                    {isSelected && <Text style={{ color: colors.primary }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedTrip.packages.length > 0 && (
              <>
                <Text style={{ fontSize: 14, color: colors.text, marginBottom: 8 }}>Packages (optional):</Text>
                <ScrollView style={{ maxHeight: 150, marginBottom: 16 }}>
                  {selectedTrip.packages.map((pkg) => {
                    const isSelected = selectedFinalPackages.includes(pkg.id);
                    return (
                      <TouchableOpacity
                        key={pkg.id}
                        style={{
                          padding: 12,
                          backgroundColor: isSelected ? colors.primary + '20' : colors.surface,
                          borderRadius: 8,
                          marginBottom: 8,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.primary : colors.border,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedFinalPackages(selectedFinalPackages.filter((id) => id !== pkg.id));
                          } else {
                            setSelectedFinalPackages([...selectedFinalPackages, pkg.id]);
                          }
                        }}
                      >
                        <Text style={{ color: colors.text, flex: 1 }}>
                          {pkg.name} - ${pkg.price} - {pkg.days} days
                        </Text>
                        {isSelected && <Text style={{ color: colors.primary }}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {selectedTrip.people.length > 0 && (
              <>
                <Text style={{ fontSize: 14, color: colors.text, marginBottom: 8 }}>People (optional):</Text>
                <ScrollView style={{ maxHeight: 150, marginBottom: 16 }}>
                  {selectedTrip.people.map((person) => {
                    const isSelected = selectedFinalPeople.includes(person);
                    return (
                      <TouchableOpacity
                        key={person}
                        style={{
                          padding: 12,
                          backgroundColor: isSelected ? colors.primary + '20' : colors.surface,
                          borderRadius: 8,
                          marginBottom: 8,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.primary : colors.border,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedFinalPeople(selectedFinalPeople.filter((p) => p !== person));
                          } else {
                            setSelectedFinalPeople([...selectedFinalPeople, person]);
                          }
                        }}
                      >
                        <Text style={{ color: colors.text, flex: 1 }}>{person}</Text>
                        {isSelected && <Text style={{ color: colors.primary }}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity
                style={{ padding: 12, marginRight: 12 }}
                onPress={() => {
                  setShowFinalizeModal(false);
                }}
              >
                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}
                onPress={handleFinalizeTrip}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Finalize</Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const renderShareModal = () => {
    if (!selectedTrip) return null;

    const shareText = generateShareText(selectedTrip);

    return (
      <Modal visible={showShareModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ backgroundColor: colors.background, borderRadius: 12, padding: 20, maxHeight: '80%', width: '90%', maxWidth: 400 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>
              Share Survey
            </Text>

            <ScrollView style={{ maxHeight: 400, marginBottom: 16 }}>
              <Text style={{ color: colors.text, fontSize: 14, fontFamily: 'monospace' }}>
                {shareText}
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={{
                padding: 12,
                backgroundColor: colors.primary + '20',
                borderRadius: 8,
                marginBottom: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.primary,
              }}
              onPress={async () => {
                await Clipboard.setString(shareText);
                HapticFeedback.success();
                Alert.alert('Copied', 'Survey text copied to clipboard');
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Copy to Clipboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                padding: 12,
                backgroundColor: colors.primary,
                borderRadius: 8,
                marginBottom: 12,
                alignItems: 'center',
              }}
              onPress={() => handleShareSurvey(selectedTrip)}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Share via Text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ padding: 12, alignItems: 'center' }}
              onPress={() => setShowShareModal(false)}
            >
              <Text style={{ color: colors.textSecondary }}>Close</Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const renderDateRangeModal = () => {
    return (
      <Modal visible={showDateRangeModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ backgroundColor: colors.background, borderRadius: 12, padding: 20, width: '90%', maxWidth: 400 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>
              Add Possible Date Range
            </Text>

            <Text style={{ fontSize: 14, color: colors.text, marginBottom: 8 }}>Start Date (YYYY-MM-DD):</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: colors.text,
                marginBottom: 16,
              }}
              placeholder="2024-06-01"
              placeholderTextColor={colors.textSecondary}
              value={dateRangeStart}
              onChangeText={setDateRangeStart}
              autoFocus
            />

            <Text style={{ fontSize: 14, color: colors.text, marginBottom: 8 }}>End Date (YYYY-MM-DD):</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: colors.text,
                marginBottom: 16,
              }}
              placeholder="2024-06-07"
              placeholderTextColor={colors.textSecondary}
              value={dateRangeEnd}
              onChangeText={setDateRangeEnd}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity
                style={{ padding: 12, marginRight: 12 }}
                onPress={() => {
                  setShowDateRangeModal(false);
                  setDateRangeStart('');
                  setDateRangeEnd('');
                }}
              >
                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}
                onPress={handleSaveDateRange}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // Render settings
  const renderSettings = () => (
    <SettingsContainer>
      <SettingsScrollView>
        <SettingsHeader
          title="Trip Survey Settings"
          subtitle="Manage your trip surveys"
          icon="🧭"
          sparkId="trip-survey"
        />
        <SettingsFeedbackSection sparkName="Trip Survey" sparkId="trip-survey" />
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 24,
          }}
          onPress={onCloseSettings}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Close</Text>
        </TouchableOpacity>
      </SettingsScrollView>
    </SettingsContainer>
  );

  if (showSettings) {
    return renderSettings();
  }

  // Main render
  if (currentView === 'list') {
    return (
      <>
        {renderTripList()}
        {renderCreateTripModal()}
      </>
    );
  }

  if (currentView === 'details') {
    return (
      <>
        {renderTripDetails()}
        {renderAddResponseModal()}
        {renderFinalizeModal()}
        {renderShareModal()}
        {renderDateRangeModal()}
      </>
    );
  }

  if (currentView === 'matrix') {
    return renderMatrix();
  }

  return renderTripList();
};

export default TripSurveySpark;

