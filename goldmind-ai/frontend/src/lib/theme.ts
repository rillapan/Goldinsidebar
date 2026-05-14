export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'gm_theme';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'dark';
}

export function setTheme(theme: Theme): void {
  const html = document.documentElement;
  html.classList.remove('dark', 'light');
  html.classList.add(theme);
  localStorage.setItem(STORAGE_KEY, theme);
}
