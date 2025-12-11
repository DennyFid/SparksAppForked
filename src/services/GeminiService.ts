export const GeminiService = {
    generateContent: async (prompt: string, images: string[] = []): Promise<string> => {
        const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY');
        }

        // Using configuration from RecAIpeSpark which is confirmed working
        // Model: gemini-2.5-flash (as seen in working code)
        // API Version: v1
        const contents: any[] = [{
            parts: [{ text: prompt }]
        }];

        // Add images if provided
        if (images && images.length > 0) {
            images.forEach(base64Image => {
                contents[0].parts.push({
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: base64Image
                    }
                });
            });
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.error?.message || 'API request failed';
            console.error('Gemini API Error:', errorMsg);
            throw new Error(errorMsg);
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error('No content generated');
        }

        return text;
    },

    generateJSON: async <T>(prompt: string, images: string[] = []): Promise<T> => {
        // Append JSON instruction
        const jsonPrompt = `${prompt}\n\nOutput strictly valid JSON.`;
        const text = await GeminiService.generateContent(jsonPrompt, images);

        try {
            // Clean markdown code blocks if present
            const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleanText) as T;
        } catch (e) {
            console.error('JSON Parse Error', e);
            throw new Error('Failed to parse (JSON)');
        }
    }
};
