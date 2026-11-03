import baseConfig from '@repo/eslint-config';

export default [
  ...baseConfig,
  {
    files: ['src/**/*.ts'],
    rules: {
      // Backend-specific rules can go here.
    },
  },
];
