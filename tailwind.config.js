/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary Green (Enhanced - more vibrant emerald)
        'primary-green': '#10b981',
        'primary-green-dark': '#059669',
        'primary-green-light': '#34d399',
        'primary-green-hover': '#0d9668',

        // Accent Colors
        'accent-teal': '#14b8a6',
        'accent-lime': '#84cc16',

        // Semantic Colors (Enhanced)
        'success-green': '#10b981',
        'success-green-light': '#d1fae5',
        'error-red': '#ef4444',
        'error-red-light': '#fee2e2',
        'warning-amber': '#f59e0b',
        'warning-amber-light': '#fef3c7',
        'info-blue': '#3b82f6',
        'info-blue-light': '#dbeafe',

        // Neutral Palette (Refined)
        'neutral-50': '#fafafa',
        'neutral-100': '#f5f5f5',
        'neutral-200': '#e5e5e5',
        'neutral-300': '#d4d4d4',
        'neutral-700': '#404040',
        'neutral-800': '#262626',
        'neutral-900': '#171717',

        // Legacy support (keeping old names for backward compatibility)
        'secondary-gray': '#e5e5e5',
      },
    },
  },
  plugins: [],
};
