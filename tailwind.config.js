const colors = require('tailwindcss/colors');

/**
 * @type {import('tailwindcss/tailwind-config').TailwindConfig}
 */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Keep custom colors from Charcoal
        primary: "#856292",
        "primary-hover": "#8E76A1",
        "primary-press": "#988BB0",
        "primary-disabled": "#6F48694D",
        secondary: "#FF617F",
        "secondary-hover": "#FF849B",
        "secondary-press": "#FF9EB1",
        "secondary-disabled": "#FF617F4D",
        base: "#FBE2CA",
        "text-primary": "#514062",
        // Add standard Tailwind colors explicitly
        gray: colors.gray,
        blue: colors.blue,
        red: colors.red,
        yellow: colors.yellow,
        green: colors.green,
        purple: colors.purple,
        indigo: colors.indigo,
        pink: colors.pink,
        white: '#ffffff',
        black: '#000000',
      },
      fontFamily: {
        M_PLUS_2: ["Montserrat", "M_PLUS_2", "sans-serif"],
        Montserrat: ["Montserrat", "sans-serif"],
      },
      spacing: {
        '104': '26rem',
      },
      borderRadius: {
        '8': '8px',
        '12': '12px',
        '16': '16px',
      }
    },
  },
  plugins: [],
};