/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#a855f7",    // Purple 500 (Electric Amethyst)
        secondary: "#3b82f6",  // Blue 500 (Cyber Blue)
        success: "#22c55e",    // Emerald 500
        danger: "#ef4444",     // Red 500
        obsidian: "#05070a",   // Custom Ultra Black
        surface: "rgba(255, 255, 255, 0.03)", // Glass base
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
