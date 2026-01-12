# Common Chart Capability Plan (SparkChart) - Jan 11

## Overview
Create a standardized, flexible, and reusable charting component (`SparkChart`) to replace fragmented custom implementations across multiple sparks. This will improve code maintainability, visual consistency, and feature parity.

## Target Sparks for Migration
1.  **Goal Tracker Spark:** Currently uses a custom SVG implementation for actual/target lines.
2.  **Card Score Spark:** Currently uses a custom SVG implementation for multi-player score tracking.
3.  **Golf Brain Spark:** Currently uses a custom absolute-positioned `View` implementation (dots only).

## Requirements

### 1. Functional Requirements
*   **Multiple Data Series:** Support rendering multiple lines on a single chart (e.g., Target vs. Actual, Player A vs. Player B).
*   **Line Styles:**
    *   Solid lines (standard).
    *   Dashed lines (for forecasts or targets).
    *   Custom colors per series.
*   **Data Point Markers:**
    *   Standard circles/dots at data points.
    *   **Emoji Markers:** Ability to place emojis (🔥, 💩, ⛳) directly on or above specific data points (critical for Golf Brain).
*   **Axes & Scaling:**
    *   Automatic Y-axis scaling based on data range.
    *   Standardized X-axis labels.
    *   Optional "Zero Line" (Even Par, Baseline).
*   **Responsive Design:** Adaptive width based on screen size (using `Dimensions`).

### 2. Technical Implementation
*   **Base Library:** `react-native-svg` (already used in Goal Tracker and Card Score).
*   **Location:** `src/components/SparkChart.tsx`.
*   **Component Props (`SparkChartProps`):**
    ```typescript
    interface DataPoint {
      x: number | string; // X value or label
      y: number;          // Y value
      emoji?: string;     // Optional marker
      meta?: any;         // Extra info for tooltips
    }

    interface ChartSeries {
      id: string;
      label: string;
      data: DataPoint[];
      color: string;
      style?: 'solid' | 'dashed';
      strokeWidth?: number;
    }

    interface SparkChartProps {
      series: ChartSeries[];
      height?: number;
      padding?: number;
      showZeroLine?: boolean;
      showLegend?: boolean;
      onPointPress?: (point: DataPoint) => void;
    }
    ```

## Implementation Phases

### Phase 1: Core Component Development
1.  **[ ] Foundation:** Setup `SparkChart.tsx` with basic SVG rendering logic.
2.  **[ ] Scaling Logic:** Implement helper functions to map data values to SVG coordinate space.
3.  **[ ] Path Generation:** Create a robust path generator supporting both solid and dashed lines.
4.  **[ ] Emoji Support:** Implement rendering logic for emoji markers above data points.

### Phase 2: Goal Tracker Migration
1.  **[ ] Refactor Data Mapping:** Update `GoalTrackerSpark` to format its data for the new `SparkChart` component.
2.  **[ ] Replacement:** Swap the custom `GoalChart` with `SparkChart`.
3.  **[ ] Verification:** Ensure "Actual" (solid) and "Target" (dashed) lines render correctly with color logic.

### Phase 3: Card Score Migration
1.  **[ ] Refactor Data Mapping:** Update `CardScoreSpark` to map player cumulative scores to chart series.
2.  **[ ] Zero Line:** Enable the `showZeroLine` prop to handle negative scores (e.g., in some card games).
3.  **[ ] Replacement:** Swap `ScoreChart` with `SparkChart`.

### Phase 4: Golf Brain Migration
1.  **[ ] Refactor Data Mapping:** Update `GolfBrainSpark` to extract hole scores and emoji metadata (fire/poor shot).
2.  **[ ] Enhanced Emoji Placement:** Ensure 🔥 and 💩 emojis are correctly passed as `emoji` props to the `DataPoint` objects.
3.  **[ ] Replacement:** Replace the dot-based `customChart` with `SparkChart`, enabling connecting lines for the first time.

## Success Criteria
*   [ ] All three sparks use the same `SparkChart` component.
*   [ ] Code duplication for SVG charting is reduced by ~80%.
*   [ ] Golf Brain charts now have actual lines connecting the points.
*   [ ] Emojis are perfectly aligned with data points across all devices.
