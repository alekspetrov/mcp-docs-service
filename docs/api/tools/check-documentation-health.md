---
title: Check Documentation Health
description: API reference for the check_documentation_health tool
author: Claude
date: 2023-03-15T00:00:00.000Z
tags:
  - api
  - reference
  - tool
  - health
status: published
order: 9
---

# Check Documentation Health

The `check_documentation_health` tool analyzes your documentation to identify issues and calculate an overall health score. It helps you maintain high-quality documentation by checking for common problems like missing metadata, broken links, and orphaned documents.

## Usage

```typescript
// Using the MCP protocol directly
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "mcp_docs_manager_check_documentation_health",
    arguments: {
      basePath: "docs"
    }
  }
};
```

## Parameters

| Parameter    | Type   | Required | Default                 | Description                                  |
| ------------ | ------ | -------- | ----------------------- | -------------------------------------------- |
| `basePath`   | string | No       | First allowed directory | The base directory to check documentation in |

> **Note**: If the `basePath` parameter is not provided or is invalid, the tool will automatically use the first allowed directory. This ensures the tool can always run even if the path is not explicitly specified.

## Response

The tool returns a health check result with the following information:

```typescript
{
  score: number;              // Overall health score (0-100)
  totalDocuments: number;     // Total number of documents checked
  issues: HealthIssue[];      // List of issues found
  metadataCompleteness: number; // Percentage of required metadata fields present
  brokenLinks: number;        // Number of broken internal links
  orphanedDocuments: number;  // Number of documents not in navigation
  missingReferences: number;  // Number of missing references
  documentsByStatus?: Record<string, number>; // Count of documents by status
  documentsByTag?: Record<string, number>;    // Count of documents by tag
}
```

Each issue in the `issues` array has the following structure:

```typescript
{
  path: string;   // Path to the document with the issue
  type: 'missing_metadata' | 'broken_link' | 'orphaned' | 'missing_reference'; // Type of issue
  severity: 'error' | 'warning' | 'info';  // Severity level
  message: string; // Human-readable description of the issue
  details?: any;   // Additional details about the issue
}
```

## Health Score Calculation

The overall health score is calculated based on several factors:

- Metadata completeness (presence of required fields like title and description)
- No broken links (links to other markdown files that don't exist)
- Document organization (documents properly included in navigation)

The exact weighting of these factors may vary, but the score provides a good overall indication of documentation health.

A score of 100 indicates perfect documentation health, while lower scores indicate areas for improvement.

## Example

```typescript
// Using the MCP protocol directly
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "mcp_docs_manager_check_documentation_health",
    arguments: {
      basePath: "docs"
    }
  }
};

// When you receive the response
socket.on('message', (data) => {
  const response = JSON.parse(data);
  if (response.id === 1 && response.result) {
    const healthResult = response.result;
    console.log(`Documentation Health Score: ${healthResult.metadata.score}%`);
    console.log(`Total Documents: ${healthResult.metadata.totalDocuments}`);
    console.log(`Issues Found: ${healthResult.metadata.issues.length}`);

    // Display issues by type
    const issuesByType = healthResult.metadata.issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});

    console.log("Issues by type:", issuesByType);
  }
});
```

## Use Cases

- **Documentation Quality Assurance**: Regularly check documentation health to maintain quality standards.
- **CI/CD Integration**: Integrate documentation health checks into your CI/CD pipeline.
- **Documentation Audits**: Perform comprehensive audits of documentation quality.
- **Identifying Improvement Areas**: Quickly identify areas where documentation needs improvement.

## Troubleshooting

If you encounter an "Access denied" error when using the `basePath` parameter, make sure:

1. The path is within one of the allowed directories specified when starting the MCP service
2. The path exists and is accessible
3. If using a relative path, it's relative to one of the allowed directories

If the path is invalid, the tool will automatically fall back to using the first allowed directory.
