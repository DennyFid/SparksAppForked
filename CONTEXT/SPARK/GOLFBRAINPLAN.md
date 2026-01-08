# Golf Brain Spark Improvements - Jan 6

## PENDING CHANGES JAN 6

- [ ] **Fix Navigation Button Text Visibility:** The text on the buttons below "Round Summary" (Prev Hole, Hole History, etc.) is either not viewable or (next) or too tall (prev and history). The Round Summary button is too skinny. Let's make each of these buttons padding and height the same as the Record Swing button.
- [x] **Fix Record Swing on Android:** Ensure gestures work correctly (likely fixed by `GestureHandlerRootView` addition).
- [ ] **Scroll to Top on Shot Change:** The scroll view should return to the top when transitioning between shots or putts.
- [x] **Enable Record Swing for Putts:** Allow recording swings for putts as well as shots.
- [x] **Reposition Shot/Putt Pills:** Move the S1, S2, P1, P2 selector pills above the "Shot X" border card.
- [x] **Fix Settings Persistence & Synchronization:** Resolved the issue where settings (like countdown duration) wouldn't save or would show stale data.
    - **Functional Updates:** Switched to `setData((prev) => ...)` in `handleUpdateSettings` to avoid using stale state from React's closure.
    - **Immediate Persistence:** Added an explicit `setSparkData` call inside the state update logic. This ensures data is committed to the global store immediately, preventing race conditions if the component unmounts (e.g., closing the modal).
    - **Local State Synchronization:** Added a synchronization `useEffect` inside the `GolfBrainSettings` component. This ensures the local modal state stays in sync with background hydration or global updates.
    - **Hydration Guard:** Implemented a check to only render the settings UI once `dataLoaded` is true, ensuring it never initializes with default/stale state.
