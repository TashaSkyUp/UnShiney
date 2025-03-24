// Import Jest DOM extensions for DOM testing capabilities
import '@testing-library/jest-dom';

// Global setup for all tests
beforeAll(() => {
  // Mock window methods not available in Jest DOM environment
  window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
  };
  
  // Mock Chart.js to prevent errors when tests run
  global.Chart = class {
    constructor() {
      this.data = {
        labels: [],
        datasets: []
      };
    }
    update() {}
    destroy() {}
  };
});

// Clean up after all tests are done
afterAll(() => {
  // Any cleanup needed after all tests
});
