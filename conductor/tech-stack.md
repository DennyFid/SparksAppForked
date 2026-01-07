# Technology Stack

This document outlines the core technologies and frameworks used in the SparksApp project.

## Core Technologies

*   **Programming Language:** TypeScript, JavaScript
*   **Mobile Development Framework:** React Native with Expo
*   **Cross-Platform Targets:** iOS, Android, Web

## Key Libraries & Frameworks

*   **State Management:** Zustand
*   **Styling:** Styled Components
*   **Navigation:** React Navigation (utilizing `@react-navigation/bottom-tabs`, `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/stack`)
*   **Testing:** Jest, Jest Expo, React Native Testing Library
*   **Backend/Cloud Services:** Firebase (including Firebase Remote Config)

## Platform Capabilities

The project leverages various Expo modules and capabilities for enhanced functionality:

*   **Camera:** `expo-camera`
*   **Notifications:** `expo-notifications`
*   **Audio/Video:** `expo-av`, `expo-audio`
*   **Image Handling:** `expo-image-picker`, `expo-image-manipulator`
*   **Authentication:** `expo-apple-authentication`, `@react-native-google-signin/google-signin`
*   **Haptics:** `expo-haptics`
*   **File System:** `expo-file-system`
*   **Location:** `expo-location`
*   **Speech Recognition/Synthesis:** `expo-speech`, `expo-speech-recognition`
*   **Cryptography:** `expo-crypto`
*   **Other Utilities:** `expo-blur`, `expo-build-properties`, `expo-constants`, `expo-linking`, `expo-media-library`, `expo-print`, `expo-sharing`, `expo-status-bar`, `expo-task-manager`, `react-native-webview`, `react-native-view-shot`, `react-native-confetti-cannon`, `@react-native-community/datetimepicker`

## AI Integration

*   **Generative AI:** Google Gemini (used for features like RecAIpe, Minute Minder, and voice command parsing, managed through `GeminiService.ts` and `GeminiCommandParser.ts`).

## Build & Deployment Tools

*   **Build Tool:** Expo CLI, EAS Build (`eas-cli`)
*   **Dependency Management:** npm / `package-lock.json`
