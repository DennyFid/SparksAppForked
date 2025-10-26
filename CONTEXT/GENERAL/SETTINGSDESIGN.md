# Settings Design Guidelines

## Overview
This document establishes consistent design patterns, UX principles, and visual standards for all settings pages across Sparks. These guidelines ensure a unified user experience while allowing for spark-specific functionality where truly necessary.

## Visual Hierarchy & Layout

### Page Structure
```
Header (Icon + Title + Subtitle)
   ↓
Feedback & Rating Section (ALWAYS FIRST)
   ↓
Settings Sections (grouped logically)
   ↓
Action Buttons (Save/Cancel at bottom)
```

### Feedback & Rating Section (Required)
Every settings page MUST include a feedback section as the first content after the header:
- **Position**: Immediately after SettingsHeader, before any other sections
- **Component**: Use `SettingsFeedbackSection` from SettingsComponents.tsx
- **Content**: 
  - Star rating system (1-5 stars)
  - "Share Feedback" button for text feedback
  - Display of user's previous feedback submissions
  - **Admin responses**: Any feedback with an admin response will automatically display the response below the user's feedback
- **Functionality**: Pull-to-refresh support for updating feedback data

### Header Standards
- **Icon**: Relevant emoji that matches the spark's theme
- **Title**: "[Spark Name] Settings" format
- **Subtitle**: Brief description of what can be configured
- **Alignment**: Center-aligned for consistency

## Button Design Standards

### Primary Action Buttons
Use **solid blue buttons** for primary actions:
- "Save Changes" (primary completion action)
- "Add Item" / "Add Phrase" / "Add Activity" (primary creation action)
- Single-word actions like "Save", "Add", "Continue"

### Secondary Action Buttons
Use **outlined/bordered buttons** for secondary actions:
- "Cancel" (secondary/dismissal action)
- "Reset to Defaults" (destructive secondary action)

### Destructive Actions
Use **red background** for destructive actions:
- "Remove" buttons for individual items
- "Delete" actions
- Any action that permanently removes data

### Button Placement
- **Add buttons**: Always at the bottom of the list being added to
- **Save/Cancel pairs**: Always at the very bottom of the settings page
- **Remove buttons**: To the right of each removable item
- **Action buttons**: Consistent spacing and sizing

### Close-Only Settings (Read-only or Informational Pages)
- For settings pages with no editable state (e.g., Todo, Business Simulator), use a single secondary-styled button labeled "Close" instead of Save/Cancel pairs.
- Close button should be placed at the bottom, matching the styling of the standard Cancel button.

## Interactive Elements

### Editable Fields
- **Visual Indicator**: Use ✏️ (edit pencil emoji) to indicate editable fields
- **Interaction**: Tap to edit in-place or open dedicated input
- **Feedback**: Clear visual distinction between edit and view modes

### List Management
- **Add New Items**: Button at bottom of existing list
- **Remove Items**: Individual "Remove" button for each item (red background)
- **Reordering**: Only use drag-and-drop when order matters functionally
- **Minimum Items**: Prevent deletion when minimum count required (show alert)

### Form Controls
- **Text Inputs**: Consistent styling with placeholders
- **Dropdowns/Pickers**: Standard native controls
- **Toggles**: Use for binary options
- **Multi-select**: Clear visual selection states

## Content Standards

### Labels & Text
- **Button Labels**: Use consistent terminology
  - "Save Changes" (not "Save" or "Update")
  - "Cancel" (not "Back"). Use "Close" for non-editable settings pages.
  - "Add [Item Type]" (not just "Add")
  - "Remove" (not "Delete" or "X")

### Feedback Messages
- **Validation**: Clear, helpful error messages
- **Success**: Subtle confirmation of saved changes
- **Warnings**: Alert before destructive actions

### Placeholder Text
- **Descriptive**: Explain expected format or provide examples
- **Helpful**: Guide users toward correct input

## Functional Patterns

### Data Persistence
- **Auto-save**: Consider for non-destructive changes
- **Explicit Save**: Required for significant changes
- **Validation**: Before save, ensure data integrity
- **Confirmation**: For destructive or irreversible actions

### Navigation
- **Back Button**: Cancel returns to main spark view
- **Save & Exit**: Save Changes automatically closes settings
- **Unsaved Changes**: Warn user before discarding changes

### Error Handling
- **Validation Errors**: Show immediately, clear when fixed
- **System Errors**: Graceful degradation with user-friendly messages
- **Recovery**: Provide path forward when errors occur

## Responsive Design

### Spacing & Layout
- **Consistent Padding**: 20px page margins, 16px section padding
- **Section Spacing**: Clear visual separation between groups
- **Button Spacing**: Adequate touch targets (minimum 44px height)

