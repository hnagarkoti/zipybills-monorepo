/**
 * I18nProvider – Root provider for internationalisation in FactoryOS.
 *
 * Handles:
 *  1. Hydrating the persisted locale from storage
 *  2. Initialising i18next with the correct language
 *  3. Syncing language changes between the Zustand store and i18next
 *
 * Place this high in the component tree (before ThemeProvider is fine).
 */
import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';

import { i18n, initI18n } from './i18n';
import { useLanguageStore } from './language-store';
import type { SupportedLocale } from './types';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [ready, setReady] = useState(i18n.isInitialized);
  const locale = useLanguageStore((s) => s.locale);
  const isHydrated = useLanguageStore((s) => s.isHydrated);

  // Initialise i18next once the store has rehydrated from storage
  useEffect(() => {
    if (!isHydrated) return;

    initI18n(locale as SupportedLocale).then(() => {
      setReady(true);
    });
  }, [isHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep i18next in sync when the user switches language at runtime
  useEffect(() => {
    if (ready && i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale, ready]);

  // Don't render children until i18next is ready
  // (avoids flash of untranslated keys)
  if (!ready) return null;

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
