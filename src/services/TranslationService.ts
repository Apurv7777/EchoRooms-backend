// Free Google Translate API using the basic endpoint
// No API key required for basic usage with rate limits

interface TranslationResult {
  translatedText: string;
  detectedLanguage: string;
  targetLanguage: string;
}

export class TranslationService {
  
  // Free Google Translate API endpoint
  private static readonly TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';
  
  static async translateText(
    text: string, 
    targetLanguage: string, 
    sourceLanguage: string = 'auto'
  ): Promise<TranslationResult> {
    try {
      const url = new URL(this.TRANSLATE_URL);
      url.searchParams.append('client', 'gtx');
      url.searchParams.append('sl', sourceLanguage);
      url.searchParams.append('tl', targetLanguage);
      url.searchParams.append('dt', 't');
      url.searchParams.append('q', text);

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Parse Google Translate response format
      const translatedText = data[0]?.[0]?.[0] || text;
      const detectedLanguage = data[2] || sourceLanguage;

      return {
        translatedText,
        detectedLanguage,
        targetLanguage
      };
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Translation service unavailable');
    }
  }

  static async detectLanguage(text: string): Promise<string> {
    try {
      const url = new URL(this.TRANSLATE_URL);
      url.searchParams.append('client', 'gtx');
      url.searchParams.append('sl', 'auto');
      url.searchParams.append('tl', 'en');
      url.searchParams.append('dt', 't');
      url.searchParams.append('q', text);

      const response = await fetch(url.toString());
      const data = await response.json();
      
      return data[2] || 'unknown';
    } catch (error) {
      console.error('Language detection error:', error);
      return 'unknown';
    }
  }

  // Common language codes
  static readonly SUPPORTED_LANGUAGES = {
    'auto': 'Auto-detect',
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'da': 'Danish',
    'no': 'Norwegian',
    'fi': 'Finnish',
    'pl': 'Polish',
    'tr': 'Turkish',
    'cs': 'Czech',
    'hu': 'Hungarian',
    'ro': 'Romanian',
    'bg': 'Bulgarian',
    'hr': 'Croatian',
    'sk': 'Slovak',
    'sl': 'Slovenian',
    'et': 'Estonian',
    'lv': 'Latvian',
    'lt': 'Lithuanian',
    'uk': 'Ukrainian',
    'he': 'Hebrew',
    'fa': 'Persian',
    'ur': 'Urdu',
    'bn': 'Bengali',
    'ta': 'Tamil',
    'te': 'Telugu',
    'ml': 'Malayalam',
    'kn': 'Kannada',
    'gu': 'Gujarati',
    'pa': 'Punjabi',
    'mr': 'Marathi',
    'ne': 'Nepali',
    'si': 'Sinhala',
    'my': 'Myanmar',
    'km': 'Khmer',
    'lo': 'Lao',
    'ka': 'Georgian',
    'am': 'Amharic',
    'sw': 'Swahili',
    'zu': 'Zulu',
    'af': 'Afrikaans',
    'sq': 'Albanian',
    'az': 'Azerbaijani',
    'eu': 'Basque',
    'be': 'Belarusian',
    'bs': 'Bosnian',
    'ca': 'Catalan',
    'cy': 'Welsh',
    'eo': 'Esperanto',
    'gl': 'Galician',
    'is': 'Icelandic',
    'ga': 'Irish',
    'mk': 'Macedonian',
    'mt': 'Maltese',
    'ms': 'Malay',
    'id': 'Indonesian'
  };

  static getLanguageName(code: string): string {
    return this.SUPPORTED_LANGUAGES[code as keyof typeof this.SUPPORTED_LANGUAGES] || code;
  }
}
