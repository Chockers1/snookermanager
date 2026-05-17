/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
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
        sans: ['Segoe UI Variable', 'Segoe UI', 'Tahoma', 'sans-serif'],
      },
    },
  },
  plugins: [],
}