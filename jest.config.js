module.exports = {
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // Focus coverage on mandatory part only; exclude bonus and non-mandatory infra
  collectCoverageFrom: [
    // Mandatory server logic/classes/errors
    'server/classes/**/*.js',
    'server/logic/gameLogic.js',
    'server/errors/index.js',
    // Mandatory client
    'client/components/**/*.{js,jsx}',
    'client/pages/HomePage.jsx',
    'client/pages/GamePage.jsx',
    'client/index.jsx',
    // Exclusions
    '!server/server.js',
    '!server/logic/BONUS/**',
    '!client/pages/BONUS/**',
    '!server/database.js',
    '!server/scoreStore.js',
    '!server/socket.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 50,
      functions: 70,
      lines: 70
    }
  },
  testMatch: [
    '**/__tests__/**/*.test.{js,jsx}',
    '**/?(*.)+(spec|test).{js,jsx}'
  ]
};
