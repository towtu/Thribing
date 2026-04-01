/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
    "./core_ui/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        violet: {
          electric: "#8B5CF6",
        },
        pink: {
          bubblegum: "#F472B6",
        },
        cyan: {
          neon: "#22D3EE",
        },
        yellow: {
          sunburst: "#FACC15",
        },
        dark: "#1A1A2E",
        "dark-card": "#2A2A4A",
      },
      fontFamily: {
        heading: ["Nunito_800ExtraBold"],
        body: ["Nunito_600SemiBold"],
        regular: ["Nunito_400Regular"],
      },
      boxShadow: {
        cartoon: "4px 4px 0px 0px rgba(0,0,0,1)",
        "cartoon-sm": "2px 2px 0px 0px rgba(0,0,0,1)",
        "cartoon-lg": "6px 6px 0px 0px rgba(0,0,0,1)",
      },
    },
  },
  plugins: [],
};
