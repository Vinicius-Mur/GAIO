/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#221F3B',
          800: '#2D294A',
          700: '#3A355A'
        },
        accent: {
          500: '#D4A72C',
          100: '#F7E9BB'
        },
        surface: {
          50: '#F4F3F7',
          100: '#ECEAF2'
        }
      },
      borderRadius: {
        xl2: '1.25rem'
      },
      boxShadow: {
        soft: '0 8px 24px rgba(34, 31, 59, 0.08)'
      },
      fontFamily: {
        serifBrand: ['Georgia', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      letterSpacing: {
        wide2: '0.12em'
      }
    }
  },
  plugins: []
};
