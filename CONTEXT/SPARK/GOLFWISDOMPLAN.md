# Golf Wisdom Implementation Plan

## Overview
Create a silly book-style Spark displaying golf wisdom from Tam O'Shanter. Each "chapter" is actually just a single page with a quote. The content is stored in Firebase Firestore with local caching for offline access and automatic updates.

---

## User Experience

### Book Structure
1. **Title Page** (hardcoded) - Opens when spark first loads
2. **Wisdom Pages** - Each page is a "chapter" with a single silly golf quote
3. **Acknowledgements Page** (hardcoded) - "This epic work is the result of contributions from many golfers. John Hart was not one of them."

### Visual Design
- **Book-like interface** with elegant typography
- **Full-screen reading experience** with minimal distractions
- **One quote per page** - simple and focused
- **Left/right arrow navigation** for moving between pages
- **Page indicator** showing current position (e.g., "Page 3 of 25")
- **Smooth page transitions** with subtle animations

### Navigation
- **Left arrow** (←) - Previous page
- **Right arrow** (→) - Next page
- **Disable arrows** at boundaries (title page / acknowledgements page)
- **Swipe gestures** for mobile-friendly navigation
- **Pages**: Title → Wisdom 1 → Wisdom 2 → ... → Wisdom N → Acknowledgements

---

## Content Management Strategy

### Firebase Firestore Structure
```
golfWisdom/
  └── pages/
      ├── page_001
      ├── page_002
      ├── page_003
      └── ...
```

Each page document:
```typescript
{
  id: number,
  content: string,  // The golf wisdom quote
  order: number,    // Display order
  updatedAt: timestamp
}
```

### Local Caching Strategy
1. **On app load**: Check Firestore for content version/timestamp
2. **If newer content exists**: Download and cache locally (AsyncStorage)
3. **If offline or no update**: Use cached content
4. **Fallback**: If no cache and offline, show placeholder message

### Update Flow
```
App Launch
  ↓
Check Firestore for latest timestamp
  ↓
Compare with local cache timestamp
  ↓
If newer → Download all pages → Update cache
  ↓
If same → Use cached pages
  ↓
Display content
```

---

## Technical Architecture

### Component Structure
```
GolfWisdomSpark/
├── GolfWisdomSpark.tsx       # Main component
├── components/
│   ├── TitlePage.tsx         # Hardcoded title page
│   ├── WisdomPage.tsx        # Single wisdom quote display
│   ├── AcknowledgementsPage.tsx  # Hardcoded acknowledgements
│   ├── NavigationArrows.tsx  # Left/right navigation
│   └── PageIndicator.tsx     # Page number display
├── services/
│   └── wisdomService.ts      # Firebase + cache management
└── styles/
    └── golfWisdomStyles.ts   # Component styles
```

### Data Model
```typescript
interface WisdomPage {
  id: number;
  content: string;
  order: number;
  updatedAt: Date;
}

interface GolfWisdomState {
  currentPageIndex: number;  // 0 = title, 1-N = wisdom, N+1 = acknowledgements
  wisdomPages: WisdomPage[];
  isLoading: boolean;
  lastUpdated: Date | null;
}
```

---

## Content Structure

### Page Types

#### 1. Title Page (Hardcoded)
```
Golf Wisdom
by Tam O'Shanter

[Beautiful golf-themed graphic or simple text]
```

#### 2. Wisdom Pages (Firebase)
Each page contains a single silly golf quote:
```
"[Golf wisdom quote here]"

- Jerry
```

#### 3. Acknowledgements Page (Hardcoded)
```
Acknowledgements

This epic work is the result of 
contributions from many golfers.

John Hart was not one of them.
```

### Initial Content (5 Quotes to Start)
1. "Hit more good shots, less bad shots."
2. "The fairway is your friend."
3. "Hitting the ball in the center of your club face costs you nothing - do not be afraid to do it!"
4. "Practice does not make perfect. Perfect practice makes perfect."
5. "The ball does not know how much you paid for your clubs."

---

## Admin Access

### Request Admin Rights
- Add option in **Settings page**: "Request Admin Rights"
- Opens email to: `matt@dyor.com`
- Subject: "Golf Wisdom Admin"
- Body: Device ID of the phone
- Use same methodology as main Sparks settings feedback

### Admin Capabilities
Once granted admin access (device ID whitelisted):
- Add new wisdom quotes
- Edit existing quotes
- Reorder quotes
- Delete quotes
- Publish updates to all users

---

## Features

### Phase 1 (MVP)
- ✅ Firebase Firestore integration for wisdom content
- ✅ Local caching with AsyncStorage
- ✅ Auto-update check on app load
- ✅ Hardcoded title and acknowledgements pages
- ✅ Display wisdom pages with beautiful typography
- ✅ Left/right arrow navigation
- ✅ Page indicator (e.g., "Page 3 of 25")
- ✅ Persist last read page
- ✅ Responsive design for all screen sizes
- ✅ Offline support with cached content

### Phase 2 (Future Enhancements)
- 📤 Share pages as images (not needed yet - users can screenshot)
- 🔖 Bookmark favorite pages
- 🎨 Customizable font size
- 🌙 Dark mode optimized reading
- 📊 Admin panel to add/edit wisdom in Firestore

---

## UI Components

### TitlePage
- Large, elegant title "Golf Wisdom"
- Subtitle "by Tam O'Shanter"
- Centered layout
- Golf-themed accent (⛳ icon or simple graphic)
- Tap anywhere or use arrow to continue

### WisdomPage
- Large, readable quote (20-24px)
- Centered content with generous margins
- Quote marks for visual appeal
- Attribution "- Tam O'Shanter" at bottom
- Clean, uncluttered design

