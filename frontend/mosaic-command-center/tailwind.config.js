/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        rajdhani: ['Rajdhani', 'sans-serif'],
      },
      colors: {
        sentinel: {
          bg: '#050505',
          surface: '#0a0a0a',
          accent: '#ffffff',
          ai: '#ffffff',
          thinking: '#d1d5db',
          danger: '#ef4444',
          muted: '#9ca3af',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
