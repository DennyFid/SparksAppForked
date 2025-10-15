import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Modal } from 'react-native';
import { useSparkStore } from '../store';
import { HapticFeedback } from '../utils/haptics';
import { useTheme } from '../contexts/ThemeContext';
import {
  SettingsContainer,
  SettingsScrollView,
  SettingsHeader,
  SettingsSection,
  SettingsFeedbackSection,
  SettingsText,
  SettingsButton
} from '../components/SettingsComponents';

interface ToviewItem {
  id: number;
  text: string;
  completed: boolean;
  viewDate: string; // ISO date string (YYYY-MM-DD)
  completedDate?: string; // ISO date string when completed
  createdDate: string; // ISO date string when created
  category?: string; // Parsed category from text (e.g., "Movie" from "Movie: Gladiator")
  displayText: string; // Text without category prefix
  // Hidden field used only for ordering within the same day/completed group
  // We store a local timestamp in ms captured at edit/create/complete time
  sortTimeMs?: number;
}

interface ToviewSparkProps {
  showSettings?: boolean;
  onCloseSettings?: () => void;
  onStateChange?: (state: any) => void;
  onComplete?: (result: any) => void;
}

// Settings Component
const ToviewSettings: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  return (
    <SettingsContainer>
      <SettingsScrollView>
        <SettingsHeader
          title="Toview Settings"
          subtitle="Manage your viewing preferences"
          icon="📺"
        />

        <SettingsFeedbackSection sparkName="Toview" />
      </SettingsScrollView>
    </SettingsContainer>
  );
};

