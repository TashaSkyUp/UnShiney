# UnShiney Tests

This directory contains tests for both the backend (Python) and frontend (JavaScript) components of the UnShiney web application.

## Directory Structure

```
tests/
├── backend/         # Python tests for server-side code
│   ├── test_app.py  # Tests for Flask application endpoints
│   └── test_model.py # Tests for UnShineyModel class
├── frontend/        # JavaScript tests for client-side code
│   └── test_drag_drop.js # Tests for drag-and-drop functionality
└── run_tests.py     # Script to run all backend tests
```

## Running Backend Tests

The backend tests use Python's built-in unittest framework. To run all backend tests:

```bash
python tests/run_tests.py
```

Or to run a specific test file:

```bash
python -m unittest tests/backend/test_app.py
python -m unittest tests/backend/test_model.py
```

## Running Frontend Tests

The frontend tests use Jest, a JavaScript testing framework. You'll need to install Node.js and npm, then install the required dependencies:

```bash
npm install --save-dev jest @testing-library/dom @testing-library/jest-dom
```

To run the frontend tests:

```bash
npx jest tests/frontend
```

## Writing New Tests

### Backend Tests

Add new test files to the `tests/backend` directory. Follow the pattern in existing test files:

```python
import unittest
# Import modules to test

class TestYourFeature(unittest.TestCase):
    def setUp(self):
        # Setup code runs before each test
        pass
        
    def test_something(self):
        # Test a specific functionality
        self.assertEqual(expected, actual)
```

### Frontend Tests

Add new test files to the `tests/frontend` directory. Follow the pattern in existing test files:

```javascript
// Mock DOM environment if needed
document.body.innerHTML = `...`;

describe('Feature Name', () => {
    beforeEach(() => {
        // Setup before each test
    });
    
    test('should do something', () => {
        // Test code
        expect(result).toBe(expected);
    });
});
```

## Test Coverage

To generate test coverage reports for backend tests, install the `coverage` package:

```bash
pip install coverage
```

Then run:

```bash
coverage run -m unittest discover -s tests/backend
coverage report
coverage html  # Generates an HTML report in htmlcov/
```

For frontend coverage:

```bash
npx jest --coverage
```
