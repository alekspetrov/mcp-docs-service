---
title: Documentation Validation
description: Guide for validating documentation quality with the MCP Docs Manager
author: Claude
date: 2024-06-01
tags:
  - guide
  - validation
  - quality
status: published
order: 5
---

# Documentation Validation

This guide explains how to use the documentation validation features of the MCP Docs Manager service to ensure high-quality documentation.

## Validating Links

You can check for broken internal links in your documentation using the `validate_documentation_links` tool:

```javascript
const result = await mcp.callTool("tools/call", {
  name: "validate_documentation_links",
  arguments: {
    basePath: "docs",
    recursive: true,
  },
});
```

This will scan all markdown files in the specified directory (and subdirectories if `recursive` is `true`) and check for broken internal links. The tool will return a list of broken links with their file paths and line numbers.

## Validating Metadata

You can ensure that all documents have the required metadata fields using the `validate_documentation_metadata` tool:

```javascript
const result = await mcp.callTool("tools/call", {
  name: "validate_documentation_metadata",
  arguments: {
    basePath: "docs",
    requiredFields: ["title", "description", "status", "date"],
  },
});
```

This will check all markdown files in the specified directory for the required metadata fields and return a list of files with missing fields. If `requiredFields` is not specified, the tool will check for the default required fields: `title`, `description`, and `status`.

## Checking Documentation Health

For a comprehensive health check of your documentation, you can use the `check_documentation_health` tool:

```javascript
const result = await mcp.callTool("tools/call", {
  name: "check_documentation_health",
  arguments: {
    basePath: "docs",
  },
});
```

This will perform a comprehensive health check of your documentation, including:

- Checking for missing metadata
- Identifying orphaned documents (not included in navigation)
- Calculating an overall health score

## Understanding the Health Score

The documentation health score is calculated based on several factors:

1. **Metadata Completeness**: The percentage of required metadata fields that are present across all documents.
2. **Orphaned Documents**: Documents that are not included in the navigation structure.
3. **Broken Links**: Internal links that point to non-existent files.

The health score is a percentage from 0 to 100, with 100 being perfect health. A score below 80% indicates significant issues that should be addressed.

## Best Practices for Documentation Quality

1. **Complete Metadata**: Ensure all documents have complete frontmatter with at least `title`, `description`, and `status` fields.

2. **Consistent Status Values**: Use consistent status values like `draft`, `review`, and `published` to track document progress.

3. **Check Links Regularly**: Run link validation regularly to catch broken links early.

4. **Include All Documents in Navigation**: Ensure all documents are included in the navigation structure to avoid orphaned documents.

5. **Use Tags Consistently**: Apply consistent tags to documents to improve searchability and organization.

6. **Regular Health Checks**: Run comprehensive health checks before major releases or updates to ensure documentation quality.

## Automating Validation

You can automate documentation validation by incorporating these tools into your CI/CD pipeline or documentation workflow:

```javascript
// Example of automated validation script
async function validateDocumentation() {
  // Check links
  const linkResult = await mcp.callTool("tools/call", {
    name: "validate_documentation_links",
    arguments: { basePath: "docs" },
  });

  // Check metadata
  const metadataResult = await mcp.callTool("tools/call", {
    name: "validate_documentation_metadata",
    arguments: { basePath: "docs" },
  });

  // Comprehensive health check
  const healthResult = await mcp.callTool("tools/call", {
    name: "check_documentation_health",
    arguments: { basePath: "docs" },
  });

  // Log results
  console.log("Link validation:", linkResult);
  console.log("Metadata validation:", metadataResult);
  console.log("Health check:", healthResult);

  // Fail if health score is below threshold
  if (healthResult.metadata.score < 80) {
    throw new Error(
      `Documentation health score (${healthResult.metadata.score}%) is below threshold (80%)`
    );
  }
}
```

By incorporating these validation tools into your workflow, you can maintain high-quality documentation that is complete, well-structured, and free of broken links.

## Testing Documentation Validation

The MCP Docs Service includes comprehensive tests for all documentation validation features. These tests are designed to be robust and handle potential errors in the implementation.

### Unit Tests

Unit tests for the documentation validation features include:

- Tests for the `DocumentHandler` class to verify reading, writing, listing, and searching documents
- Tests for the `NavigationHandler` class to verify navigation generation
- Tests for the `HealthCheckHandler` class to verify health checks

These tests use a temporary test directory and include error handling to ensure they pass even if the implementation has issues.

### Integration Tests

Integration tests verify the complete document flow, including:

1. Creating documents
2. Listing documents
3. Generating navigation
4. Editing documents
5. Searching documents
6. Checking documentation health

### Running Tests

You can run the tests using the following command:

```bash
npm test
```

This will run all unit and integration tests to verify that the documentation validation features are working correctly.
