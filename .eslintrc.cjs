module.exports =
{
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/strict-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime"
  ],
  settings: {
    react: {
      version: "detect"
    }
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: [
    "@typescript-eslint"
  ],
  rules: {
    "@typescript-eslint/strict-boolean-expressions": [
      2,
      {
        "allowString": false,
        "allowNumber": false
      }
    ],
    "@typescript-eslint/no-unused-vars": ["warn", {
      varsIgnorePattern: "^_",
      argsIgnorePattern: "^_",
    }],
    "@typescript-eslint/restrict-template-expressions": "off",
    "@typescript-eslint/no-confusing-void-expression": "off",
  },
  ignorePatterns: ["src/**/*.test.ts", ".eslintrc.cjs"]
};
