/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary Greens - using centralized colors
        'primary-green': 'var(--color-primary-green)',
        'primary-green-dark': 'var(--color-primary-green-dark)',
        'primary-green-light': 'var(--color-primary-green-light)',
        'primary-green-hover': 'var(--color-primary-green-hover)',

        // Soft Accent Colors
        'accent-teal': 'var(--color-accent-teal)',
        'accent-lime': 'var(--color-accent-lime)',

        // Semantic Colors
        'success-green': 'var(--color-success)',
        'error-red': 'var(--color-error)',
        'warning-amber': 'var(--color-warning)',
        'info-blue': 'var(--color-info)',

        // Warm Neutral Palette
        'warm-gray-50': 'var(--color-warm-gray-50)',
        'warm-gray-100': 'var(--color-warm-gray-100)',
        'warm-gray-200': 'var(--color-warm-gray-200)',
        'warm-gray-300': 'var(--color-warm-gray-300)',
        'warm-gray-400': 'var(--color-warm-gray-400)',
        'warm-gray-500': 'var(--color-warm-gray-500)',
        'warm-gray-600': 'var(--color-warm-gray-600)',
        'warm-gray-700': 'var(--color-warm-gray-700)',
        'warm-gray-800': 'var(--color-warm-gray-800)',
        'warm-gray-900': 'var(--color-warm-gray-900)',

        // Comfort Colors
        'soft-white': 'var(--color-soft-white)',
        'soft-shadow': 'var(--color-soft-shadow)',
      },
    },
  },
  plugins: [],
};
