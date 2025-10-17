/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#16a34a', // emerald-600
          foreground: '#ecfdf5',
        },
      },
      borderRadius: {
        xl: '1rem',
      },
      boxShadow: {
        card: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 1px 2px rgba(0,0,0,0.4)',
      },
      container: {
        center: true,
        padding: '1rem',
        screens: {
          '2xl': '1200px',
        },
      },
    },
  },
  plugins: [],
}