### AcknowledgementsPage
- Title "Acknowledgements"
- Centered text
- Same elegant typography as other pages
- Humorous content about John Hart

### NavigationArrows
- Fixed position (left and right edges)
- Large touch targets (60x60px minimum)
- Subtle when inactive (#999)
- Prominent when active (golf green)
- Disabled state when at boundaries
- Smooth hover/press animations

### PageIndicator
- Bottom center position
- Small, unobtrusive text (14px)
- Shows "Page X of Y"
- Updates as user navigates

---

## Styling Theme

### Colors
- **Background**: Warm cream/parchment (#F5F1E8)
- **Text**: Deep charcoal (#2C2C2C)
- **Accent**: Golf green (#2D5016)
- **Arrows inactive**: Light gray (#999)
- **Arrows active**: Golf green (#2D5016)

### Typography
- **Title page**: Serif font, 32px, bold
- **Wisdom quotes**: Serif font (Georgia, Garamond), 20-24px
- **Attribution**: Italic, 18px, lighter weight
- **Page indicator**: Sans-serif, 14px
- **Acknowledgements**: Serif font, 18px

### Spacing
- **Page margins**: 32-40px
- **Line height**: 1.8
- **Quote padding**: Generous whitespace around quotes

---

## Data Persistence

### AsyncStorage Keys
- `golfWisdom_currentPage` - Last read page index
- `golfWisdom_cachedPages` - Cached wisdom pages from Firestore
- `golfWisdom_lastUpdated` - Timestamp of last content update
- `golfWisdom_contentVersion` - Version number for cache invalidation

### Firestore Collection
- **Collection**: `golfWisdom`
- **Document**: `metadata` - Contains version and update timestamp
- **Subcollection**: `pages` - Individual wisdom pages

---

## Implementation Steps

### Step 1: Set Up Firebase Service
1. Create `wisdomService.ts` in services folder
2. Implement Firestore connection
3. Add functions:
   - `fetchWisdomPages()` - Get all pages from Firestore
   - `checkForUpdates()` - Compare local vs remote timestamps
   - `cachePages()` - Save pages to AsyncStorage
   - `getCachedPages()` - Load pages from AsyncStorage

### Step 2: Create Data Models
1. Define TypeScript interfaces for WisdomPage
2. Define state interface for GolfWisdomState
3. Create hardcoded title and acknowledgements content

### Step 3: Build Core Component
1. Create `GolfWisdomSpark.tsx`
2. Implement state management with useState
3. Add useEffect for loading/syncing content
4. Set up page navigation logic
5. Add persistence for current page

### Step 4: Build UI Components
1. Create `TitlePage.tsx` component
2. Create `WisdomPage.tsx` component
3. Create `AcknowledgementsPage.tsx` component
4. Create `NavigationArrows.tsx` component
5. Create `PageIndicator.tsx` component
6. Apply styling to all components

### Step 5: Implement Content Sync
1. On component mount, check for cached content
2. Display cached content immediately (if available)
3. Check Firestore for updates in background
4. If updates found, download and refresh
5. Show loading state during initial load

### Step 6: Add Interactions
1. Implement arrow click handlers
2. Add swipe gesture support (PanResponder)
3. Handle page boundaries (disable arrows at edges)
4. Add smooth page transitions

### Step 7: Polish & Test
1. Refine typography and spacing
2. Add smooth page transitions
3. Test offline functionality
4. Test update mechanism
5. Test on different screen sizes

### Step 8: Register Spark
1. Add to SparkRegistry
2. Use icon: 📖 or ⛳
3. Write description: "Inspirational golf wisdom from Tam O'Shanter"
4. Set category to 'golf'

---

## Open Questions & Decisions

### ✅ All Resolved
- **Content Source**: Firebase Firestore with local caching ✓
- **Page Count**: Start with 5 quotes, can grow over time ✓
- **Sharing**: Not needed yet - users can screenshot ✓
- **Page Structure**: Title → Wisdom pages → Acknowledgements ✓
- **Firebase Structure**: Separate Firestore collection `golfWisdom` ✓
- **Admin Access**: Request via Settings page email to matt@dyor.com with device ID ✓
- **Update Frequency**: On app launch only ✓

### Initial Quotes (3 confirmed, need 2 more)
1. ✅ "Hit more good shots, less bad shots."
2. ✅ "The fairway is your friend."
3. ✅ "Hitting the ball in the center of your club face costs you nothing - do not be afraid to do it!"
4. ❓ [Need one more quote from Jerry]
5. ❓ [Need one more quote from Jerry]

---

## Success Metrics

- Users can easily navigate between pages
- Reading experience feels premium and distraction-free
- Last read position is always saved
- Content syncs seamlessly from Firebase
- Offline mode works with cached content
- Works beautifully on all device sizes
- Users find the silly wisdom entertaining and return to read more

---

## Timeline Estimate

- **Firebase service setup**: 2-3 hours
- **Data models & caching**: 1-2 hours
- **Core component & state**: 2-3 hours
- **UI components (3 page types)**: 3-4 hours
- **Navigation & interactions**: 2 hours
- **Content sync logic**: 2-3 hours
- **Testing & polish**: 2 hours
- **Spark registration**: 1 hour

**Total**: ~15-20 hours of development time

### Phased Approach
**Phase 1** (MVP - 8-10 hours):
- Hardcoded title and acknowledgements
- Local-only wisdom pages (no Firebase yet)
- Basic navigation
- Simple styling

**Phase 2** (Firebase Integration - 7-10 hours):
- Firebase service
- Content sync
- Caching
- Update mechanism
