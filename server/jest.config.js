/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '@gambit-chess/shared': '<rootDir>/../shared/src'
  },
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json'
    }]
  },
  coveragePathIgnorePatterns: [
    'node_modules/',
    'dist/',
    'tests/'
  ],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  verbose: true,
  "collectCoverage": true,
  "coverageDirectory": "coverage"
} 