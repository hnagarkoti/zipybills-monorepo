/** @type {import('tailwindcss').Config} */
const baseConfig = require('../../tools/nativewind-config/tailwind.config.js');

module.exports = {
  ...baseConfig,
  content: [
    './App.{js,jsx,ts,tsx}',
    './index.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    '../../features/auth/auth-frontend/src/**/*.{js,jsx,ts,tsx}',
    '../../features/dashboard/dashboard-frontend/src/**/*.{js,jsx,ts,tsx}',
    '../../features/downtime/downtime-frontend/src/**/*.{js,jsx,ts,tsx}',
    '../../features/home/home-frontend/src/**/*.{js,jsx,ts,tsx}',
    '../../features/machines/machines-frontend/src/**/*.{js,jsx,ts,tsx}',
    '../../features/planning/planning-frontend/src/**/*.{js,jsx,ts,tsx}',
    '../../features/reports/reports-frontend/src/**/*.{js,jsx,ts,tsx}',
    '../../features/shifts/shifts-frontend/src/**/*.{js,jsx,ts,tsx}',
    '../../features/frontend-shared/ui-components/src/**/*.{js,jsx,ts,tsx}',
    '../../features/settings/settings-frontend/src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
};
