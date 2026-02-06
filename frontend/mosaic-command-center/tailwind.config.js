/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sentinel: {
          bg: '#0a0a0f',
          accent: '#00ff88',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
