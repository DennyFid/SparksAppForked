import { GeminiService } from './GeminiService';

export interface ParsedCommand {
  targetSpark: 'todo' | 'weight-tracker' | 'toview' | 'spanish-flashcards' | 'unknown';
  action: 'create' | 'add' | 'open' | 'unknown';
  params: Record<string, any>;
  confidence: number;
  originalText: string;
}

const SYSTEM_PROMPT = `
You are a voice command parser for the Sparks app. 
Analyze the user's spoken command and extract intent.
Return ONLY a JSON object.

Supported Sparks:
1. "todo" (Todo List): creating tasks. 
   - Keywords: "add todo", "remind me", "buy", "task".
   - Params: { text: string (required), category: string (optional), dueDate: string (YYYY-MM-DD or 'today'/'tomorrow') }

2. "weight-tracker" (Weight Tracker): logging weight.
   - Keywords: "weight is", "weighed", "add weight".
   - Params: { weight: number, unit: 'lbs'|'kg' }

3. "toview" (ToView List): tracking movies/shows.
   - Keywords: "to view", "watch", "movie", "show".
   - Params: { title: string, type: 'Movie'|'Show'|'Book', provider?: string, watchWith?: string[] }

Examples:
"Add a todo to buy milk" -> { "targetSpark": "todo", "action": "create", "params": { "text": "Buy milk" }, "confidence": 0.9 }
"Weight is 150" -> { "targetSpark": "weight-tracker", "action": "add", "params": { "weight": 150, "unit": "lbs" }, "confidence": 0.9 }
"Watch Gladiator with Bob on Netflix" -> { "targetSpark": "toview", "action": "add", "params": { "title": "Gladiator", "type": "Movie", "provider": "Netflix", "watchWith": ["Bob"] }, "confidence": 0.9 }
"Open Spanish" -> { "targetSpark": "unknown", "confidence": 0.0 } (if not supported yet)

Return { "targetSpark": "unknown", "confidence": 0.0 } if unclear.
`;

export const GeminiCommandParser = {
  parseCommand: async (transcript: string): Promise<ParsedCommand> => {
    try {
      console.log('Sending to Gemini:', transcript);

      const parsed = await GeminiService.generateJSON<any>(`${SYSTEM_PROMPT}\n\nCommand: "${transcript}"`);

      console.log('Gemini Parsed:', parsed);
      return {
        ...parsed,
        originalText: transcript
      };

    } catch (error: any) {
      console.error('Gemini parsing error:', error);
      return {
        targetSpark: 'unknown',
        action: 'unknown',
        params: { error: error.message },
        confidence: 0,
        originalText: transcript
      };
    }
  }
};