### Typography
- **Hierarchy**: Clear distinction between headers, labels, and body text
- **Readability**: Sufficient contrast and font sizes
- **Consistency**: Same fonts and weights across all settings

## Accessibility Standards

### Touch Targets
- **Minimum Size**: 44px x 44px for all interactive elements
- **Spacing**: Adequate space between touch targets
- **Feedback**: Visual and haptic feedback for interactions

### Screen Readers
- **Labels**: Descriptive labels for all form elements
- **States**: Clear indication of current state
- **Navigation**: Logical tab order and focus management

## Component Library Integration

### Reusable Components
Use standardized components from `SettingsComponents.tsx`:
- `SettingsContainer` - Base page container
- `SettingsScrollView` - Scrollable content area with pull-to-refresh support
- `SettingsHeader` - Consistent header with icon/title/subtitle
- `SettingsFeedbackSection` - **REQUIRED** feedback and rating section (must be first after header)
- `SettingsSection` - Grouped settings with title
- `SettingsInput` - Standardized text inputs
- `SettingsButton` - Buttons with variant support
- `SaveCancelButtons` - Standard bottom button pair
- `SettingsItem` - List item layout
- `SettingsText` - Themed text components
- `SettingsRemoveButton` - Standardized remove button

### Custom Components
When spark-specific functionality is needed:
- Extend existing components rather than creating from scratch
- Follow the same visual patterns and theming
- Consider if the functionality could benefit other sparks

## Spark-Specific Variations

### When to Deviate
Deviate from standards only when:
- Functionality is truly unique to one spark
- Standard patterns would harm usability
- Technical constraints require different approach

### Documentation
When creating custom patterns:
- Document the reasoning for deviation
- Consider future applicability to other sparks
- Maintain visual consistency where possible

## Examples by Pattern Type

### Simple Settings (FoodCam, Todo)
- Basic feedback section
- Minimal configuration options
- Standard save/cancel buttons

### Complex Configuration (Flashcards, Packing List)
- Multiple sections for different types of settings
- Add/remove functionality for lists
- Inline editing capabilities

### Advanced Interaction (Tee Time Timer)
- Drag-and-drop reordering
- Complex validation rules
- Multi-step configuration

### Mode Selection (Spanish Friend)
- Radio button patterns for mutually exclusive options
- Dynamic content based on selections
- Preview of configuration results

## Implementation Strategy

### For New Settings Pages
1. **Reference this document** before starting development
2. **Use existing components** from SettingsComponents.tsx
3. **Follow button and layout patterns** established here
4. **Test across different screen sizes** and orientations
5. **Validate accessibility** requirements

### For Existing Settings Updates
1. **Audit current implementation** against these guidelines
2. **Identify inconsistencies** in visual design or UX patterns
3. **Update using standardized components** where possible
4. **Maintain functional behavior** while improving consistency

### For SettingsComponents.tsx Evolution
1. **Add new components** when patterns emerge across multiple sparks
2. **Extend existing components** with new variants as needed
3. **Deprecate custom implementations** in favor of standardized components
4. **Document component usage** and available props

## Quality Checklist

Before shipping any settings page, verify:
- [ ] Uses consistent header format with icon/title/subtitle
- [ ] **Includes SettingsFeedbackSection as the first section after header**
- [ ] **Admin responses display correctly below user feedback**
- [ ] Follows button color and placement standards
- [ ] Implements proper save/cancel functionality
- [ ] Provides clear feedback for user actions
- [ ] Handles validation and error states gracefully
- [ ] Uses standardized components where applicable
- [ ] Meets accessibility requirements
- [ ] Works across different screen sizes
- [ ] Maintains visual consistency with other sparks
- [ ] Documents any necessary deviations from standards

## Future Considerations

### Design System Evolution
- **Component Expansion**: Add new standardized components as patterns emerge
- **Theme Consistency**: Ensure settings follow app-wide theme changes
- **Platform Adaptation**: Consider platform-specific patterns (iOS vs Android vs Web)

### User Research Integration
- **Usability Testing**: Validate that standards improve user experience
- **Feedback Integration**: Update standards based on user feedback
- **A/B Testing**: Test variations of patterns to optimize usability

### Maintenance Strategy
- **Regular Audits**: Periodic review of all settings pages for consistency
- **Documentation Updates**: Keep this document current with any changes
- **Team Training**: Ensure all developers understand and follow these guidelines

---

*This document is a living standard that should evolve based on user feedback, technical constraints, and design insights. Regular reviews and updates ensure it remains valuable and current.*