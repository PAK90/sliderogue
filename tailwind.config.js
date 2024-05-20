/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        growIn: {
          "0%": { opacity: 0, transform: "scale(0)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        sway: {
          "0%": {
            transform: "rotate3d(1, 1, 0, 0deg)",
          },
          "20%": {
            transform: "rotate3d(1, 0.5, 0, 15deg)",
          },
          "40%": {
            transform: "rotate3d(0.5, 1, 0, 10deg)",
          },
          "60%": {
            transform: "rotate3d(1, 1, 0.5, 20deg)",
          },
          "80%": {
            transform: "rotate3d(0.5, 1, 1, 15deg)",
          },
          "100%": {
            transform: "rotate3d(1, 1, 0, 0deg)",
          },
        },
      },
      animation: {
        growIn: "growIn 200ms ease-out",
        sway: "sway 3s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};