const ToviewSpark: React.FC<ToviewSparkProps> = ({
  showSettings = false,
  onCloseSettings,
  onStateChange,
  onComplete
}) => {
  const { colors } = useTheme();
  const { getSparkData, setSparkData } = useSparkStore();
  const [toviews, setToviews] = useState<ToviewItem[]>([]);
  const [newToviewText, setNewToviewText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  // Always show future toviews - no toggle needed
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ToviewItem | null>(null);
  const [editingViewDate, setEditingViewDate] = useState('');
  const [editingCompleted, setEditingCompleted] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getSparkData('toview');
      if (data && data.toviews) {
        setToviews(data.toviews);
      } else {
        // Initialize with default items
        const defaultToviews: ToviewItem[] = [
          {
            id: 1,
            text: 'Movie: Gladiator',
            completed: false,
            viewDate: new Date().toISOString().split('T')[0],
            createdDate: new Date().toISOString().split('T')[0],
            category: 'Movie',
            displayText: 'Gladiator',
            sortTimeMs: Date.now()
          },
          {
            id: 2,
            text: 'Book: Pillars of the Earth',
            completed: false,
            viewDate: new Date().toISOString().split('T')[0],
            createdDate: new Date().toISOString().split('T')[0],
            category: 'Book',
            displayText: 'Pillars of the Earth',
            sortTimeMs: Date.now() + 1
          },
          {
            id: 3,
            text: 'Show: Brooklyn 99',
            completed: false,
            viewDate: new Date().toISOString().split('T')[0],
            createdDate: new Date().toISOString().split('T')[0],
            category: 'Show',
            displayText: 'Brooklyn 99',
            sortTimeMs: Date.now() + 2
          }
        ];
        setToviews(defaultToviews);
        await saveData(defaultToviews);
      }
    } catch (error) {
      console.error('Error loading toview data:', error);
    }
  };

  const saveData = async (toviewsToSave: ToviewItem[]) => {
    try {
      await setSparkData('toview', { toviews: toviewsToSave });
    } catch (error) {
      console.error('Error saving toview data:', error);
    }
  };

  const parseToviewText = (text: string) => {
    // Match any text followed by a colon and then the display text
    const categoryMatch = text.match(/^([^:]+):\s*(.+)$/);
    if (categoryMatch) {
      return {
        category: categoryMatch[1].trim(),
        displayText: categoryMatch[2].trim()
      };
    }
    return {
      category: undefined,
      displayText: text.trim()
    };
  };

  const addToview = async () => {
    if (!newToviewText.trim()) return;

    const { category, displayText } = parseToviewText(newToviewText);
    const newToview: ToviewItem = {
      id: Date.now(),
      text: newToviewText.trim(),
      completed: false,
      viewDate: new Date().toISOString().split('T')[0],
      createdDate: new Date().toISOString().split('T')[0],
      category,
      displayText,
      sortTimeMs: Date.now()
    };

    const updatedToviews = [...toviews, newToview];
    setToviews(updatedToviews);
    await saveData(updatedToviews);
    setNewToviewText('');
    HapticFeedback.light();
  };

  const toggleToview = async (id: number) => {
    const updatedToviews = toviews.map(toview => {
      if (toview.id === id) {
        const completed = !toview.completed;
        return {
          ...toview,
          completed,
          completedDate: completed ? new Date().toISOString().split('T')[0] : undefined,
          sortTimeMs: Date.now()
        };
      }
      return toview;
    });
    setToviews(updatedToviews);
    await saveData(updatedToviews);
    HapticFeedback.light();
  };

  const deleteToview = async (id: number) => {
    Alert.alert(
      'Delete Toview',
      'Are you sure you want to delete this toview?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedToviews = toviews.filter(toview => toview.id !== id);
            setToviews(updatedToviews);
            await saveData(updatedToviews);
            HapticFeedback.light();
          }
        }
      ]
    );
  };

  const startEditing = (toview: ToviewItem) => {
    setEditingId(toview.id);
    setEditingText(toview.text);
    textInputRef.current?.focus();
  };

  const saveEdit = async () => {
    if (!editingText.trim() || editingId === null) return;

    const { category, displayText } = parseToviewText(editingText);
    const updatedToviews = toviews.map(toview => {
      if (toview.id === editingId) {
        return {
          ...toview,
          text: editingText.trim(),
          category,
          displayText,
          sortTimeMs: Date.now()
        };
      }
      return toview;
    });
    setToviews(updatedToviews);
    await saveData(updatedToviews);
    setEditingId(null);
    setEditingText('');
    HapticFeedback.light();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const openEditModal = (toview: ToviewItem) => {
    setEditingItem(toview);
    setEditingText(toview.text);
    setEditingViewDate(toview.viewDate);
    setEditingCompleted(toview.completed);
    setShowEditModal(true);
  };

  const saveEditModal = async () => {
    if (!editingItem || !editingText.trim()) return;

    const { category, displayText } = parseToviewText(editingText);
    const updatedToviews = toviews.map(toview => {
      if (toview.id === editingItem.id) {
        return {
          ...toview,
          text: editingText.trim(),
          category,
          displayText,
          viewDate: editingViewDate,
          completed: editingCompleted,
          completedDate: editingCompleted ? new Date().toISOString().split('T')[0] : undefined,
          sortTimeMs: Date.now()
        };
      }
      return toview;
    });
    setToviews(updatedToviews);
    await saveData(updatedToviews);
    setShowEditModal(false);
    setEditingItem(null);
    setEditingText('');
    setEditingViewDate('');
    setEditingCompleted(false);
    HapticFeedback.light();
  };

  const updateViewDate = (days: number) => {
    const currentDate = new Date(editingViewDate);
    currentDate.setDate(currentDate.getDate() + days);
    setEditingViewDate(currentDate.toISOString().split('T')[0]);
  };

  const setViewDateToToday = () => {
    setEditingViewDate(new Date().toISOString().split('T')[0]);
  };

  const selectQuickDate = (days: number) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + days);
    setEditingViewDate(newDate.toISOString().split('T')[0]);
  };

  const getCategoryIcon = (category?: string) => {
    if (!category) return '👁️';
    
    const lowerCategory = category.toLowerCase();
    switch (lowerCategory) {
      case 'movie': return '📽️';
      case 'book': return '📚';
      case 'show': return '📺';
      case 'music': return '🎵';
      case 'action movie': return '🎬';
      case 'game': return '🎮';
      case 'series': return '📺';
      case 'documentary': return '🎥';
      case 'anime': return '🎌';
      case 'podcast': return '🎧';
      default: return '👁️';
    }
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return colors.primary;
    
    const lowerCategory = category.toLowerCase();
    switch (lowerCategory) {
      case 'movie': return '#FF6B6B';
      case 'book': return '#4ECDC4';
      case 'show': return '#45B7D1';
      case 'music': return '#9B59B6';
      case 'action movie': return '#E74C3C';
      case 'game': return '#2ECC71';
      case 'series': return '#3498DB';
      case 'documentary': return '#F39C12';
      case 'anime': return '#E91E63';
      case 'podcast': return '#795548';
      default: return colors.primary;
    }
  };

  const getFilteredToviews = () => {
    let filtered = toviews;

    // Filter by category
    if (filterCategory) {
      filtered = filtered.filter(toview => toview.category === filterCategory);
    }

    // Always show future toviews (no date filtering)

    // Sort: incomplete by view date (ascending), then completed by completion date (descending)
    return filtered.sort((a, b) => {
      if (a.completed && b.completed) {
        return (b.completedDate || '').localeCompare(a.completedDate || '');
      }
      if (a.completed) return 1;
      if (b.completed) return -1;
      return a.viewDate.localeCompare(b.viewDate);
    });
  };

  const getCategories = () => {
    const categories = new Set(toviews.map(toview => toview.category).filter(Boolean));
    
    // Also include categories from the current input text
    if (newToviewText.trim()) {
      const { category } = parseToviewText(newToviewText);
      if (category) {
        categories.add(category);
      }
    }
    
    return Array.from(categories).sort();
  };

  const getStats = () => {
    const total = toviews.length;
    const completed = toviews.filter(toview => toview.completed).length;
    const pending = total - completed;
    return { total, completed, pending };
  };

  const stats = getStats();
  const filteredToviews = getFilteredToviews();
  const categories = getCategories();

  if (showSettings) {
    return <ToviewSettings onClose={onCloseSettings || (() => {})} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Toview</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {stats.completed} viewed • {stats.pending} pending
        </Text>
      </View>

      {/* Add new toview */}
      <View style={[styles.addContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TextInput
          style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
          placeholder="Add new Toview (use category: View)"
          placeholderTextColor={colors.textSecondary}
          value={newToviewText}
          onChangeText={setNewToviewText}
          onSubmitEditing={addToview}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={addToview}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: filterCategory === null ? colors.primary : colors.background, borderColor: colors.border }
            ]}
            onPress={() => {
              setFilterCategory(null);
              setNewToviewText('');
            }}
          >
            <Text style={[styles.filterButtonText, { color: filterCategory === null ? colors.background : colors.text }]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                { backgroundColor: filterCategory === category ? colors.primary : colors.background, borderColor: colors.border }
              ]}
              onPress={() => {
                setFilterCategory(category);
                setNewToviewText(`${category}: `);
                textInputRef.current?.focus();
              }}
            >
              <Text style={[styles.filterButtonText, { color: filterCategory === category ? colors.background : colors.text }]}>
                {getCategoryIcon(category)} {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Future toviews toggle removed - always show future toviews */}
      </View>

      {/* Toview list */}
      <ScrollView style={styles.listContainer}>
        {filteredToviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {filterCategory ? `No ${filterCategory.toLowerCase()}s to view` : 'No toviews yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Add a new toview to get started
            </Text>
          </View>
        ) : (
          filteredToviews.map(toview => (
            <View
              key={toview.id}
              style={[
                styles.toviewItem,
                { backgroundColor: colors.surface, borderColor: colors.border },
                toview.completed && styles.completedItem
              ]}
            >
              <TouchableOpacity
                style={styles.toviewContent}
                onPress={() => toggleToview(toview.id)}
                onLongPress={() => openEditModal(toview)}
              >
                <View style={styles.toviewLeft}>
                  <Text style={[styles.checkbox, { color: toview.completed ? colors.primary : colors.border }]}>
                    {toview.completed ? '✓' : '○'}
                  </Text>
                  <View style={styles.toviewTextContainer}>
                    {editingId === toview.id ? (
                      <TextInput
                        ref={textInputRef}
                        style={[styles.editInput, { color: colors.text }]}
                        value={editingText}
                        onChangeText={setEditingText}
                        onSubmitEditing={saveEdit}
                        onBlur={saveEdit}
                        autoFocus
                      />
                    ) : (
                      <>
                        <Text style={[styles.toviewText, { color: toview.completed ? colors.textSecondary : colors.text }]}>
                          {toview.displayText}
                        </Text>
                        {toview.category && (
                          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(toview.category) }]}>
                            <Text style={styles.categoryText}>
                              {getCategoryIcon(toview.category)} {toview.category}
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </View>
                <View style={styles.toviewRight}>
                  <Text style={[styles.viewDateText, { color: colors.textSecondary }]}>
                    {toview.viewDate}
                  </Text>
                </View>
              </TouchableOpacity>
              
              {/* Edit button removed - use long tap instead */}
            </View>
          ))
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Toview</Text>
            
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Toview text (Category: Name supported)"
              placeholderTextColor={colors.textSecondary}
              value={editingText}
              onChangeText={setEditingText}
              multiline={true}
              onSubmitEditing={saveEditModal}
              returnKeyType="done"
              blurOnSubmit={true}
            />

            {/* Viewed Toggle */}
            <View style={styles.doneToggleSection}>
              <Text style={[styles.doneToggleLabel, { color: colors.text }]}>Viewed</Text>
              <TouchableOpacity
                style={[styles.doneToggle, editingCompleted && styles.doneToggleActive]}
                onPress={() => setEditingCompleted(!editingCompleted)}
              >
                <Text style={[styles.doneToggleText, editingCompleted && styles.doneToggleTextActive]}>
                  {editingCompleted ? '✓' : ''}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickDateSection}>
              <Text style={[styles.quickDateTitle, { color: colors.text }]}>View Date</Text>
              <View style={styles.quickDateButtons}>
                {[
                  { label: 'Today', days: 0 },
                  { label: '+1 Day', days: 1 },
                  { label: '+1 Week', days: 7 },
                ].map((option) => {
                  const optionDate = new Date();
                  optionDate.setDate(optionDate.getDate() + option.days);
                  const optionDateString = optionDate.toISOString().split('T')[0];
                  const isSelected = editingViewDate === optionDateString;

                  return (
                    <TouchableOpacity
                      key={option.label}
                      style={[styles.quickDateButton, isSelected && styles.selectedDateButton]}
                      onPress={() => selectQuickDate(option.days)}
                    >
                      <Text style={[styles.quickDateButtonText, isSelected && styles.selectedDateButtonText]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Manual Date Input */}
              <Text style={[styles.manualDateLabel, { color: colors.text }]}>Or enter date manually (YYYY-MM-DD):</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="2024-12-25"
                placeholderTextColor={colors.textSecondary}
                value={editingViewDate}
                onChangeText={setEditingViewDate}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={() => {
                  if (editingItem) {
                    Alert.alert(
                      'Delete Toview',
                      `Are you sure you want to delete "${editingItem.displayText}"?`,
                      [
                        {
                          text: 'Cancel',
                          style: 'cancel',
                        },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            const updatedToviews = toviews.filter(toview => toview.id !== editingItem.id);
                            setToviews(updatedToviews);
                            saveData(updatedToviews);
                            setShowEditModal(false);
                            setEditingItem(null);
                            HapticFeedback.light();
                          },
                        },
                      ]
                    );
                  }
                }}
              >
                <Text style={styles.deleteButtonText}>✕</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveEditModal}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  addContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginRight: 12,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  filtersContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  filtersScroll: {
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  toviewItem: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  completedItem: {
    opacity: 0.6,
  },
  toviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  toviewLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    fontSize: 20,
    marginRight: 12,
  },
  toviewTextContainer: {
    flex: 1,
  },
  toviewText: {
    fontSize: 16,
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  toviewRight: {
    alignItems: 'flex-end',
  },
  viewDateText: {
    fontSize: 14,
  },
  editInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
  },
  toviewActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  dateSection: {
    marginBottom: 24,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  currentDate: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  dateButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // New styles for improved EditModal
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 44,
  },
  doneToggleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  doneToggleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  doneToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneToggleActive: {
    backgroundColor: '#007AFF',
  },
  doneToggleText: {
    fontSize: 16,
    color: 'transparent',
  },
  doneToggleTextActive: {
    color: 'white',
  },
  quickDateSection: {
    marginBottom: 24,
  },
  quickDateTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickDateButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickDateButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedDateButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  quickDateButtonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedDateButtonText: {
    color: 'white',
  },
  manualDateLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});

export default ToviewSpark;
