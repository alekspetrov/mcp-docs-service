---
title: Documentation Health Check Guide
description: How to use the health check feature to improve your documentation
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

The MCP Documentation Service includes a powerful health check feature that analyzes your documentation and provides insights into its quality, completeness, and structure.

## Running a Health Check

### From the Command Line

You can run a health check directly from the command line:

```bash
# Using the globally installed version
mcp-docs-service --health-check

# Or using npx
npx mcp-docs-service --health-check
```

### Using the MCP Tool

You can also run a health check using the MCP tool in Cursor:

```
@docs-manager check_documentation_health
```

## Understanding the Health Report

The health check analyzes several aspects of your documentation and generates a comprehensive report with a health score and detailed issues.

### Health Score

The health score is a number between 0 and 100 that indicates the overall quality of your documentation. A higher score means better documentation.

### Issues Analyzed

The health check looks for the following issues:

1. **Missing Frontmatter**: Documents without YAML frontmatter
2. **Missing Title**: Documents without a title in the frontmatter
3. **Missing Description**: Documents without a description in the frontmatter
4. **Broken Links**: Internal links that point to non-existent documents
5. **Orphaned Documents**: Documents that are not referenced in the navigation structure

### Example Report

Here's an example of a health check report:

```
Documentation Health Report:
Health Score: 85/100

Summary:
- Total Documents: 20
- Documents with Missing Frontmatter: 1
- Documents with Missing Title: 2
- Documents with Missing Description: 3
- Broken Links: 1
- Orphaned Documents: 0

Issues:
- guides/setup.md: Missing frontmatter
- api/endpoints.md: Missing title in frontmatter
- tutorials/advanced.md: Missing title in frontmatter
- examples/basic.md: Missing description in frontmatter
- examples/advanced.md: Missing description in frontmatter
- tutorials/basic.md: Missing description in frontmatter
- api/authentication.md: Broken link to api/oauth.md
```

## Improving Your Documentation

Based on the health check report, you can take the following actions to improve your documentation:

1. **Add Frontmatter**: Ensure all documents have YAML frontmatter with at least title and description
2. **Fix Broken Links**: Update or remove links that point to non-existent documents
3. **Include Orphaned Documents**: Add references to orphaned documents in your navigation structure

## Automating Health Checks

You can automate health checks as part of your CI/CD pipeline to ensure documentation quality over time:

```bash
# Example GitHub Actions workflow step
- name: Check Documentation Health
  run: npx mcp-docs-service --health-check
```

If the health check fails (returns a non-zero exit code), your CI/CD pipeline will fail, ensuring that documentation issues are addressed before deployment.

## Troubleshooting

If you encounter issues with the health check:

1. **Check the docs directory**: Make sure the docs directory exists and contains markdown files.
2. **Check file permissions**: Ensure the script has permission to read the documentation files.
3. **Check for JSON parsing errors**: If the script fails with JSON parsing errors, there might be an issue with the MCP service response.

For more help, see the [Troubleshooting Guide](troubleshooting.md).
