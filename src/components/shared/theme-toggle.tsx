'use client';

import { useTheme } from '@/hooks/use-theme';

const THEME_OPTIONS = [
  { value: 'light', label: 'ライト', icon: '○' },
  { value: 'dark', label: 'ダーク', icon: '●' },
  { value: 'system', label: 'システム', icon: '◐' },
] as const;

export function ThemeToggle(): React.ReactElement {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center gap-0.5 rounded-[var(--radius-full)] border border-border bg-surface p-1">
      {THEME_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setTheme(option.value)}
          className={`flex items-center gap-1.5 rounded-[var(--radius-full)] px-3 py-1.5 text-sm transition-colors ${
            theme === option.value
              ? 'bg-primary text-white'
              : 'text-ink-muted hover:text-foreground'
          }`}
          aria-label={`${option.label}モードに切替`}
          aria-pressed={theme === option.value}
        >
          <span aria-hidden="true">{option.icon}</span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
