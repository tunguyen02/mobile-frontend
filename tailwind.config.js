/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3E3E3F',
        },
        secondary: {
          DEFAULT: '#ffa726',
        },
      }
    },
  },
  plugins: [],
}

