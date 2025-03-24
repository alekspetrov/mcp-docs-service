# Tests Directory Structure

This directory contains all test-related files for the MCP Documentation Service. The tests are organized into the following directories:

## Directory Structure

- `/unit` - Unit tests for individual components using Vitest
- `/integration` - Integration tests for testing multiple components together
- `/clients` - Client test scripts for manual testing
- `/manual` - Manual test scripts and utilities
- `/logs` - Log files generated during testing
- `/temp-data` - Temporary test data files
- `/docs-test` - Test documentation files
- `/test-client-docs` - Documentation files used by client tests
- `/test-docs-manual` - Documentation files used by manual tests
- `/test-docs-sdk` - Documentation files used by SDK tests
- `/test-raw-mcp` - Raw MCP test files

## Running Tests

To run the unit tests:

```bash
npm test
```

To run the integration tests:

```bash
npm run test:integration
```

To run client tests:

```bash
npm run test:clients
```

## Test Utilities

Common test utilities are located in `test-utils.ts` at the root of the tests directory.
