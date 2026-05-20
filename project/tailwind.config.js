/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
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
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
