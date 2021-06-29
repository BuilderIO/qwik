module.exports = {
  preset: './dist-dev/@builder.io-qwik/testing/jest-preset.cjs',
  testPathIgnorePatterns: [
    '<rootDir>/.github/',
    '<rootDir>/.husky/',
    '<rootDir>/.vscode/',
    '<rootDir>/bin/',
    '<rootDir>/cypress/',
    '<rootDir>/dist/',
    '<rootDir>/dist-dev/',
    '<rootDir>/docs/',
    '<rootDir>/integration/',
    '<rootDir>/node_modules/',
  ],
  testRegex: '/src/.*\\.unit\\.(ts|tsx)$',
  modulePathIgnorePatterns: ['<rootDir>/dist', '<rootDir>/dist-dev'],
  moduleNameMapper: {
    '^@builder.io/qwik/jsx-runtime$': '<rootDir>/src/jsx_runtime.ts',
    '^@builder.io/qwik/optimizer$': '<rootDir>/src/optimizer/index.ts',
    '^@builder.io/qwik/testing$': '<rootDir>/src/testing/index.ts',
    '^@builder.io/qwik$': '<rootDir>/src/core/index.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/testing/jest/setuptestframework.ts'],
};
