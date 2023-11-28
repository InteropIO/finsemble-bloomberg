module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  ignorePatterns: ['dist', '.eslintrc.js', 'webpack.config.js'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: [
        // 'eslint:recommended',
        // 'plugin:@typescript-eslint/recommended',
        // 'airbnb-typescript'
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      parserOptions: {
        project: ['./tsconfig.json'], // Specify it only for TypeScript files
      },
      rules: {
        // indent: ["error", "tab"],
        'no-tabs': 'off',
        "indent": "off",
        "linebreak-style": 0,
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/ban-ts-ignore": "off"
      }
    },

  ],
  extends: [
    // 'eslint:recommended',
    // 'plugin:@typescript-eslint/recommended',
    // 'airbnb-typescript'
    'eslint:recommended',
  ],
  rules: {
    // indent: ["error", "tab"],
    'no-tabs': 'off',
    "indent": "off",
    "linebreak-style": 0,
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/ban-ts-ignore": "off"
  }
};