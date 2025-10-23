import React, { useState, useRef } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, Animated, PanResponder, FlatList } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MySparkStackParamList } from '../types/navigation';
import { getAllSparks, getSparkById } from '../components/SparkRegistry';
import { useSparkStore } from '../store';
import { useTheme } from '../contexts/ThemeContext';
import { HapticFeedback } from '../utils/haptics';

type SparkSelectionNavigationProp = StackNavigationProp<MySparkStackParamList, 'MySparksList'>;

interface Props {
  navigation: SparkSelectionNavigationProp;
}

// Draggable Spark Item Component
const DraggableSparkItem: React.FC<{
  spark: any;
  index: number;
  onMove: (fromIndex: number, toIndex: number) => void;
  totalSparks: number;
  onDragStart: () => void;
  onDragEnd: () => void;
  onPress: () => void;
  isReordering: boolean;
  colors: any;
}> = ({ spark, index, onMove, totalSparks, onDragStart, onDragEnd, onPress, isReordering, colors }) => {
  const [isDragging, setIsDragging] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isReordering,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return isReordering && Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        console.log('Drag started, isReordering:', isReordering);
        if (!isReordering) return;
        setIsDragging(true);
        onDragStart();
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        if (!isReordering) return;
        pan.setValue({ x: 0, y: gestureState.dy });
      },
      onPanResponderRelease: (_, gestureState) => {
        console.log('Drag ended, isReordering:', isReordering, 'dy:', gestureState.dy);
        if (!isReordering) return;
        setIsDragging(false);
        onDragEnd();
        pan.flattenOffset();

        // Calculate new position based on gesture - each item is roughly 120px tall (including margins)
        const itemHeight = 120;
        const moved = Math.round(gestureState.dy / itemHeight);
        const newIndex = Math.max(0, Math.min(index + moved, totalSparks - 1));

        console.log(`Drag calculation: dy=${gestureState.dy}, itemHeight=${itemHeight}, moved=${moved}, fromIndex=${index}, toIndex=${newIndex}`);

        // Only reorder if moved to a different position and gesture was significant
        if (newIndex !== index && Math.abs(gestureState.dy) > 30) {
          console.log(`Executing move: item ${index} to ${newIndex}`);
          onMove(index, newIndex);
          HapticFeedback.success();
        } else {
          console.log(`No move: newIndex=${newIndex}, index=${index}, dy=${gestureState.dy}`);
        }

        // Reset position with animation
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          tension: 300,
          friction: 10,
        }).start();
      },
    })
  ).current;

  const itemStyles = StyleSheet.create({
    sparkCard: {
      width: isReordering ? '100%' : '31%',
      aspectRatio: isReordering ? 3 : 1.1,
      marginBottom: 16,
      marginHorizontal: isReordering ? 0 : '1%',
      backgroundColor: colors.surface,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDragging ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: isDragging ? 8 : 2,
      transform: isDragging ? [{ scale: 1.05 }] : [{ scale: 1 }],
    },
    sparkCardContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: isReordering ? 'flex-start' : 'center',
      padding: 12,
      flexDirection: isReordering ? 'row' : 'column',
    },
    sparkIcon: {
      fontSize: 32,
      marginBottom: isReordering ? 0 : 8,
      marginRight: isReordering ? 12 : 0,
    },
    sparkTitle: {
      fontSize: isReordering ? 16 : 12,
      fontWeight: '600',
      textAlign: isReordering ? 'left' : 'center',
      color: colors.text,
      lineHeight: isReordering ? 20 : 16,
      flex: isReordering ? 1 : undefined,
    },
    dragHandle: {
      position: isReordering ? 'relative' : 'absolute',
      top: isReordering ? 0 : 8,
      right: isReordering ? 0 : 8,
      fontSize: 20,
      color: colors.textSecondary,
      alignSelf: isReordering ? 'center' : 'auto',
      marginLeft: isReordering ? 12 : 0,
    },
  });

  return (
    <Animated.View
      style={[
        itemStyles.sparkCard,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={itemStyles.sparkCardContent}
        onPress={onPress}
        disabled={isReordering}
        activeOpacity={0.7}
      >
        <Text style={itemStyles.sparkIcon}>{spark.metadata.icon}</Text>
        <Text style={itemStyles.sparkTitle} numberOfLines={2}>
          {spark.metadata.title}
        </Text>
        {isReordering && (
          <Text style={itemStyles.dragHandle}>☰</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};


export const SparkSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const { getUserSparks, reorderUserSparks } = useSparkStore();
  const { colors } = useTheme();
  const [isReordering, setIsReordering] = useState(false);
  const [isAnyItemDragging, setIsAnyItemDragging] = useState(false);
  const userSparkIds = getUserSparks();
  
  // Filter to only show user's sparks
  const userSparks = userSparkIds.map(sparkId => getSparkById(sparkId)).filter(Boolean);

  const handleLongPress = (index: number) => {
    if (userSparks.length <= 1) return; // Can't reorder with 1 or fewer items
    
    console.log('Long press triggered, entering reorder mode');
    setIsReordering(true);
    HapticFeedback.medium();
  };

  const handleMoveSpark = (fromIndex: number, toIndex: number) => {
    console.log(`Moving spark from index ${fromIndex} to ${toIndex}`);
    if (fromIndex === toIndex) return;
    
    reorderUserSparks(fromIndex, toIndex);
    console.log('Spark reordered successfully');
  };

  const handleDragStart = () => {
    setIsAnyItemDragging(true);
  };

  const handleDragEnd = () => {
    setIsAnyItemDragging(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 24,
      paddingTop: 60, // Additional spacing for iOS Dynamic Island
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 26,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    grid: {
      flex: 1,
      padding: 24,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    verticalList: {
      flex: 1,
      padding: 24,
      flexDirection: 'column',
    },
    sparkCard: {
      width: '31%',
      aspectRatio: 1.1,
      marginBottom: 16,
      marginHorizontal: '1%',
      backgroundColor: colors.surface,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sparkCardContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    sparkIcon: {
      fontSize: 36,
      marginBottom: 6,
    },
    sparkTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    reorderHint: {
      fontSize: 12,
      color: colors.primary,
      textAlign: 'center',
      marginTop: 8,
      fontStyle: 'italic',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    discoverButton: {
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 12,
    },
    discoverButtonText: {
      fontSize: 18,
      fontWeight: '600',
    },
    reorderButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    reorderButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    doneButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    doneButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>My Sparks</Text>
          {isReordering ? (
            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: colors.primary }]}
              onPress={() => setIsReordering(false)}
            >
              <Text style={[styles.doneButtonText, { color: colors.background }]}>
                Done
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.reorderButton, { backgroundColor: colors.secondary }]}
              onPress={() => {
                console.log('Reorder button pressed, entering reorder mode');
                setIsReordering(true);
              }}
            >
              <Text style={[styles.reorderButtonText, { color: colors.background }]}>
                Reorder
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.subtitle}>
          {userSparks.length === 0 
            ? 'No sparks yet - discover some in the marketplace!' 
            : `${userSparks.length} spark${userSparks.length !== 1 ? 's' : ''} in your collection`
          }
        </Text>
        {isReordering && (
          <Text style={[styles.subtitle, { color: colors.primary, fontWeight: 'bold' }]}>
            Drag the ☰ handles to reorder sparks
          </Text>
        )}
      </View>
      
      {userSparks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✨</Text>
          <Text style={styles.emptyTitle}>Your collection is empty</Text>
          <Text style={styles.emptySubtitle}>
            Discover amazing sparks in the marketplace and add them to your collection
          </Text>
          <TouchableOpacity
            style={[styles.discoverButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Marketplace')}
          >
            <Text style={[styles.discoverButtonText, { color: colors.background }]}>
              Discover Sparks
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView scrollEnabled={!isReordering}>
          <View style={isReordering ? styles.verticalList : styles.grid}>
            {userSparks.map((spark, index) => {
              if (!spark) return null;
              
              return (
                <DraggableSparkItem
                  key={`${spark.metadata.id}-${index}`}
                  spark={spark}
                  index={index}
                  onMove={handleMoveSpark}
                  totalSparks={userSparks.length}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onPress={() => {
                    if (spark.metadata.available && !isReordering) {
                      navigation.navigate('Spark', { sparkId: spark.metadata.id });
                    }
                  }}
                  isReordering={isReordering}
                  colors={colors}
                />
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
};