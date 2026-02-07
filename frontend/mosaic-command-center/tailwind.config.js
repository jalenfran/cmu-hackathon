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
          surface: '#0f0f19',
          accent: '#10b981',
          ai: '#38bdf8',
          thinking: '#a78bfa',
          danger: '#ef4444',
          warning: '#f59e0b',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
