/**
 * LanguageSettings – Runtime language picker
 *
 * Shows all supported languages with flag, native name, and English name.
 * Tap to switch instantly (no reload). Persists to local storage
 * and (optionally) syncs to the backend user profile.
 */
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Check, Globe, Info } from 'lucide-react-native';
import {
  useLocale,
  useChangeLanguage,
  useAvailableLanguages,
  type SupportedLocale,
} from '@zipybills/i18n-engine';

export function LanguageSettings() {
  const { t, locale } = useLocale();
  const changeLanguage = useChangeLanguage();
  const languages = useAvailableLanguages();

  return (
    <View>
      {/* Header */}
      <View className="mb-6">
        <View className="flex-row items-center gap-2 mb-1">
          <Globe size={20} color="#3B82F6" />
          <Text className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t('settings.selectLanguage')}
          </Text>
        </View>
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          {t('settings.languageDesc')}
        </Text>
      </View>

      {/* Language List */}
      <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-6">
        {languages.map((lang, index) => {
          const isActive = locale === lang.code;
          return (
            <Pressable
              key={lang.code}
              onPress={() => changeLanguage(lang.code as SupportedLocale)}
              className={`
                flex-row items-center px-5 py-4 active:bg-gray-50 dark:active:bg-gray-800
                ${index > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''}
                ${isActive ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
              `}
            >
              {/* Flag */}
              <Text className="text-2xl mr-4" style={{ width: 36, textAlign: 'center' }}>
                {lang.flag}
              </Text>

              {/* Labels */}
              <View className="flex-1">
                <Text
                  className={`text-base font-semibold ${
                    isActive
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {lang.nativeName}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {lang.englishName}
                </Text>
              </View>

              {/* Check mark */}
              {isActive && (
                <View className="w-7 h-7 rounded-full bg-blue-500 items-center justify-center">
                  <Check size={16} color="#FFFFFF" strokeWidth={3} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Info note */}
      <View className="flex-row items-start gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
        <Info size={16} color="#6B7280" style={{ marginTop: 2 }} />
        <Text className="text-xs text-gray-500 dark:text-gray-400 flex-1 leading-5">
          {t('settings.restartNotRequired')}
        </Text>
      </View>
    </View>
  );
}
