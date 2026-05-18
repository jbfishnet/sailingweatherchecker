/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ocean-dark': '#0f172a',
        'neon-blue': '#00f2ff',
        'neon-green': '#39ff14',
      },
      backgroundImage: {
        'carbon': "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')",
      }
    },
  },
  plugins: [],
}
