/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx}',
      './components/**/*.{js,ts,jsx,tsx}',
      './app/**/*.{js,ts,jsx,tsx}',
      './styles/**/*.css'
    ],
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          gray: {
            600: 'rgb(75, 85, 99)',
            700: 'rgb(55, 65, 81)',
            800: 'rgb(31, 41, 55)',
            900: 'rgb(17, 24, 39)',
          },
        },
      },
    },
    plugins: [],
  }
  