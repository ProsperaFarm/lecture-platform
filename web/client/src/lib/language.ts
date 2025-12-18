/**
 * Converts ISO 639-1 language codes to generic language names
 * Returns generic names like "Português", "English", "Español" (not specific variants)
 */
export function getLanguageName(languageCode: string | null | undefined): string | null {
  if (!languageCode) return null;

  // Extract base language code (e.g., "pt" from "pt-BR")
  const baseCode = languageCode.split('-')[0].toLowerCase();

  const languageMap: Record<string, string> = {
    'pt': 'Português',
    'en': 'English',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch',
    'it': 'Italiano',
    'ru': 'Русский',
    'ja': '日本語',
    'zh': '中文',
    'ko': '한국어',
    'ar': 'العربية',
    'hi': 'हिन्दी',
    'nl': 'Nederlands',
    'pl': 'Polski',
    'tr': 'Türkçe',
    'sv': 'Svenska',
    'da': 'Dansk',
    'no': 'Norsk',
    'fi': 'Suomi',
    'cs': 'Čeština',
    'hu': 'Magyar',
    'ro': 'Română',
    'el': 'Ελληνικά',
    'he': 'עברית',
    'th': 'ไทย',
    'vi': 'Tiếng Việt',
    'id': 'Bahasa Indonesia',
    'ms': 'Bahasa Melayu',
  };

  return languageMap[baseCode] || null;
}

