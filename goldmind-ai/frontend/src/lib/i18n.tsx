'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ─── Supported Locales ─────────────────────────────────────
export type Locale = 'id' | 'en';

// ─── Translation Type (nested keys) ────────────────────────
export type Translations = typeof import('./translations/id').default;

// ─── Context ───────────────────────────────────────────────
interface I18nContextType {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

// ─── Translation files ─────────────────────────────────────
import id from './translations/id';
import en from './translations/en';

const translations: Record<Locale, Translations> = { id, en };

// ─── Provider ──────────────────────────────────────────────
export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Always start with 'id' to match SSR output and avoid hydration mismatch.
  // The saved preference is applied in useEffect after hydration.
  const [locale, setLocaleState] = useState<Locale>('id');

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gm_locale', l);
      document.documentElement.lang = l;
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'id' ? 'en' : 'id');
  }, [locale, setLocale]);

  // Restore saved locale from localStorage after hydration
  useEffect(() => {
    const saved = localStorage.getItem('gm_locale') as Locale;
    if (saved === 'en') {
      setLocaleState(saved);
    }
    document.documentElement.lang = saved === 'en' ? 'en' : 'id';
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, t: translations[locale], setLocale, toggleLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
