# Business Spark Implementation Plan: The "AI CFO" Simulation

> **STATUS:** READY FOR DEVELOPMENT  
> **APPROACH:** AI-Driven Narrative + Strict Accounting Logic  
> **TARGET DIRECTORY:** `src/sparks/BusinessSpark/`

## 1. Executive Summary

We are building an **AI-Driven Business Simulator** that teaches real-world accounting (Unit Economics, P&L, Balance Sheets) not through static rules, but through a dynamic "Dungeon Master" experience led by Gemini.

**The Core Loop:**
1.  **User makes a decision** (e.g., "Buy cheap plastic" or "Invest in marketing").
2.  **Gemini simulates the result** (e.g., "The plastic was brittle, customer complaints rose by 20%").
3.  **Gemini returns structured accounting data** (Journal Entries).
4.  **App Engine validates & commits** the math to the rigid Ledger.
5.  **UI renders** the narrative and the updated financial statements.

## 2. Technical Architecture

### 2.1 File Structure
We will create a self-contained feature module within the sparks directory.

```text
src/sparks/BusinessSpark/
├── BusinessSpark.tsx          # Main Entry Screen (UI Shell)
├── useBusinessEngine.ts       # Hook managing Gemini interactions & State
├── services/
│   ├── BusinessGeminiSystem.ts # The System Prompt & request logic
│   └── LedgerEngine.ts        # The "Math Truth": validators & state reducers
├── components/
│   ├── NarrativeFeed.tsx      # Scrollable history of turns
│   ├── FinancialDashboard.tsx # Real-time P&L and Balance Sheet
│   └── ActionDeck.tsx         # User choice interface
└── types.ts                   # strict TypeScript definitions
```

### 2.2 Data Flow
`User Action` -> `useBusinessEngine` -> `GeminiService (JSON Mode)` -> `GameTurnResponse` -> `LedgerEngine.validate()` -> `State Update`

---

## 3. Detailed Data Models (`types.ts`)

We must define strict interfaces to ensure the AI interacts correctly with our rigid accounting engine.

```typescript
export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

// The Allowed Chart of Accounts (to prevent AI hallucinating "Magic Dust" account)
export const VALID_ACCOUNTS = [
  'Cash', 'Accounts Receivable', 'Inventory', 'Equipment', // Assets
  'Accounts Payable', 'Loans Payable',                     // Liabilities
  'Owner\'s Equity', 'Retained Earnings',                  // Equity
  'Sales Revenue',                                         // Revenue
  'COGS', 'Rent', 'Marketing', 'Maintenance', 'Salaries', 'Depreciation' // Expenses
] as const;

export interface JournalEntry {
  debit_account: string;  // Must match VALID_ACCOUNTS
  credit_account: string; // Must match VALID_ACCOUNTS
  amount: number;
  description: string;
}

// Visual feedback for the user
export interface MetricUpdate {
  label: string;
  value: string; // e.g., "+$500" or "-10% Health"
  trend: 'up' | 'down' | 'neutral';
}

// The Strict JSON Response from Gemini
export interface GameTurnResponse {
  narrative_outcome: string;        // The flavor text (What happened?)
  mentor_feedback: string;          // The lesson (Why did cash go down but profit up?)
  
  journal_entries: JournalEntry[];  // The accounting TRUTH
  
  // Operational State Updates (Non-monetary)
  ops_updates: {
    inventory_mass_change_kg: number;
    machine_health_change: number;  // Delta e.g. -5
    new_week_number: number;
  };

  // Next available distinct paths
  next_options: {
    id: string;
    label: string;
    type: 'strategic' | 'operational' | 'crisis';
    estimated_cost_preview: string;
  }[];
}

export interface BusinessState {
  // Financial State
  cash: number;
  ledger: JournalEntry[]; // Full history
  
  // Operational State
  week: number;
  inventory_kg: number;
  machine_health: number; // 0-100
  
  // Game History
  turn_history: GameTurnResponse[];
  
  // Status
  is_loading: boolean;
  game_over: boolean;
}
```

