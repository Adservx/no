/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Background Colors
        dark: {
          primary: '#0F0F0F',
          secondary: '#1A1A1A',
          tertiary: '#222222',
          elevated: '#2A2A2A',
          hover: '#333333',
        },
        // Orange Accent Palette
        accent: {
          DEFAULT: '#FF9000',
          primary: '#FF9000',
          secondary: '#FF6600',
          hover: '#FFA500',
          glow: 'rgba(255, 144, 0, 0.3)',
          subtle: 'rgba(255, 144, 0, 0.1)',
        },
        // Border Colors
        border: {
          DEFAULT: '#333333',
          hover: '#444444',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.5)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.5)',
        'lg': '0 10px 25px rgba(0, 0, 0, 0.6)',
        'accent': '0 0 20px rgba(255, 144, 0, 0.3)',
        'glow': '0 0 15px rgba(255, 144, 0, 0.3)',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '250ms',
        'slow': '400ms',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
      },
      zIndex: {
        'dropdown': '100',
        'sticky': '200',
        'fixed': '300',
        'modal': '400',
        'tooltip': '500',
      },
    },
  },
  plugins: [],
};
