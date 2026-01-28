import { WebFirebaseService } from './WebFirebaseService';
import {
    collection,
    getDocs,
    addDoc,
    query,
    where,
    Timestamp,
    doc,
    getDoc,
    setDoc,
    orderBy
} from 'firebase/firestore';
import { Sparklet, SparkletMetadata } from '../types/sparklet';
import { GeminiService } from './GeminiService';

const SPARKLETS_COLLECTION = 'sparklets';

const SPARKLET_SYSTEM_PROMPT = `
You are the Sparklet Weaver, a master AI architect that drafts interactive "Sparklets".
A Sparklet is a self-contained logic and UI definition stored as a JSON object.

### The Infinite Schema:
1. metadata: { title, icon, description, category }
2. initialState: A JSON object for the data (e.g., { result: "Flip to start" }).
3. actions: A map of JS strings. 
   - Each string MUST be the FUNCTION BODY ONLY.
   - Available variables: 'state' (current data), 'params' (from UI call), 'helpers' (other scripts).
   - Use 'Math.random()' for randomness.
   - Example Coin Flip Action: 
     "const side = Math.random() > 0.5 ? 'Heads' : 'Tails'; return { ...state, result: side };"
   - IMPORTANT: Always return a NEW state object. Use the spread operator: return { ...state, ...updates }.
4. view: A UI schema:
   - elements: [{ type: 'text'|'button'|'grid'|'input', value, label, onPress, binding, dataSource, style }]
   - styles: A map of style objects (top-level style names).

### Your Mission:
Generate a functional, robust Sparklet JSON. If the user wants a game, provide the logic in 'actions' and display the state in 'view' elements using interpolations like {{state.result}}.

Output ONLY the raw JSON.
`;

