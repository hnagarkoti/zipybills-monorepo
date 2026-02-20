/**
 * i18next initialisation for FactoryOS.
 *
 * - Bundles all translation JSON at build time (offline-first).
 * - Uses expo-localization for device locale detection.
 * - Falls back to English when the device locale isn't supported.
 * - Does NOT depend on any backend call — language works offline.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import hi from './locales/hi.json';
import fr from './locales/fr.json';
import es from './locales/es.json';

import { FALLBACK_LOCALE, SUPPORTED_LANGUAGES, type SupportedLocale } from './types';

/** The resources object fed to i18next */
export const resources = {
  en: { translation: en },
  hi: { translation: hi },
  fr: { translation: fr },
  es: { translation: es },
} as const;

/**
 * Detect the best matching locale from the device.
 * Checks all device-preferred locales in order and returns the first match.
 */
export function detectDeviceLocale(): SupportedLocale {
  try {
    const deviceLocales = getLocales();
    const supportedCodes = new Set(SUPPORTED_LANGUAGES.map((l) => l.code));

    for (const locale of deviceLocales) {
      // Try exact match first (e.g. 'hi')
      const code = locale.languageCode?.toLowerCase() as SupportedLocale;
      if (code && supportedCodes.has(code)) {
        return code;
      }
    }
  } catch {
    // Expo Localization not available (e.g. SSR), fall back silently
  }

  return FALLBACK_LOCALE;
}

/**
 * Initialise i18next. Safe to call multiple times (idempotent).
 *
 * @param initialLocale – Override auto-detection with a specific locale
 *                        (e.g. from persisted user preference).
 */
export async function initI18n(initialLocale?: SupportedLocale): Promise<void> {
  if (i18n.isInitialized) {
    // Already running — just switch language if requested
    if (initialLocale && i18n.language !== initialLocale) {
      await i18n.changeLanguage(initialLocale);
    }
    return;
  }

  const lng = initialLocale ?? detectDeviceLocale();

  await i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: FALLBACK_LOCALE,
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false, // Avoid SSR / React Native issues
    },
  });
}

export { i18n };
