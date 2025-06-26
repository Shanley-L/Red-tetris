module.exports = {
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  testEnvironment: 'jsdom',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 50,
      functions: 70,
      lines: 70
    }
  }
};
