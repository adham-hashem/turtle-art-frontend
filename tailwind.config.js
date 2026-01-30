/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary-green': '#22c55e',
        'primary-green-dark': '#16a34a',
        'primary-green-light': '#4ade80',
        'secondary-gray': '#e5e7eb',
      },
    },
  },
  plugins: [],
};
