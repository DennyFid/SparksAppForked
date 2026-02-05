# Infinite Sparks: The Dynamic Sparklet Ecosystem ♾️ (beta)

## 1. Vision
The "Infinite" spark is a gateway to a universe of on-demand, dynamic "sparklets." Unlike core sparks which are bundled with the app, sparklets are stored in a cloud database and loaded dynamically. This allows for near-infinite expansion and user-generated content without increasing the app's binary size.

## 2. The ♾️ Infinite Spark
The **Infinite** spark acts as a sub-platform within SparksApp. 
- **Emoji:** ♾️
- **Branding:** Marked as "Infinite (beta)"
- **Entry Point:** Found in the main Sparks Discover screen.

## 3. Core Experience: Discover Sparklets
When a user opens the Infinite spark, they are presented with a **Discover Sparklets** screen, mirroring the main app's discovery experience but focused on the dynamic sparklet library.

### Initial "Seed" Sparklets (beta)
1.  **Tic Tac Toe (beta):** A classic game to demonstrate dynamic loading and state management.
2.  **Sparklets Wizard (beta):** A meta-sparklet that allows users to describe a new spark. It uses Gemini to generate the necessary code/logic and saves it back to the database.

## 4. Architecture

### Dynamic Sparklet Registry
Unlike the static `sparkRegistryData`, the Infinite spark fetches its list of available sparklets from a database (e.g., Firebase Firestore).

### Storage & Execution
- **Metadata:** Name, description, icon, and specific configuration stored in Firestore.
- **Sparklet Code:** For beta, we will start with "Configuration-Driven Sparklets" (using high-level prompts and pre-defined UI components) or "Dynamic JS Evaluation" (using `eval` or a sandboxed JS engine specifically for sparklets).

### The Sparklets Wizard (The Generator)
The Wizard follows the pattern of the Sparks Wizard but with a focus on outputting a "Sparklet Definition":
1.  **User Prompt:** "Build me a simple coin flip game."
2.  **Gemini Call:** Processes the request and generates a JSON definition (or code snippet).
3.  **Deployment:** The definition is written to the Sparklets database.
4.  **Instant Content:** The new sparklet immediately appears in the "Discover Sparklets" view.

## 5. Technical Deep-Dive: The Universal Engine 🧠

The core of Infinite Sparks is a runtime engine that treats code as data. Here is how it works:

### Logic as Strings
Instead of compiled code, game logic is stored in Firestore as Javascript strings within `definition.helpers` and `definition.actions`.

### The `UniversalSparkletEngine`
The engine uses the Javascript `new Function()` constructor to "rehydrate" these database strings into executable functions at runtime.

#### How `runHelper` and `executeAction` Work:
When an action (like a button press) occurs, the engine does the following:

1.  **Context Injection**: It creates a specialized scope for the function, providing तीन (three) variables:
    *   `state`: The current local state of the sparklet (e.g., the board grid).
    *   `params`: Any interaction data (e.g., which cell index was clicked).
    *   `helpers`: A map of other helper functions defined in the database.
2.  **Evaluation**: 
    ```javascript
    const fn = new Function('state', 'params', 'helpers', cloudCodeString);
    const newState = fn(state, params, helpersProxy);
    ```
3.  **State Update**: If the function returns an object, the engine automatically updates the React state, causing the UI to re-render with the new data.

### UI Schema Evaluation
The UI is not hardcoded. The database sends an `elements` array (e.g., `type: 'grid', dataSource: 'state.board'`). The engine uses **Interpolation** to link the UI to the live state:
*   `{{state.status}}` in the database is automatically replaced by the actual string in the state object before being displayed.

## 6. Beta Branding Strategy
To manage user expectations for this hyper-beta feature:
- Entry point labeled: **Infinite (beta)**
- All sparklets within the platform labeled with a suffix: **(beta)** or a small **(b)** badge.

## 6. Implementation Plan (Beta Phase)

### Step 1: Infinite Spark Container
- Create `src/sparks/InfiniteSpark.tsx`.
- Implement a basic Discover UI within the spark.

### Step 2: Database Setup
- Set up a Firebase Firestore collection: `sparklets`.
- Seed with "Tic Tac Toe" and "Sparklets Wizard" metadata.

### Step 3: Tic Tac Toe Sparklet
- Build a modular Tic Tac Toe component that can be loaded by the Infinite container.

### Step 4: Sparklets Wizard Integration
- Port the Sparks Wizard logic to a sparklet-specific prompt.
- Implement the "Save to Database" logic.

### Step 5: Registry Integration
- Add the Infinite Spark (♾️) to the main `sparkRegistryData.tsx`.

## 7. Security & Publishing Workflow 🛡️

To prevent malicious code injection and community poisoning, we implement an ownership and publication model.

### Ownership Model
- **Owner ID**: Every Sparklet is tagged with an `ownerId`. This defaults to the user's `deviceId` (retrieved via `SimpleAnalyticsService`) or their `userId` if signed in.
*   **Access Control**: 
    - Users can see all **Published** Sparklets in the Discover screen.
    - Users can see their own **Draft/Pending** Sparklets in a "My Sparklets" section.
    - Users cannot see or edit other users' unpublished Sparklets.

### Lifecycle & Statuses
1.  **Draft**: The initial state. Only the owner can see and edit.
2.  **Pending**: Owner has clicked "Request Publication". Still only owner can see/edit. Admin (Matt) reviews in Firebase.
3.  **Published**: Visible to everyone in the Discover screen. **Read-only** for everyone (including the owner) to ensure the reviewed code remains safe.

### Publishing Workflow for Owners
- **Request Publication**: A button in the Sparklet Editor settings allows owners to submit their draft for review.
- **Editing Published Work**: To edit a published Sparklet, the owner must first **Unpublish** it (returning it to Draft status). This removes it from the public Discover screen, allowing safe modification before re-submitting for review.

### UI Enhancements
- **Discover Screen**: Split into "Community Sparklets" (Published) and "My Sparklets" (Drafts/Pending).
*   **Editor**: 
    - Display current status (Draft, Pending, Published).
    - Provide "Publish Request" and "Unpublish" buttons.
    - Disable save/AI-refine when status is "Published".