import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Fantasy color palette
        parchment: {
          50: '#fdfcf9',
          100: '#f9f5eb',
          200: '#f3ead4',
          300: '#e9d9b5',
          400: '#dbc48f',
          500: '#d0b06e',
          DEFAULT: '#f9f5eb',
        },
        ink: {
          50: '#f6f6f7',
          100: '#e3e3e5',
          200: '#c6c6cb',
          300: '#a2a2aa',
          400: '#7d7d88',
          500: '#64646e',
          600: '#4f4f58',
          700: '#414148',
          800: '#38383d',
          900: '#2a2a2e',
          950: '#1a1a1d',
          DEFAULT: '#2a2a2e',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#d4a418',
          600: '#b8860b',
          700: '#92670a',
          800: '#78540f',
          900: '#654413',
          950: '#3a2507',
          DEFAULT: '#d4a418',
        },
        blood: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#dc2626',
          600: '#b91c1c',
          700: '#8b1a1a',
          800: '#6b1515',
          900: '#450a0a',
          950: '#2d0606',
          DEFAULT: '#8b1a1a',
        },
        shadow: {
          50: '#f4f4f5',
          100: '#e8e8ea',
          200: '#d1d1d6',
          300: '#a9a9b4',
          400: '#7e7e8c',
          500: '#5c5c6a',
          600: '#47475a',
          700: '#3b3b4c',
          800: '#2e2e3d',
          900: '#1e1e2a',
          950: '#12121a',
          DEFAULT: '#1e1e2a',
        },
      },
      fontFamily: {
        // Serif for headers - Cinzel for fantasy feel
        serif: ['Cinzel', 'Georgia', 'Times New Roman', 'serif'],
        // Sans for body - Inter for readability
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'display': ['3.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'heading-1': ['2.5rem', { lineHeight: '1.2', fontWeight: '600' }],
        'heading-2': ['2rem', { lineHeight: '1.25', fontWeight: '600' }],
        'heading-3': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-4': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
      },
      boxShadow: {
        'fantasy': '0 4px 6px -1px rgba(26, 26, 29, 0.1), 0 2px 4px -2px rgba(26, 26, 29, 0.1)',
        'fantasy-lg': '0 10px 15px -3px rgba(26, 26, 29, 0.15), 0 4px 6px -4px rgba(26, 26, 29, 0.1)',
        'gold-glow': '0 0 15px rgba(212, 164, 24, 0.3)',
        'blood-glow': '0 0 15px rgba(139, 26, 26, 0.3)',
      },
      borderRadius: {
        'fantasy': '0.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
