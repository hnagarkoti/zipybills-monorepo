/**
 * Supported locale codes for FactoryOS.
 * Add new locales here and provide corresponding JSON files in ./locales/
 */
export type SupportedLocale = 'en' | 'hi' | 'fr' | 'es';

export interface LanguageOption {
  /** ISO 639-1 code */
  code: SupportedLocale;
  /** Language name in its own script */
  nativeName: string;
  /** Language name in English */
  englishName: string;
  /** Flag emoji (for visual identification) */
  flag: string;
}

export interface I18nState {
  locale: SupportedLocale;
  isHydrated: boolean;
  setLocale: (locale: SupportedLocale) => void;
  setHydrated: () => void;
}

/** All languages supported by the app */
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', nativeName: 'English', englishName: 'English', flag: '🇺🇸' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', flag: '🇮🇳' },
  { code: 'fr', nativeName: 'Français', englishName: 'French', flag: '🇫🇷' },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish', flag: '🇪🇸' },
];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const FALLBACK_LOCALE: SupportedLocale = 'en';
