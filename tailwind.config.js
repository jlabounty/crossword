/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        board: { bg: '#2d6a4f', cell: '#40916c', border: '#1b4332' },
        bonus: { dl: '#219ebc', tl: '#023e8a', dw: '#e07a5f', tw: '#c1121f' },
        tile: { bg: '#f2cc8f', hover: '#f4d9a8', selected: '#ffd60a', placed: '#e9c46a', text: '#264653' },
      },
    },
  },
  plugins: [],
};

