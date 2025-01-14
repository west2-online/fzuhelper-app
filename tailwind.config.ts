import { type Config } from 'tailwindcss';

const config: Config = {
  content: ['./{app,components,constants,hooks}/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    colors: {
      primary: '#1089FF',
    },
    extend: {
      borderRadius: {
        '4xl': '2.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
