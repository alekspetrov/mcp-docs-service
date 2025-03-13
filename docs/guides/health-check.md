---
title: Documentation Health Check Guide
description: Guide for checking the health of your documentation using MCP Docs Service
author: Claude
date: 2024-05-15T00:00:00.000Z
tags:
  - guide
  - health-check
  - documentation
status: published
order: 5
---

# Documentation Health Check Guide

The MCP Docs Service includes a powerful health check feature that analyzes your documentation and provides insights into its quality, completeness, and structure. This guide explains how to use this feature and interpret the results.

## What Does the Health Check Analyze?

The documentation health check analyzes several aspects of your documentation:

1. **Metadata Completeness**: Checks if all required metadata fields (like title, description, status) are present in each document.
2. **Broken Links**: Identifies internal links that point to non-existent documents.
3. **Document Status**: Tracks documents by their status (e.g., draft, published, review).
4. **Document Tags**: Analyzes the distribution of tags across your documentation.

The health check calculates an overall health score based on these factors, with metadata completeness and broken links having the most significant impact on the score.

## Running a Health Check

There are several ways to run a health check on your documentation:

### 1. Using the CLI

The easiest way is to use the CLI with the `--health-check` flag:

```bash
# Using npx
npx mcp-docs-service --health-check

# Or if installed globally
mcp-docs-service --health-check

# Or using the npm script
npm run health-check
```

This will:

- Start the MCP Docs Service
- Run the health check on your documentation
- Display the results in a readable format
- Automatically exit when done

### 2. Using the MCP Protocol Directly

If you're integrating with the MCP Docs Service programmatically, you can call the health check tool directly:

```javascript
const request = {
  jsonrpc: "2.0",
  method: "tools/call",
  params: {
    name: "check_documentation_health",
    arguments: {
      checkLinks: true,
      checkMetadata: true,
      checkOrphans: true,
      requiredMetadataFields: ["title", "description"],
    },
  },
  id: Date.now(),
};

// Send this request to the MCP Docs Service
```

### 3. Using Cursor or Claude Desktop

If you've integrated the MCP Docs Service with Cursor or Claude Desktop, you can ask the AI to run a health check:

```
Please run a health check on my documentation and summarize the results.
```

## Understanding the Health Check Results

The health check results include:

### Overall Health Score

A percentage score that indicates the overall health of your documentation. A higher score means better documentation quality.

### Metadata Completeness

The percentage of required metadata fields that are present across all documents. This helps identify documents with missing metadata.

### Broken Links

The number of internal links that point to non-existent documents. These should be fixed to ensure a good user experience.

### Issues List

A detailed list of all issues found, including:

- Missing metadata fields
- Broken links
- Other issues that might affect documentation quality

Each issue includes:

- The path to the affected document
- The type of issue
- A severity level (error, warning, info)
- A detailed message explaining the issue

### Document Statistics

The health check also provides statistics about your documentation:

- Total number of documents
- Distribution of documents by status
- Distribution of documents by tags

## Customizing the Health Check

You can customize the health check by modifying the arguments when calling it programmatically:

```javascript
{
  // Whether to check for broken links
  checkLinks: true,

  // Whether to check for missing metadata
  checkMetadata: true,

  // Whether to check for orphaned documents (currently disabled)
  checkOrphans: false,

  // The metadata fields that are required in each document
  requiredMetadataFields: ["title", "description", "status"]
}
```

## Improving Your Documentation Health

Based on the health check results, here are some ways to improve your documentation:

1. **Add Missing Metadata**: Ensure all documents have the required metadata fields.
2. **Fix Broken Links**: Update or remove links that point to non-existent documents.
3. **Standardize Tags**: Use consistent tags across your documentation.
4. **Update Document Status**: Make sure all documents have an appropriate status.

## Automating Health Checks

You can automate health checks by integrating the CLI command into your CI/CD pipeline or by setting up a scheduled task to run it regularly.

For example, in a GitHub Actions workflow:

```yaml
name: Documentation Health Check

on:
  schedule:
    - cron: "0 0 * * 1" # Run weekly on Monday
  workflow_dispatch: # Allow manual triggering

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: npm install
      - run: npx mcp-docs-service --health-check
      # Add steps to report or act on the results
```

## Troubleshooting

If you encounter issues with the health check:

1. **Check the docs directory**: Make sure the docs directory exists and contains markdown files.
2. **Check file permissions**: Ensure the script has permission to read the documentation files.
3. **Check for JSON parsing errors**: If the script fails with JSON parsing errors, there might be an issue with the MCP service response.

For more help, see the [Troubleshooting Guide](troubleshooting.md).
