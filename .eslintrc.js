module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    // 'eslint:recommended',
    // 'plugin:@typescript-eslint/recommended',
    // 'airbnb-typescript'
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
  rules: {
    // indent: ["error", "tab"],
    'no-tabs': 'off',
    "indent": "off",
    "linebreak-style": 0,
    "@typescript-eslint/explicit-module-boundary-types": "off"
  }
};