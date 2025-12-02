import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          black: '#20202a',
          DEFAULT: '#000000',
        },
        sand: {
          light: '#e5ded6',
          DEFAULT: '#eae6de',
        },
        gray: {
          dark: '#2c2c2c',
          DEFAULT: '#858180',
          light: '#f4f4f4',
        },
        success: {
          light: '#01c758',
          DEFAULT: '#29c115',
          dark: '#005927',
        },
        error: {
          light: '#ff2526',
          DEFAULT: '#c11515',
          dark: '#980001',
        },
        info: {
          light: '#eceff1',
          DEFAULT: '#blue-500',
          dark: '#blue-900',
        },
      },
      fontFamily: {
        freight: ['FreightBigProBlack-Regular', 'serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
        haas: ['Neue Haas Grotesk Display Pro', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['44px', { lineHeight: '44px', fontWeight: '900' }],
        'display-lg': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'title-lg': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'title-md': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'title-sm': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28.8px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '25.6px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '22.4px', fontWeight: '400' }],
        'button': ['16px', { lineHeight: 'normal', fontWeight: '500' }],
      },
      spacing: {
        '7': '28px',
        '15': '60px',
        '18': '72px',
      },
      borderRadius: {
        'card': '16px',
        'button-lg': '14px',
        'button-md': '12px',
        'button-sm': '8px',
        'input': '8px',
      },
      height: {
        'button': '52px',
        'header': '64px',
      },
      backgroundImage: {
        'gradient-overlay': 'linear-gradient(180deg, rgba(255,255,255,0) 7.242%, #ffffff 61.522%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        shimmer: {
          '100%': {
            transform: 'translateX(100%)',
          },
        },
        wave: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        wave: 'wave 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
