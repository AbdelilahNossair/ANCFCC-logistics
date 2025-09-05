/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ANCFCC Brand Colors from logo
        ancfcc: {
          blue: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#1e5ba8', // Primary blue from logo
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
          },
          orange: {
            50: '#fff7ed',
            100: '#ffedd5',
            200: '#fed7aa',
            300: '#fdba74',
            400: '#fb923c',
            500: '#f97316',
            600: '#ea580c', // Primary orange from logo
            700: '#c2410c',
            800: '#9a3412',
            900: '#7c2d12',
          },
          brown: {
            50: '#fdf8f6',
            100: '#f2e8e5',
            200: '#eaddd7',
            300: '#e0cec7',
            400: '#d2bab0',
            500: '#bfa094',
            600: '#a18072', // Brown tone from logo
            700: '#8b6f47',
            800: '#746155',
            900: '#5f4e42',
          }
        }
      },
      backgroundImage: {
        'ancfcc-gradient': 'linear-gradient(135deg, #1e5ba8 0%, #ea580c 100%)',
        'ancfcc-gradient-soft': 'linear-gradient(135deg, #3b82f6 0%, #f97316 100%)',
      }
    },
  },
  plugins: [],
};