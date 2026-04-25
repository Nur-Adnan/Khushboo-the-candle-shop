import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export const THEME_COLORS = {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  card: 'hsl(var(--card))',
  popover: 'hsl(var(--popover))',
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  muted: 'hsl(var(--muted))',
  accent: 'hsl(var(--accent))',
  destructive: 'hsl(var(--destructive))',
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
  radius: 'var(--radius)',
} as const;

export const NAV_THEME = {
  light: {
    ...DefaultTheme,
    dark: false,
    colors: {
      ...DefaultTheme.colors,
      background: 'hsl(34 100% 98%)',
      border: 'hsl(28 28% 84%)',
      card: 'hsl(0 0% 100%)',
      notification: 'hsl(0 72% 51%)',
      primary: 'hsl(26 44% 37%)',
      text: 'hsl(24 31% 14%)',
    },
  },
  dark: {
    ...DarkTheme,
    dark: true,
    colors: {
      ...DarkTheme.colors,
      background: 'hsl(24 31% 8%)',
      border: 'hsl(24 16% 24%)',
      card: 'hsl(24 28% 12%)',
      notification: 'hsl(0 72% 51%)',
      primary: 'hsl(34 78% 78%)',
      text: 'hsl(34 100% 96%)',
    },
  },
} satisfies Record<'light' | 'dark', Theme>;
