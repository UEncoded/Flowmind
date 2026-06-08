/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Syne', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: {
          base:   '#f5f6fa',
          subtle: '#ffffff',
          muted:  '#f0efff',
          card:   '#ffffff',
          hover:  '#f8f7ff',
          active: '#ede9fe',
        },
        border: {
          faint:   '#f3f3f8',
          subtle:  '#ebebf0',
          default: '#e0dff0',
          strong:  '#c4c0e8',
        },
        text: {
          primary:   '#1a1a2e',
          secondary: '#6b6b8a',
          muted:     '#ababc4',
          disabled:  '#d0d0e0',
        },
        accent: {
          DEFAULT: '#6c5ce7',
          light:   '#8b7ff5',
          lighter: '#a29bfe',
          bg:      '#f0efff',
          border:  '#e0ddff',
        },
        teal:  { DEFAULT:'#00b894', bg:'#e8faf5', border:'#9fe1cb' },
        coral: { DEFAULT:'#e74c3c', bg:'#fdf0ee', border:'#f5c4b3' },
        amber: { DEFAULT:'#f9c74f', bg:'#fffbea', border:'#fde68a' },
        pink:  { DEFAULT:'#e84393', bg:'#fce7f3', border:'#fbcfe8' },
        green: { DEFAULT:'#00b894', bg:'#e8faf5', border:'#9fe1cb' },
        blue:  { DEFAULT:'#3b82f6', bg:'#eff6ff', border:'#bfdbfe' },
        orange:{ DEFAULT:'#fd7e14', bg:'#fff3e8', border:'#fed7aa' },
        yellow:{ DEFAULT:'#f9c74f', bg:'#fffbea', border:'#fde68a' },
      },
      borderRadius: {
        card: '16px',
        btn:  '10px',
        pill: '999px',
      },
      screens: { xs: '375px' },
      boxShadow: {
        card: '0 1px 3px rgba(108,92,231,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(108,92,231,0.10), 0 2px 4px rgba(0,0,0,0.04)',
      },
      animation: {
        'fade-up':   'fadeUp 0.35s ease both',
        'fade-in':   'fadeIn 0.25s ease both',
        'slide-in':  'slideIn 0.3s ease both',
        'pulse-dot': 'pulseDot 1.2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeUp:   { from:{ opacity:'0', transform:'translateY(10px)' }, to:{ opacity:'1', transform:'translateY(0)' } },
        fadeIn:   { from:{ opacity:'0' }, to:{ opacity:'1' } },
        slideIn:  { from:{ opacity:'0', transform:'translateX(-8px)' }, to:{ opacity:'1', transform:'translateX(0)' } },
        pulseDot: { '0%,100%':{ opacity:'1', transform:'scale(1)' }, '50%':{ opacity:'0.4', transform:'scale(0.75)' } },
      },
      spacing: {
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-t': 'env(safe-area-inset-top)',
      },
    },
  },
  plugins: [],
}
