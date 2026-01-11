# RecAIpe Spark Improvement Plan

## Overview
This document outlines the improvements needed for `RecAIpeSpark.tsx` to enhance user experience, fix keyboard interference issues, and improve visual spacing.

## Issues to Address

### 1. Navigation: Move "Back to Recipes" to Top Header
**Current State:**
- "Back to Recipes" button appears at the bottom of the view screen (line 862-867)
- Users must scroll down to access navigation

**Desired State:**
- Add a back button/arrow in the top header (similar to TripStorySpark pattern)
- Should appear in all non-list views (view, edit, refine, shop, cook, preview, create)
- Use left arrow (←) or back icon in header row

**Implementation:**
- Modify header style to include back button on left side
- Add `TouchableOpacity` with back arrow in header
- Remove bottom "Back to Recipes" button from view mode
- Apply consistent header pattern across all modes

**Reference Pattern:**
- See `TripStorySpark.tsx` lines 3498-3522 for header with back button example
- See `GoalTrackerSpark.tsx` lines 1060-1064 for simple back button in header

---

### 2. Keyboard Interference with Save Button
**Current State:**
- Edit Recipe screen (line 699-744) has TextInput but no KeyboardAvoidingView
- Refine Recipe screen (line 748-797) has TextInput but no KeyboardAvoidingView
- Save buttons can be hidden behind keyboard when typing

**Desired State:**
- Wrap ScrollView content in KeyboardAvoidingView
- Ensure Save button remains accessible above keyboard
- Use proper keyboardVerticalOffset for iOS/Android differences

**Implementation:**
- Import `KeyboardAvoidingView` and `Platform` from react-native
- Wrap ScrollView in KeyboardAvoidingView with:
  - `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`
  - `keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}`
- Apply to Edit Recipe and Refine Recipe screens
- Add `keyboardShouldPersistTaps="handled"` to ScrollView

**Reference Pattern:**
- See `TeeTimeTimerSettings` component (lines 646-649) for KeyboardAvoidingView usage

---

### 3. Add White Space Before Bottom Navigation
**Current State:**
- Final buttons on screens are too close to bottom navigation bar
- Screens feel crowded, especially on view, edit, refine screens
- No padding/margin at bottom of ScrollView content

**Desired State:**
- Add consistent bottom padding to ScrollView contentContainerStyle
- Minimum 40-60px spacing between last button and bottom navigation
- Use safe area insets to account for device-specific navigation bars

**Implementation:**
- Add `paddingBottom` to ScrollView `contentContainerStyle`
- Use `useSafeAreaInsets` hook for proper spacing
- Apply consistent spacing across all modes:
  - View Recipe: Add paddingBottom to contentContainerStyle
  - Edit Recipe: Add paddingBottom to contentContainerStyle
  - Refine Recipe: Add paddingBottom to contentContainerStyle
  - Preview Recipe: Add paddingBottom to contentContainerStyle
  - Shopping Mode: Add paddingBottom to contentContainerStyle
  - Cooking Mode: Add paddingBottom to contentContainerStyle
  - Create Mode: Add paddingBottom to contentContainerStyle

**Reference Pattern:**
- See `SoundboardSpark.tsx` for ScrollView with proper bottom padding
- Use `Math.max(insets.bottom + 20, 40)` for consistent spacing

---

### 4. Update Prompt: Each Sentence as Paragraph
**Current State:**
- System prompt (lines 170-195) instructs: "Write instructions as clear paragraphs, with each major step as a separate paragraph. Paragraphs are typically 1 or 2 sentences long for these instructions."
- This allows multiple sentences per paragraph

**Desired State:**
- Each sentence should be its own paragraph
- Instructions should be more granular, easy to follow, and easy to check off when complete
- Better for step-by-step cooking guidance

**Implementation:**
- Update system prompt line 178 to: "Write instructions as clear paragraphs, with each sentence as its own separate paragraph. Each instruction step should be broken down into individual sentences, making it easy to follow step-by-step."
- Update example format to show single-sentence paragraphs
- Ensure parsing logic (line 226) handles single-sentence paragraphs correctly (already uses `\n\n` split which should work)

**Example Format Update:**
```
Instructions
Preheat your oven to 375°F (190°C).

Line two baking sheets with parchment paper.

In a large bowl, cream together the unsalted butter (1 cup/2 sticks), the packed brown sugar (1 cup), and the granulated sugar (1/2 cup) using an electric mixer until light and fluffy.
```

---

## Implementation Checklist

### Phase 1: Navigation Header
- [ ] Add back button to header for all non-list modes
- [ ] Style header with back button on left, title in center
- [ ] Remove bottom "Back to Recipes" button from view mode
- [ ] Test navigation flow across all modes

### Phase 2: Keyboard Handling
- [ ] Import KeyboardAvoidingView and Platform
- [ ] Wrap Edit Recipe ScrollView in KeyboardAvoidingView
- [ ] Wrap Refine Recipe ScrollView in KeyboardAvoidingView
- [ ] Test keyboard behavior on iOS and Android
- [ ] Ensure Save button remains accessible

### Phase 3: Spacing Improvements
- [ ] Import useSafeAreaInsets hook
- [ ] Add paddingBottom to all ScrollView contentContainerStyle
- [ ] Use safe area insets for proper bottom spacing
- [ ] Verify spacing on all screens
- [ ] Test on devices with different navigation bar heights

### Phase 4: Prompt Update
- [ ] Update system prompt for single-sentence paragraphs
- [ ] Update example format in prompt
- [ ] Test recipe generation with new prompt format
- [ ] Verify parsing logic handles single-sentence paragraphs correctly

---

## Files to Modify

1. **src/sparks/RecAIpeSpark.tsx**
   - Add imports: `KeyboardAvoidingView`, `Platform`, `useSafeAreaInsets`
   - Modify header rendering for all modes
   - Add KeyboardAvoidingView wrappers
   - Update ScrollView contentContainerStyle
   - Update system prompt text

---

## Testing Checklist

- [ ] Navigation: Back button works from all screens
- [ ] Navigation: Back button appears in header (not bottom)
- [ ] Keyboard: Save button accessible when keyboard is open (Edit screen)
- [ ] Keyboard: Save button accessible when keyboard is open (Refine screen)
- [ ] Spacing: Adequate space between last button and bottom nav on all screens
- [ ] Spacing: Works correctly on devices with different navigation bar heights
- [ ] Prompt: Generated recipes have single-sentence paragraphs
- [ ] Prompt: Instructions are easy to follow step-by-step
- [ ] Visual: Screens no longer feel crowded

---

## Notes

- The header pattern should be consistent across all modes for better UX
- KeyboardAvoidingView behavior differs between iOS and Android - test on both
- Safe area insets ensure proper spacing on all device types (notch, home indicator, etc.)
- Single-sentence paragraphs will make instructions more granular and easier to follow during cooking
