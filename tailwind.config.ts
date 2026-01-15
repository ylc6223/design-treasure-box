import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        highlight: 'var(--highlight)',
      },
      fontFamily: {
        display: ['SF Pro Display', '-apple-system', 'sans-serif'],
        body: ['SF Pro Text', '-apple-system', 'sans-serif'],
        mono: ['SF Mono', 'monospace'],
      },
      backdropBlur: {
        xl: '24px',
      },
    },
  },
  plugins: [],
}

export default config
