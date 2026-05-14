'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { getStoredTheme, setTheme, type Theme } from '@/lib/theme';

export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setThemeState(getStoredTheme());
  }, []);

  const handleToggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setThemeState(next);
  };

  if (!mounted) {
    return <div className="w-[108px] h-7" />;
  }

  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-2.5">
      <Sun
        className={`w-4 h-4 flex-shrink-0 transition-colors duration-300 ${
          !isDark ? 'text-amber-500' : 'text-gray-500'
        }`}
      />

      <button
        onClick={handleToggle}
        role="switch"
        aria-checked={isDark}
        aria-label="Ganti mode tampilan gelap/terang"
        className={`
          relative inline-flex w-14 h-7 flex-shrink-0 rounded-full cursor-pointer
          transition-colors duration-300 ease-in-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
          ${isDark
            ? 'bg-slate-700 ring-1 ring-slate-600'
            : 'bg-amber-200 ring-1 ring-amber-300'}
        `}
      >
        <span
          className={`
            absolute top-1 w-5 h-5 rounded-full shadow-lg
            transition-all duration-300 ease-in-out
            ${isDark
              ? 'left-8 bg-slate-900'
              : 'left-1 bg-white shadow-amber-500/20'}
          `}
        />
      </button>

      <Moon
        className={`w-4 h-4 flex-shrink-0 transition-colors duration-300 ${
          isDark ? 'text-blue-400' : 'text-gray-400'
        }`}
      />
    </div>
  );
}
