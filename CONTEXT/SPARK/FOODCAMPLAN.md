# FoodCam Spark Implementation Plan

## 🍕 Overview
FoodCam is a visual food diary spark that allows users to photograph their meals and beverages, organizing them chronologically in a beautiful, scrollable interface. Users can track their eating habits visually and maintain links to original photos in their camera roll.

## 🎯 Core Features

### Primary Functionality
1. **Quick Photo Capture**: Large "Snap" button for immediate photo taking
2. **Daily Organization**: Photos grouped by day with clear date headers
3. **Thumbnail Grid**: Clean grid layout showing food photos for each day
4. **Camera Roll Integration**: Links to original photos for full-size viewing
5. **Chronological Scrolling**: Infinite scroll through food history

### User Experience Flow
```
Launch FoodCam → See Today's Photos + "Snap" Button →
Tap "Snap" → Camera Interface → Take Photo →
Photo Appears as Thumbnail → Continue Taking Photos →
Scroll Down to See Previous Days
```

## 🏗️ Technical Architecture

### Required Dependencies
- `expo-image-picker`: For camera access and photo selection
- `expo-media-library`: For saving to camera roll and accessing metadata
- `expo-file-system`: For local file management and thumbnails
- Additional: Image manipulation for thumbnails

### Data Structure
```typescript
interface FoodPhoto {
  id: string;
  uri: string;            // Local thumbnail path
  originalUri?: string;   // Camera roll asset URI
  timestamp: number;      // Photo taken time
  date: string;          // YYYY-MM-DD format
}

interface FoodCamData {
  photos: FoodPhoto[];
  settings: {
    saveToGallery: boolean;
    thumbnailSize: 'small' | 'medium' | 'large';
  };
}
```

### Component Architecture
```
FoodCamSpark.tsx
├── Header (Today's date, settings button)
├── SnapButton (Large photo capture button)
├── DailyPhotoGrid (Grouped photos by day)
│   ├── DayHeader (Date formatting)
│   └── PhotoThumbnail (Individual photo with tap handler)
└── Settings Modal (Camera/gallery preferences)
```

## 📱 UI/UX Design

### Layout Structure
1. **Header Section**:
   - Today's date prominently displayed
   - Settings gear icon (top right)
   - Photo count for today

2. **Snap Section**:
   - Large, prominent "Snap" button (camera icon + text)
   - Subtle animation/haptic feedback on press
   - Camera permission status indicator

3. **Photo Timeline**:
   - Day headers: "Today", "Yesterday", "Monday, Sep 21", etc.
   - 3-column grid of square thumbnails
   - Smooth scrolling with lazy loading
   - Empty state: "No photos yet today" with illustration

4. **Photo Interaction**:
   - Tap thumbnail → Full screen view with option to open in Photos app
   - Long press → Context menu (delete, share, view in Photos)

### Design Patterns Following SparksApp
- Use `useTheme()` for colors and dark/light mode
- Follow existing `StyleSheet.create()` patterns
- Implement haptic feedback with `HapticFeedback.light()`
- Use safe area handling consistent with other sparks
- Store data via `useSparkStore()` persistence

## 🔧 Implementation Steps

### Phase 1: Basic Setup (Core Structure)
1. **Create FoodCamSpark.tsx**:
   - Basic component structure with SparkProps interface
   - Theme integration and styling foundation
   - Register in SparkRegistry.tsx

2. **Install Dependencies**:
   ```bash
   npx expo install expo-image-picker expo-media-library expo-file-system
   ```

3. **Permission Handling**:
   - Request camera and media library permissions
   - Handle permission denied states gracefully
   - Show appropriate messaging for permission requirements

### Phase 2: Camera Integration
1. **Snap Button Implementation**:
   - Large, accessible button design
   - Camera launch functionality
   - Handle both camera and gallery options

2. **Photo Capture Flow**:
   - Launch camera with appropriate options (quality, aspect ratio)
   - Handle photo capture result
   - Generate thumbnail for display
   - Save original to camera roll (optional setting)

3. **Error Handling**:
   - Camera unavailable scenarios
   - Storage permission issues
   - Network/processing errors

