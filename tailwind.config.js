/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#F6F7FB',
        'background-dark': '#0E1116',
        surface: '#FFFFFF',
        'surface-dark': '#171B22',
        primary: '#2F6FED',
        'primary-dark': '#5B8DFF',
        ink: '#101828',
        text: {
          primary: '#101828',
          secondary: '#5B6472',
          'primary-dark': '#F2F4F8',
          'secondary-dark': '#9AA3B2',
        },
        card: {
          lavender: '#E3E8F5',
          mint: '#DCEEEA',
          butter: '#F5ECD7',
          peach: '#F5E2DC',
          sky: '#DCEAF8',
          'lavender-dark': '#222838',
          'mint-dark': '#1E2A29',
          'butter-dark': '#2A2721',
          'peach-dark': '#2A221F',
          'sky-dark': '#1E2733',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        border: {
          light: '#E4E7EE',
          dark: '#242A33',
        },
      },
      fontFamily: {
        poppins: ['Poppins_400Regular'],
        'poppins-medium': ['Poppins_500Medium'],
        'poppins-semibold': ['Poppins_600SemiBold'],
        'poppins-bold': ['Poppins_700Bold'],
      },
      fontSize: {
        display: ['38px', { lineHeight: '42px' }],
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
