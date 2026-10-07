/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
        },
        ops: {
          dark: '#0f172a',
          sidebar: '#1e293b',
          surface: '#334155',
          border: '#475569',
          critical: '#ef4444',
          high: '#f97316',
          medium: '#eab308',
          normal: '#22c55e',
          info: '#3b82f6'
        }
      }
    },
  },
  plugins: [],
}