---

## 4. The "Brain": System Prompt Design

Location: `src/sparks/BusinessSpark/services/BusinessGeminiSystem.ts`

The System Prompt is the critical component. It must act as:
1.  **Improv Artist:** Making boring business interesting.
2.  **Strict Accountant:** Knowing that `Assets = Liabilities + Equity`.

**System Prompt Spec:**
*   **Role:** Expert Forensic Accountant & D&D Dungeon Master.
*   **Context:** User is running a 3D Printing Business.
*   **Rules:**
    *   **Logic:** If user buys a machine, Cash goes DOWN, Equipment goes UP. (Asset for Asset swap).
    *   **Logic:** If user sells product, Revenue goes UP, Cash/AR goes UP. ALSO: Inventory goes DOWN, COGS goes UP.
    *   **Constraint:** You cannot create money out of thin air.
    *   **Format:** STRICT JSON.

**Input Prompt Structure (in `generateTurn`):**
```text
CURRENT STATE:
Week: 3
Cash: $1,200
Inventory: 50kg
Machine Health: 85%

LAST HISTORY:
User bought cheap filament. Machine health dropped 5%.

USER ACTION:
"Launch a marketing campaign on Instagram ($200)"

Generate the JSON outcomes.
```

---

## 5. The "Muscle": Ledger Engine

Location: `src/sparks/BusinessSpark/services/LedgerEngine.ts`

This file ensures the UI never breaks due to bad AI math.

**Requirements:**
1.  **`validateTransaction(entries: JournalEntry[]): boolean`**
    *   Iterate through entries.
    *   Sum Debits. Sum Credits.
    *   If `Math.abs(debits - credits) > 0.01`, **REJECT** the turn.
    *   *Self-Correction Strategy:* If rejected, the App allows 1 auto-retry requesting the AI to "Fix the unbalanced ledger".

2.  **`calculateBalances(history: JournalEntry[])`**
    *   Recomputes `Cash`, `Equity`, etc., from the ground up (or incrementally) to ensure precision.

---

## 6. Implementation Stages

### Phase 1: The "Text Adventure" (MVP)
*   **Goal:** A working chat interface where I make decisions and the numbers change correctly.
*   **Deliverables:**
    *   `BusinessSpark.tsx` shell.
    *   `useBusinessEngine.ts` connecting to `GeminiService`.
    *   Basic rendering of `narrative_outcome` and `next_options`.
    *   Simple text display of `Cash` balance.

### Phase 2: The "CFO Dashboard"
*   **Goal:** Visualize the accounting education.
*   **Deliverables:**
    *   A "Books" accordion that unfolds to show the valid Journal Entries for that turn.
    *   Animated tickers for Cash/Profit.
    *   `MetricUpdate` badges showing precise impacts.

### Phase 3: Visual Polish & persistence
*   **Goal:** Production quality.
*   **Deliverables:**
    *   Save state to `AsyncStorage`.
    *   Charts (using a lightweight chart lib or SVG) for "Cash vs Profit" over time.
    *   Custom icons for the different "Option Types".

---

## 7. Development Rules (Agent Instructions)

When executing this plan:
1.  **Do not over-engineer the UI initially.** Focus on the `GeminiService` -> `LedgerEngine` loop. If that fails, the game fails.
2.  **Use `GeminiService.generateJSON`**. Do not parse raw text.
3.  **Hardcode the 'Accounts'.** Do not let the AI name accounts dynamically. Use the `VALID_ACCOUNTS` constant as a runtime check.
4.  **Error Handling.** If Gemini fails or timeouts, provide a "Manual Override" or "Retry" option in the UI so the user isn't stuck.

## 8. Next Immediate Step
Create the directory structure and the core `types.ts` to establish the contract.