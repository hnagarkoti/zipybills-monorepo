/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#007AFF',
          50: '#E5F2FF',
          100: '#CCE5FF',
          200: '#99CCFF',
          300: '#66B3FF',
          400: '#3399FF',
          500: '#007AFF',
          600: '#0062CC',
          700: '#004999',
          800: '#003166',
          900: '#001833',
        },
        secondary: {
          DEFAULT: '#5856D6',
          50: '#EEEEFC',
          100: '#DDDDF9',
          200: '#BCBBF3',
          300: '#9A99ED',
          400: '#7977E7',
          500: '#5856D6',
          600: '#4644AB',
          700: '#353380',
          800: '#232255',
          900: '#12112A',
        },
        success: '#34C759',
        warning: '#FF9500',
        error: '#FF3B30',
        background: {
          DEFAULT: '#FFFFFF',
          dark: '#000000',
        },
        surface: {
          DEFAULT: '#F5F5F5',
          dark: '#1C1C1E',
        },
      },
      screens: {
        'xs': '320px',   // Very small phones
        'sm': '640px',   // Phones
        'md': '768px',   // Tablets
        'lg': '1024px',  // Laptops
        'xl': '1280px',  // Desktops
        '2xl': '1536px', // Large desktops / 4K
        '3xl': '1920px', // Ultra-wide
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      fontFamily: {
        sans: ['System', 'sans-serif'],
        mono: ['Courier', 'monospace'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
        '5xl': ['48px', { lineHeight: '1' }],
      },
    },
  },
  plugins: [],
};
