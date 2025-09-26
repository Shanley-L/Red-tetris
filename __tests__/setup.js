// Test setup file for Jest
// This file is automatically loaded before all tests

import '@testing-library/jest-dom';

// Polyfill for TextEncoder/TextDecoder
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Uncomment the following lines to suppress console.log during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock socket.io for client tests
jest.mock('socket.io-client', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

// React Router mocks are handled in individual test files
