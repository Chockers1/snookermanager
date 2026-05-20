/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0f14',
        sidebar: '#0f1720',
        surface: '#141e2a',
        'surface-light': '#1a2836',
        border: '#1e2d3d',
        'border-light': '#2a3f52',
        accent: '#22c55e',
        'accent-dark': '#16a34a',
        'accent-muted': '#166534',
        warning: '#f59e0b',
        danger: '#ef4444',
        'text-primary': '#ffffff',
        'text-secondary': '#9ca3af',
        'text-muted': '#6b7280',
        scm: {
          bg: '#07111f',
          deep: '#050b14',
          panel: '#0d1b2a',
          panelSoft: '#102033',
          panelHover: '#132b43',
          border: '#203449',
          borderStrong: '#31506f',
          text: '#f8fafc',
          textSoft: '#cbd5e1',
          textMuted: '#94a3b8',
          green: '#22c55e',
          greenDark: '#14532d',
          gold: '#f2b705',
          amber: '#f59e0b',
          red: '#ef4444',
          blue: '#38bdf8',
        },
      },
      boxShadow: {
        panel: '0 12px 30px rgba(0, 0, 0, 0.28)',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI Variable', 'Segoe UI', 'Tahoma', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}