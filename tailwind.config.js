const colors = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter Variable', 'Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // surface and card tones for the dark theme
        surface: colors.slate[950],
        card: colors.slate[800],
        accent: colors.indigo[500]
      },
      backgroundColor: {
        'button': colors.gray[600],
        'drop-down': colors.zinc[300]
      },
    },
  },
  plugins: [],
}
