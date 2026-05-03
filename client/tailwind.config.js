/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          950: "#07070c",
          900: "#0b0b12",
          800: "#10101a"
        },
        neon: {
          cyan: "#22d3ee",
          pink: "#f472b6",
          violet: "#a78bfa",
          lime: "#a3e635"
        }
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(34,211,238,0.35), 0 0 24px rgba(34,211,238,0.18)",
        neonPink: "0 0 0 1px rgba(244,114,182,0.35), 0 0 28px rgba(244,114,182,0.18)"
      },
      backgroundImage: {
        hero:
          "radial-gradient(800px 400px at 20% 10%, rgba(34,211,238,0.18), transparent 60%), radial-gradient(600px 360px at 70% 20%, rgba(244,114,182,0.16), transparent 65%), radial-gradient(700px 380px at 45% 85%, rgba(167,139,250,0.12), transparent 60%)"
      }
    }
  },
  plugins: []
};

