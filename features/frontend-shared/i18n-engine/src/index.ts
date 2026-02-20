/**
 * FactoryOS i18n Engine – Shared Package
 *
 * Provides multilingual support with:
 *   - Offline-first bundled translations (en, hi, fr, es)
 *   - Device locale auto-detection via expo-localization
 *   - Runtime language switching (no reload required)
 *   - Persistent locale preference (localStorage / AsyncStorage)
 *
 * Usage:
 *   1. Wrap your app: <I18nProvider>{children}</I18nProvider>
 *   2. In components:  const { t } = useLocale();
 *   3. Switch lang:    const changeLang = useChangeLanguage();
 *                      changeLang('hi');
 */

// Provider
export { I18nProvider } from './I18nProvider';

// Hooks
export { useLocale, useChangeLanguage, useAvailableLanguages } from './hooks';

// Store
export { useLanguageStore } from './language-store';

// Init (rarely needed directly — prefer I18nProvider)
export { initI18n, detectDeviceLocale, i18n } from './i18n';

// Types
export {
  type SupportedLocale,
  type LanguageOption,
  type I18nState,
  SUPPORTED_LANGUAGES,
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
} from './types';
