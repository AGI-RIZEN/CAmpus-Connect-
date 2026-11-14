/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#F6F5FA',
        'background-dark': '#0F0E14',
        surface: '#FFFFFF',
        'surface-dark': '#1C1B24',
        primary: '#7C5CFA',
        'primary-dark': '#9478FF',
        ink: '#16151C',
        text: {
          primary: '#16151C',
          secondary: '#6B6A75',
          'primary-dark': '#F5F4FA',
          'secondary-dark': '#A6A4B3',
        },
        card: {
          lavender: '#E9E3FF',
          mint: '#DDF1EA',
          butter: '#FFF1C7',
          peach: '#FFE4D6',
          sky: '#DCEBFF',
          'lavender-dark': '#2C2B36',
          'mint-dark': '#2B2C34',
          'butter-dark': '#2E2C31',
          'peach-dark': '#2E2B32',
          'sky-dark': '#2B2C36',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        border: {
          light: '#ECEAF4',
          dark: '#2A2933',
        },
      },
      fontFamily: {
        poppins: ['Poppins_400Regular'],
        'poppins-medium': ['Poppins_500Medium'],
        'poppins-semibold': ['Poppins_600SemiBold'],
        'poppins-bold': ['Poppins_700Bold'],
      },
      fontSize: {
        display: ['32px', { lineHeight: '36px' }],
        h1: ['26px', { lineHeight: '30px' }],
        h2: ['20px', { lineHeight: '25px' }],
        body: ['15px', { lineHeight: '22px' }],
        caption: ['12px', { lineHeight: '16px' }],
      },
      borderRadius: {
        card: '28px',
        input: '16px',
      },
      spacing: {
        screen: '20px',
        gap: '12px',
      },
    },
  },
  plugins: [],
};
