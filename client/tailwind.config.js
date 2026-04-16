/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00f2ff",    // Neon Cyan (Tactical)
        secondary: "#3b82f6",  // Cyber Blue
        success: "#10b981",    // Emerald
        danger: "#ff4b4b",     // Vivid Red
        obsidian: "#020617",   // Deep Navy Black
        surface: "rgba(10, 25, 47, 0.4)", // Translucent Navy
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
