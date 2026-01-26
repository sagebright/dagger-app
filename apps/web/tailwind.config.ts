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
          400: '#e5bc7a',
          500: '#d7a964',  // Demiplane gold
          600: '#c49a58',
          700: '#a67d3d',
          800: '#8a6530',
          900: '#6e5026',
          950: '#3a2507',
          DEFAULT: '#d7a964',
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
          // Deep purple palette (from TTRPG persona - Demiplane inspired)
          50: '#f4f4f8',
          100: '#e8e6f0',
          200: '#d1cce1',
          300: '#a99bc5',
          400: '#7b6aa8',
          500: '#5c4a8a',
          600: '#4a3873',
          700: '#3d2d5e',
          800: '#2d1a6b',  // Elevated purple
          900: '#22145B',  // Surface purple
          950: '#1a0f3a',  // Background - deep purple-black
          DEFAULT: '#22145B',
        },
        // Rarity system (from D&D Beyond - for game content)
        rarity: {
          common: '#9ca3af',
          uncommon: '#7ebe15',
          rare: '#41a9f2',
          legendary: '#ffb62a',
          artifact: '#c364e7',
        },
        // Magic accent color
        magic: {
          DEFAULT: '#c364e7',
          light: '#d17cf0',
          dark: '#9b4dbd',
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
        'fantasy': '0 4px 6px -1px rgba(26, 15, 58, 0.2), 0 2px 4px -2px rgba(26, 15, 58, 0.15)',
        'fantasy-lg': '0 10px 15px -3px rgba(26, 15, 58, 0.25), 0 4px 6px -4px rgba(26, 15, 58, 0.15)',
        // Glow effects (from TTRPG persona)
        'gold-glow': '0 0 20px rgba(215, 169, 100, 0.4)',
        'gold-glow-subtle': '0 0 15px rgba(215, 169, 100, 0.2)',
        'magic-glow': '0 0 20px rgba(195, 100, 231, 0.4)',
        'legendary-glow': '0 0 30px rgba(255, 182, 42, 0.5)',
        'blood-glow': '0 0 15px rgba(198, 0, 0, 0.4)',
        // Elevation scale
        'elevation-1': '0 2px 4px rgba(0, 0, 0, 0.3)',
        'elevation-2': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'elevation-3': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'elevation-4': '0 16px 48px rgba(0, 0, 0, 0.6)',
      },
      borderRadius: {
        'fantasy': '0.5rem',
      },
      /* ==========================================================================
       * Focus Ring Configuration
       *
       * Consistent keyboard accessibility pattern for all interactive elements.
       *
       * Copy-paste pattern for inline Tailwind usage:
       * focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-parchment-100 dark:focus:ring-offset-shadow-900
       *
       * Or use the .focus-ring utility class from globals.css
       * ========================================================================== */
      ringColor: {
        DEFAULT: '#e5bc7a', // gold-400 - primary focus ring color
      },
      ringOffsetColor: {
        DEFAULT: '#f9f5eb', // parchment-100 - light mode offset
      },
    },
  },
  plugins: [],
};

export default config;
