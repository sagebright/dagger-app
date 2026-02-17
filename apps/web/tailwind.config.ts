import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          surface: 'var(--bg-surface)',
          'surface-hover': 'var(--bg-surface-hover)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        gold: {
          DEFAULT: 'var(--accent-gold)',
          hover: 'var(--accent-gold-hover)',
          dim: 'var(--accent-gold-dim)',
          border: 'var(--accent-gold-border)',
          glow: 'var(--accent-gold-glow)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          medium: 'var(--border-medium)',
          hover: 'var(--border-hover)',
        },
        'user-msg': 'var(--user-msg-bg)',
        // NPC role colors
        role: {
          leader: '#d4a574',
          antagonist: '#db7e7e',
          oracle: '#8bc4a8',
          scout: '#8badc4',
          minor: '#a09590',
        },
        // Adversary type colors
        adversary: {
          bruiser: '#e07c5a',
          minion: '#8b9dc3',
          leader: '#c98bdb',
          solo: '#db6b6b',
        },
        // Item type colors
        item: {
          weapon: '#d4836d',
          armor: '#8b9fb8',
          consumable: '#8bc4a8',
          generic: '#c4b08b',
        },
      },
      fontFamily: {
        serif: ['Source Serif 4', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        'dropdown': '0 8px 24px rgba(0, 0, 0, 0.3)',
        'focus-gold': '0 0 0 3px var(--accent-gold-glow)',
        'hover-gold': '0 0 16px var(--accent-gold-glow)',
      },
      spacing: {
        'message-gap': 'var(--message-gap)',
        'section-padding': 'var(--section-padding)',
        'panel-padding': 'var(--panel-padding)',
      },
      animation: {
        'message-appear': 'message-appear 0.35s ease-out both',
        'thinking-pulse': 'thinking-pulse 1.6s ease-in-out infinite',
        'cursor-blink': 'cursor-blink 0.8s step-end infinite',
        'confirmation-shimmer': 'confirmation-shimmer 0.8s ease-out forwards',
        'stage-enter': 'stage-transition 0.3s ease-out both',
      },
      keyframes: {
        'message-appear': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'thinking-pulse': {
          '0%, 100%': { opacity: '0.15', transform: 'scale(0.8)' },
          '50%': { opacity: '0.95', transform: 'scale(1.05)' },
        },
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'confirmation-shimmer': {
          '0%': { 'background-position': '-200% center' },
          '100%': { 'background-position': '200% center' },
        },
        'stage-transition': {
          from: { opacity: '0', transform: 'translateX(8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
