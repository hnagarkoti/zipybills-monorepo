/** @type {import('tailwindcss').Config} */
const baseConfig = require('../../tools/nativewind-config/tailwind.config.js');

module.exports = {
  ...baseConfig,
  content: [
    './App.{js,jsx,ts,tsx}',
    './index.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    '../../features/barcode-feature/**/home-frontend/src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
};
