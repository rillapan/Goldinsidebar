'use client';

import React from 'react';
import { useI18n, type Locale } from '@/lib/i18n';
import { Globe } from 'lucide-react';

/**
 * Compact language toggle button — shows current locale and flag icon.
 * Place in the top-right corner of headers.
 */
export function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, toggleLocale, t } = useI18n();

  return (
    <button
      onClick={toggleLocale}
      className={`
        group relative flex items-center gap-1.5 rounded-full
        border border-brand-border bg-brand-card/60 backdrop-blur-md
        px-3 py-1.5 text-xs font-semibold
        text-gray-300 hover:text-white hover:border-amber-500/40
        hover:bg-amber-500/10
        transition-all duration-300 ease-out
        ${className}
      `}
      aria-label={`Switch language to ${locale === 'id' ? 'English' : 'Indonesia'}`}
      title={`Switch to ${locale === 'id' ? 'English' : 'Bahasa Indonesia'}`}
    >
      <Globe className="h-3.5 w-3.5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
      <span className="uppercase tracking-wider">{t.lang.label}</span>
      <span className="text-gray-600 group-hover:text-gray-400 transition-colors">/</span>
      <span className="uppercase tracking-wider text-gray-500 group-hover:text-amber-400 transition-colors">
        {t.lang.switch}
      </span>
    </button>
  );
}
