/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        // CSS replacements for framer-motion enter animations in always-loaded chrome (T-24).
        'menu-in': 'menu-in 200ms ease-out',
        'pop-in': 'pop-in 200ms ease-out',
        'page-in': 'page-in 180ms ease-out',
        'icon-spin': 'icon-spin 400ms ease-out',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
      },
      keyframes: {
        'menu-in': {
          '0%': { opacity: '0', transform: 'translateY(-0.5rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'page-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'icon-spin': {
          '0%': { opacity: '0', transform: 'rotate(-90deg) scale(0.6)' },
          '100%': { opacity: '1', transform: 'rotate(0) scale(1)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
