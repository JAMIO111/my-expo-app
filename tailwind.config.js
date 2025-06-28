/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,ts,tsx,jsx}',
    './components/**/*.{js,ts,tsx,jsx}',
    './app/**/*.{js,ts,tsx,jsx}',
  ],

  presets: [require('nativewind/preset')],
  darkMode: 'class', // Enable dark mode support
  theme: {
    extend: {
      colors: {
        brand: 'var(--color-brand)',
        'brand-light': 'var(--color-brand-light)',
        'brand-dark': 'var(--color-brand-dark)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        background: 'var(--color-background)',
        'background-light': 'var(--color-background-light)',
        'background-dark': 'var(--color-background-dark)',
        'border-color': 'var(--color-border)',
        'input-background': 'var(--color-input-background)',
        'text-muted': 'var(--color-text-muted)',
      },
      fontFamily: {
        michroma: ['Michroma', 'sans-serif'],
        saira: ['Saira', 'sans-serif'],
        'saira-bold': ['Saira-Bold', 'sans-serif'],
        'saira-light': ['Saira-Light', 'sans-serif'],
        'saira-medium': ['Saira-Medium', 'sans-serif'],
        'saira-regular': ['Saira-Regular', 'sans-serif'],
        'saira-semibold': ['Saira-SemiBold', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
