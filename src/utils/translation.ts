export interface TranslationResult {
  success: boolean;
  translatedText?: string;
  error?: string;
}

export class TranslationService {
  private static readonly MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
  
  static async isNetworkAvailable(): Promise<boolean> {
    // Simple network check by attempting a fetch to a reliable endpoint
    try {
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  static async translateText(text: string, fromLang: string, toLang: string): Promise<TranslationResult> {
    try {
      // Check network connectivity first
      const isOnline = await this.isNetworkAvailable();
      if (!isOnline) {
        return {
          success: false,
          error: 'No internet connection available'
        };
      }

      const params = new URLSearchParams({
        q: text,
        langpair: `${fromLang}|${toLang}`
      });

      const response = await fetch(`${this.MYMEMORY_URL}?${params}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || data.responseStatus !== 200) {
        throw new Error(data.responseDetails || 'Translation service error');
      }

      const translatedText = data.responseData?.translatedText?.trim();

      if (!translatedText) {
        throw new Error('No translation returned');
      }

      return {
        success: true,
        translatedText: translatedText
      };
    } catch (error) {
      console.error('Translation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Translation failed'
      };
    }
  }

  static async translateEnglishToSpanish(text: string): Promise<TranslationResult> {
    return this.translateText(text, 'en', 'es');
  }

  static async translateSpanishToEnglish(text: string): Promise<TranslationResult> {
    return this.translateText(text, 'es', 'en');
  }
}
