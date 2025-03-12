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
const healthResult = await mcp.callTool(
  "docs-manager",
  "check_documentation_health",
  {
    basePath: "docs",
    checkLinks: true,
    checkMetadata: true,
    checkOrphans: true,
    requiredMetadataFields: ["title", "description", "status"],
  }
);
```

## Parameters

| Parameter                | Type     | Required | Default                              | Description                                                     |
| ------------------------ | -------- | -------- | ------------------------------------ | --------------------------------------------------------------- |
| `basePath`               | string   | No       | First allowed directory              | The base directory to check documentation in                    |
| `checkLinks`             | boolean  | No       | `true`                               | Whether to check for broken internal links                      |
| `checkMetadata`          | boolean  | No       | `true`                               | Whether to check for missing metadata fields                    |
| `checkOrphans`           | boolean  | No       | `true`                               | Whether to check for orphaned documents (not in navigation)     |
| `requiredMetadataFields` | string[] | No       | `["title", "description", "status"]` | List of metadata fields that should be present in all documents |

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

The overall health score is calculated based on:

- Metadata completeness (40%)
- No broken links (30%)
- No orphaned documents (30%)

A score of 100 indicates perfect documentation health, while lower scores indicate areas for improvement.

## Example

```typescript
// Check documentation health
const healthResult = await mcp.callTool(
  "docs-manager",
  "check_documentation_health",
  {
    basePath: "docs",
  }
);

console.log(`Documentation Health Score: ${healthResult.metadata.score}%`);
console.log(`Total Documents: ${healthResult.metadata.totalDocuments}`);
console.log(`Issues Found: ${healthResult.metadata.issues.length}`);

// Display issues by type
const issuesByType = healthResult.metadata.issues.reduce((acc, issue) => {
  acc[issue.type] = (acc[issue.type] || 0) + 1;
  return acc;
}, {});

console.log("Issues by type:", issuesByType);
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