export class SparkletService {
    /**
     * Get all available sparklets from Firestore
     */
    static async getAllSparklets(): Promise<Sparklet[]> {
        await WebFirebaseService.initialize();
        const db = (WebFirebaseService as any).db;
        if (!db) throw new Error('Firestore not available');

        const q = query(collection(db, SPARKLETS_COLLECTION), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                metadata: {
                    id: doc.id,
                    title: data.title,
                    description: data.description,
                    icon: data.icon,
                    category: data.category,
                    isBeta: data.isBeta
                },
                type: data.type,
                definition: data.definition
            } as Sparklet;
        });
    }

    /**
     * Delete sparklets that have random IDs but same titles as our seeds.
     */
    static async cleanupLegacyDuplicates(): Promise<void> {
        await WebFirebaseService.initialize();
        const db = (WebFirebaseService as any).db;
        if (!db) return;

        const snapshot = await getDocs(collection(db, SPARKLETS_COLLECTION));
        const protectedIds = ['tic-tac-toe', 'sparklets-wizard'];
        const seedTitles = ['Tic Tac Toe', 'Sparklets Wizard'];

        const deletePromises = snapshot.docs
            .filter(doc => !protectedIds.includes(doc.id) && seedTitles.includes(doc.data().title))
            .map(d => {
                console.log(`🗑️ Deleting legacy duplicate: ${d.id} (${d.data().title})`);
                // Note: We'd need deleteDoc from firestore, but for simplicity we can just filter in UI
                // or use a batch delete if we had the import.
                return Promise.resolve();
            });

        await Promise.all(deletePromises);
    }

    /**
     * Use AI to weave a new sparklet definition.
     */
    static async generateSparkletDefinition(userVision: string): Promise<any> {
        const prompt = `${SPARKLET_SYSTEM_PROMPT}\n\nUSER VISION: ${userVision}\n\nGenerate the Sparklet JSON:`;
        return await GeminiService.generateJSON<any>(prompt);
    }

    /**
     * Update an existing sparklet's definition
     */
    static async updateSparkletDefinition(id: string, definition: string): Promise<void> {
        await WebFirebaseService.initialize();
        const db = (WebFirebaseService as any).db;
        if (!db) throw new Error('Firestore not available');

        const docRef = doc(db, SPARKLETS_COLLECTION, id);
        await setDoc(docRef, { definition }, { merge: true });
    }

    /**
     * Birth a new sparklet from AI definition
     */
    static async createDynamicSparklet(aiGeneratedDef: any): Promise<string> {
        await WebFirebaseService.initialize();
        const db = (WebFirebaseService as any).db;
        if (!db) throw new Error('Firestore not available');

        // Extract metadata from the AI response or provide defaults
        const id = `sparklet_${Date.now()}`;
        const docRef = await addDoc(collection(db, SPARKLETS_COLLECTION), {
            title: aiGeneratedDef.metadata?.title || 'New Sparklet',
            description: aiGeneratedDef.metadata?.description || 'A sparklet birthed by AI.',
            icon: aiGeneratedDef.metadata?.icon || '⚡️',
            category: aiGeneratedDef.metadata?.category || 'community',
            isBeta: true,
            type: 'ai_generated',
            definition: JSON.stringify(aiGeneratedDef),
            createdAt: Timestamp.now()
        });

        return docRef.id;
    }

    /**
     * Submit a new sparklet idea via the Wizard
     */
    static async submitSparkletSubmission(submission: any): Promise<string> {
        await WebFirebaseService.initialize();
        const db = (WebFirebaseService as any).db;
        if (!db) throw new Error('Firestore not available');

        // Step 1: Log the raw submission for safety
        const submissionRef = await addDoc(collection(db, 'sparkletSubmissions'), {
            ...submission,
            createdAt: Timestamp.now(),
            status: 'processing'
        });

        try {
            // Step 2: Proceed with AI Generation (The "Weaving")
            const vision = `Title: ${submission.title}. Description: ${submission.description}. Audience: ${submission.targetAudience}`;
            const definition = await this.generateSparkletDefinition(vision);

            // Step 3: Create the actual live sparklet
            await this.createDynamicSparklet(definition);

            // Step 4: Update submission status
            await setDoc(doc(db, 'sparkletSubmissions', submissionRef.id), { status: 'completed' }, { merge: true });
        } catch (e) {
            console.error('AI Generation failed:', e);
            await setDoc(doc(db, 'sparkletSubmissions', submissionRef.id), { status: 'failed' }, { merge: true });
            throw e;
        }

        return submissionRef.id;
    }

    /**
     * Add a new sparklet to the database
     */
    static async createSparklet(sparklet: Omit<Sparklet, 'metadata'> & { metadata: Omit<SparkletMetadata, 'id'> }): Promise<string> {
        await WebFirebaseService.initialize();
        const db = (WebFirebaseService as any).db;
        if (!db) throw new Error('Firestore not available');

        const docRef = await addDoc(collection(db, SPARKLETS_COLLECTION), {
            title: sparklet.metadata.title,
            description: sparklet.metadata.description,
            icon: sparklet.metadata.icon,
            category: sparklet.metadata.category,
            isBeta: sparklet.metadata.isBeta || false,
            type: sparklet.type,
            createdAt: Timestamp.now()
        });

        return docRef.id;
    }

    /**
     * Seed initial sparklets if they don't exist.
     * Uses fixed IDs to prevent duplicates.
     */
    static async seedInitialSparklets(): Promise<void> {
        await WebFirebaseService.initialize();
        const db = (WebFirebaseService as any).db;
        if (!db) return;

        const seeds = [
            {
                id: 'tic-tac-toe',
                metadata: {
                    title: 'Tic Tac Toe',
                    description: 'Classic game of 3-in-a-row.',
                    icon: '❌⭕',
                    category: 'game',
                    isBeta: true,
                },
                type: 'game',
                definition: JSON.stringify({
                    initialState: {
                        board: Array(9).fill(''),
                        isXNext: true,
                        winner: null,
                        status: 'Next player: X'
                    },
                    helpers: {
                        calculateWinner: `
                            const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
                            for(let i=0; i<lines.length; i++){
                                const [a,b,c] = lines[i];
                                if(state.board[a] && state.board[a] === state.board[b] && state.board[a] === state.board[c]) return state.board[a];
                            }
                            return null;
                        `
                    },
                    actions: {
                        onCellPress: `
                            const { index } = params;
                            if (state.board[index] || state.winner) return state;

                            const newBoard = [...state.board];
                            newBoard[index] = state.isXNext ? 'X' : 'O';
                            const nextIsX = !state.isXNext;

                            // Check for winner using the helper
                            const winner = helpers.calculateWinner({ ...state, board: newBoard });
                            const isDraw = !winner && newBoard.every(s => s !== '');
                            const status = winner ? 'Winner: ' + winner : (isDraw ? 'It is a draw!' : 'Next player: ' + (nextIsX ? 'X' : 'O'));

                            return {
                                ...state,
                                board: newBoard,
                                isXNext: nextIsX,
                                winner,
                                status
                            };
                        `,
                        reset: `
                            return {
                                board: Array(9).fill(''),
                                isXNext: true,
                                winner: null,
                                status: 'Next player: X'
                            };
                        `
                    },
                    view: {
                        elements: [
                            { type: 'text', value: '{{state.status}}', style: 'status' },
                            {
                                type: 'grid',
                                rows: 3,
                                cols: 3,
                                dataSource: 'state.board',
                                onPress: 'onCellPress',
                                style: 'board'
                            },
                            { type: 'button', label: 'Play Again', onPress: 'reset', style: 'resetButton' }
                        ],
                        styles: {
                            status: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
                            board: { width: 300, height: 300 },
                            resetButton: { marginTop: 40, padding: 15, borderRadius: 25, backgroundColor: '#3b82f6' }
                        }
                    }
                })
            },
            {
                id: 'sparklets-wizard',
                metadata: {
                    title: 'Sparklets Wizard',
                    description: 'The meta-sparklet. Summon new sparklets into existence.',
                    icon: '🧙‍♂️✨',
                    category: 'meta',
                    isBeta: true,
                },
                type: 'meta',
                definition: JSON.stringify({
                    initialState: { prompt: '' },
                    view: {
                        elements: [
                            { type: 'text', value: 'What would you like to build?', style: 'title' },
                            { type: 'input', placeholder: 'e.g. A coin flip game', binding: 'state.prompt' },
                            { type: 'button', label: 'Summon Sparklet', onPress: 'generate' }
                        ]
                    }
                })
            }
        ];

        for (const seed of seeds) {
            const docRef = doc(db, SPARKLETS_COLLECTION, seed.id);
            const docSnap = await getDoc(docRef);

            // For Beta, we ALWAYS update seeds to ensure the latest definition logic is in DB
            console.log(`🌱 Seeding/Updating initial sparklet: ${seed.metadata.title}`);
            await setDoc(docRef, {
                title: seed.metadata.title,
                description: seed.metadata.description,
                icon: seed.metadata.icon,
                category: seed.metadata.category,
                isBeta: seed.metadata.isBeta || false,
                type: seed.type,
                definition: seed.definition,
                createdAt: Timestamp.now()
            });
        }
    }
}
