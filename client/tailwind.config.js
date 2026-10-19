/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary-green': '#176638',
        'dark-green': '#14532D',
        'hero-green': '#103D27',
        'saffron-orange': '#FFA500',
        'saffron-hover': '#FF9400',
        'saffron-light': '#FFF5E5',
        'bg-white': '#FFFFFF',
        'light-green': '#F4F7F4',
        'light-green-hover': '#EAF0EA',
        'main-text': '#24352A',
        'muted-text': '#5A6E61',
        'border-green': '#E1E8E1',
        // Dark Mode Palette
        'dark-bg': '#111827',
        'dark-secondary': '#18251F',
        'dark-card': '#1F2937',
        'dark-sidebar': '#14251C',
        'dark-border': '#374151',
        'dark-text': '#F9FAFB',
        'dark-muted': '#D1D5DB',
        'dark-primary': '#267A48',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(36, 53, 42, 0.05), 0 1px 2px rgba(36, 53, 42, 0.03)',
        'card-hover': '0 8px 24px rgba(23, 102, 56, 0.08), 0 2px 6px rgba(36, 53, 42, 0.04)',
        sidebar: '1px 0 0 #E1E8E1',
      },
    },
  },
  plugins: [],
};
