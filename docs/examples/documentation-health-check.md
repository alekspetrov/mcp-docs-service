---
title: Documentation Health Check Example
description: Example of how to use the documentation health check tool
author: Claude
date: 2023-03-15T00:00:00.000Z
tags:
  - example
  - health
  - quality
status: published
order: 3
---

# Documentation Health Check Example

This example demonstrates how to use the `check_documentation_health` tool to analyze the quality of your documentation and identify issues that need to be addressed.

## Basic Health Check

The simplest way to check your documentation health is to call the tool with default parameters:

```typescript
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
```

This will perform a comprehensive health check that includes:

- Checking for missing metadata fields (title, description, status)
- Identifying broken internal links
- Finding orphaned documents (not included in navigation)

## Customizing the Health Check

You can customize the health check by specifying which checks to perform and which metadata fields are required:

```typescript
const healthResult = await mcp.callTool(
  "docs-manager",
  "check_documentation_health",
  {
    basePath: "docs",
    checkLinks: true,
    checkMetadata: true,
    checkOrphans: false, // Skip orphaned document check
    requiredMetadataFields: [
      "title",
      "description",
      "author",
      "date",
      "status",
    ],
  }
);
```

## Analyzing Health Check Results

The health check returns detailed information about the documentation health:

```typescript
// Get overall health metrics
const {
  score,
  totalDocuments,
  metadataCompleteness,
  brokenLinks,
  orphanedDocuments,
  documentsByStatus,
  documentsByTag,
} = healthResult.metadata;

// Log overall health metrics
console.log(`Documentation Health Score: ${score}%`);
console.log(`Metadata Completeness: ${metadataCompleteness}%`);
console.log(`Broken Links: ${brokenLinks}`);
console.log(`Orphaned Documents: ${orphanedDocuments}`);

// Analyze issues by type
const issuesByType = healthResult.metadata.issues.reduce((acc, issue) => {
  acc[issue.type] = (acc[issue.type] || 0) + 1;
  return acc;
}, {});

console.log("Issues by type:", issuesByType);

// Analyze issues by severity
const issuesBySeverity = healthResult.metadata.issues.reduce((acc, issue) => {
  acc[issue.severity] = (acc[issue.severity] || 0) + 1;
  return acc;
}, {});

console.log("Issues by severity:", issuesBySeverity);

// Log document distribution by status
console.log("Documents by status:", documentsByStatus);

// Log document distribution by tag
console.log("Documents by tag:", documentsByTag);
```

## Generating a Health Report

You can generate a markdown report of the documentation health:

```typescript
function generateHealthReport(healthResult) {
  const {
    score,
    totalDocuments,
    metadataCompleteness,
    brokenLinks,
    orphanedDocuments,
    issues,
    documentsByStatus,
    documentsByTag,
  } = healthResult.metadata;

  let report = `# Documentation Health Report\n\n`;
  report += `**Overall Health Score:** ${score}%\n\n`;
  report += `**Total Documents:** ${totalDocuments}\n\n`;

  report += `## Health Metrics\n\n`;
  report += `- **Metadata Completeness:** ${metadataCompleteness}%\n`;
  report += `- **Broken Links:** ${brokenLinks}\n`;
  report += `- **Orphaned Documents:** ${orphanedDocuments}\n\n`;

  report += `## Issues (${issues.length})\n\n`;

  if (issues.length > 0) {
    // Group issues by type
    const issuesByType = {};
    issues.forEach((issue) => {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push(issue);
    });

    // Generate issue sections
    for (const [type, typeIssues] of Object.entries(issuesByType)) {
      report += `### ${type.replace("_", " ").toUpperCase()} (${
        typeIssues.length
      })\n\n`;

      typeIssues.forEach((issue) => {
        report += `- **${issue.path}**: ${issue.message}\n`;
      });

      report += `\n`;
    }
  } else {
    report += `No issues found. Great job!\n\n`;
  }

  report += `## Document Distribution\n\n`;

  report += `### By Status\n\n`;
  for (const [status, count] of Object.entries(documentsByStatus)) {
    report += `- **${status}**: ${count}\n`;
  }

  report += `\n### By Tag\n\n`;
  for (const [tag, count] of Object.entries(documentsByTag)) {
    report += `- **${tag}**: ${count}\n`;
  }

  return report;
}

// Generate and save the report
const report = generateHealthReport(healthResult);
await mcp.callTool("docs-manager", "write_document", {
  path: "docs/reports/health-report.md",
  content: report,
  metadata: {
    title: "Documentation Health Report",
    description: "Automated report of documentation health",
    author: "MCP Docs Manager",
    date: new Date().toISOString(),
    tags: ["report", "health", "automated"],
    status: "generated",
  },
});
```

## Automating Health Checks

You can automate documentation health checks as part of your CI/CD pipeline or run them on a schedule to monitor documentation quality over time.

Here's an example of how to set up a scheduled health check:

```javascript
// health-check-script.js
import { MCPClient } from "@modelcontextprotocol/sdk/client";

async function runHealthCheck() {
  const client = new MCPClient();

  try {
    await client.connect();

    const healthResult = await client.callTool(
      "docs-manager",
      "check_documentation_health",
      {
        basePath: "docs",
      }
    );

    // Generate report
    const report = generateHealthReport(healthResult);

    // Save report
    await client.callTool("docs-manager", "write_document", {
      path: `docs/reports/health-report-${
        new Date().toISOString().split("T")[0]
      }.md`,
      content: report,
      metadata: {
        title: "Documentation Health Report",
        description: "Automated report of documentation health",
        author: "MCP Docs Manager",
        date: new Date().toISOString(),
        tags: ["report", "health", "automated"],
        status: "generated",
      },
    });

    console.log(
      `Health check completed. Score: ${healthResult.metadata.score}%`
    );
  } catch (error) {
    console.error("Health check failed:", error);
  } finally {
    await client.disconnect();
  }
}

runHealthCheck();
```

You can run this script on a schedule using cron or a CI/CD pipeline to regularly monitor your documentation health.
