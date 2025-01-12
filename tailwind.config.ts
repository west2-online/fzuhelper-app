import { type Config } from 'tailwindcss';

const config: Config = {
  content: ['./{app,components,constants,hooks}/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
