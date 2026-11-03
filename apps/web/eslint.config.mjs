import baseConfig from '@repo/eslint-config';

export default [
  ...baseConfig,

  // Ignore shadcn-generated UI components
  {
    ignores: ['src/components/ui/**'],
  },

  // Frontend-specific configuration
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {},
  },
];
