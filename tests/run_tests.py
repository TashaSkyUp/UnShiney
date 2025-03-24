#!/usr/bin/env python3
"""
Script to run all backend tests for the UnShiney web application.
This script discovers and runs all test files in the tests/backend directory.
"""

import os
import sys
import unittest

# Add the parent directory to sys.path to allow importing app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def run_all_tests():
    """Discover and run all tests in the backend directory"""
    # Create a test loader
    loader = unittest.TestLoader()
    
    # Find all tests in the backend directory
    test_dir = os.path.join(os.path.dirname(__file__), 'backend')
    test_suite = loader.discover(test_dir, pattern='test_*.py')
    
    # Create a test runner
    runner = unittest.TextTestRunner(verbosity=2)
    
    # Run the tests
    result = runner.run(test_suite)
    
    # Return appropriate exit code (0 if all tests passed, 1 otherwise)
    return 0 if result.wasSuccessful() else 1

if __name__ == '__main__':
    print("Running all UnShiney backend tests...")
    
    # Print separator for better readability
    print("=" * 70)
    
    # Run tests and get exit code
    exit_code = run_all_tests()
    
    # Print summary
    if exit_code == 0:
        print("\n✅ All tests passed successfully!")
    else:
        print("\n❌ Some tests failed. See details above.")
    
    # Exit with appropriate code
    sys.exit(exit_code)