### Phase 3: Photo Storage & Display
1. **Data Management**:
   - Store photo metadata in SparkStore
   - Generate and cache thumbnails locally
   - Implement cleanup for old thumbnails

2. **Grid Display**:
   - Daily grouping logic with date headers
   - Responsive 3-column grid layout
   - Thumbnail loading and caching
   - Smooth scrolling performance

3. **Date Formatting**:
   - "Today", "Yesterday" for recent days
   - "Monday, Sep 21" for this week
   - "Sep 21, 2024" for older dates

### Phase 4: Advanced Features
1. **Photo Interaction**:
   - Full-screen photo viewer
   - Integration with device Photos app
   - Share functionality

2. **Settings & Customization**:
   - Toggle save to camera roll
   - Thumbnail size preferences
   - Data export options

3. **Performance Optimization**:
   - Lazy loading for large photo collections
   - Thumbnail compression and caching
   - Memory management for images

## 🔒 Permissions & Privacy

### Required Permissions
- **Camera**: For taking new photos
- **Media Library**: For saving to camera roll and accessing photo metadata
- **File System**: For local thumbnail storage

### Privacy Considerations
- All photos stored locally on device
- No cloud storage or external sharing without user consent
- Clear messaging about camera roll access
- Option to disable camera roll saving

## 🎨 Visual Design Specifications

### Color Scheme (Following Theme)
- Background: `colors.background`
- Cards: `colors.surface`
- Text: `colors.text`
- Accent: `colors.primary`
- Subtle borders: `colors.border`

### Typography
- Day headers: Large, bold text
- Photo counts: Secondary text color
- Snap button: Bold, prominent text

### Spacing & Layout
- Grid gap: 8px between thumbnails
- Day sections: 24px vertical spacing
- Snap button: 60px height, full width with margins
- Safe area padding throughout

## 🧪 Testing Considerations

### Key Test Scenarios
1. **Camera Integration**:
   - Camera permission flow
   - Photo capture and thumbnail generation
   - Different device orientations

2. **Data Persistence**:
   - Photo storage across app restarts
   - Large photo collections performance
   - Thumbnail cache management

3. **Edge Cases**:
   - No camera available (simulator)
   - Storage full scenarios
   - Permission revocation handling

## 🚀 Success Metrics

### User Experience Goals
- **Speed**: < 2 seconds from tap to photo saved
- **Reliability**: 99%+ photo capture success rate
- **Performance**: Smooth scrolling with 100+ photos
- **Accessibility**: VoiceOver support for all interactions

### Technical Goals
- Clean integration with existing SparksApp architecture
- Minimal impact on app bundle size
- Efficient memory usage for photo handling
- Consistent theme and styling patterns

## 📝 Future Enhancements (Post-MVP)

### Potential Features
1. **AI-Powered Tagging**: Automatic food recognition and categorization
2. **Nutrition Integration**: Calorie estimation and nutritional insights
3. **Meal Planning**: Recipe suggestions based on photo history
4. **Social Features**: Share favorite meals with friends
5. **Analytics**: Weekly/monthly eating pattern insights
6. **Search & Filter**: Find specific foods or meals
7. **Export Options**: Create photo albums or PDF reports

### Technical Improvements
1. **Cloud Backup**: Optional cloud storage for photos
2. **Advanced Compression**: Better thumbnail generation
3. **Gesture Controls**: Swipe actions for photo management
4. **Widget Support**: Quick camera access from home screen

## 🔄 Integration with SparksApp Ecosystem

### SparkRegistry Entry
```typescript
'food-cam': {
  metadata: {
    id: 'food-cam',
    title: 'FoodCam',
    description: 'Visual food diary with photo timeline and camera integration',
    icon: '📸',
    category: 'utility',
    difficulty: 'medium',
    estimatedTime: 15,
    available: true,
  },
  component: FoodCamSpark,
}
```

### Data Storage Pattern
- Uses existing `useSparkStore()` infrastructure
- Follows same persistence patterns as TodoSpark
- Maintains data integrity across app updates

This comprehensive plan provides a roadmap for implementing FoodCam as a sophisticated yet user-friendly addition to the SparksApp ecosystem, maintaining consistency with existing patterns while introducing powerful new functionality.