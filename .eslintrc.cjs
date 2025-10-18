/* eslint-env node */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2024: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    project: null,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  settings: {
    react: { version: 'detect' },
  },
  ignorePatterns: ['node_modules/', 'vendor/', 'public/build/', 'dist/'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
};

