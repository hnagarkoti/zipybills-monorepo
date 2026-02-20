/**
 * Convenience React hooks for i18n operations in FactoryOS.
 *
 * These wrap react-i18next and the language store to give
 * components a clean, type-safe API.
 */
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguageStore } from './language-store';
import {
  SUPPORTED_LANGUAGES,
  type LanguageOption,
  type SupportedLocale,
} from './types';

/**
 * Primary hook — returns t(), current locale, and i18n instance.
 * Use exactly like `useTranslation()` from react-i18next.
 */
export function useLocale() {
  const { t, i18n } = useTranslation();
  const locale = useLanguageStore((s) => s.locale);

  return { t, i18n, locale: locale as SupportedLocale };
}

/**
 * Hook to switch the app language at runtime.
 * Persists the choice and updates i18next in one call.
 */
export function useChangeLanguage() {
  const setLocale = useLanguageStore((s) => s.setLocale);
  const { i18n } = useTranslation();

  const changeLanguage = useCallback(
    async (code: SupportedLocale) => {
      await i18n.changeLanguage(code);
      setLocale(code);
    },
    [i18n, setLocale],
  );

  return changeLanguage;
}

/**
 * Get the list of all available languages with metadata.
 */
export function useAvailableLanguages(): LanguageOption[] {
  return SUPPORTED_LANGUAGES;
}
