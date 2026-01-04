/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./{App,index}.tsx",
    "./{app,components,lib}/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        scroll: 'scroll 40s linear infinite',
      },
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
