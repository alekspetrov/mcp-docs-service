---
title: Troubleshooting Guide
description: Common issues and solutions when using the MCP Docs Manager
author: Claude
date: '2023-03-15'
tags:
  - guide
  - troubleshooting
  - help
status: published
order: 4
---

# Troubleshooting Guide

This guide covers common issues you might encounter when using the MCP Docs Manager and provides solutions to help you resolve them.

## Common Issues

### Navigation Issues

If documents are not appearing in navigation:

1. Check that your document has the correct metadata
2. Ensure the document is referenced in the navigation structure
3. Verify that the document path is correct

### Broken Links

If you're encountering broken links:

1. Make sure the target file exists
2. Check that the relative path is correct
3. Verify that template variables are properly replaced

### Documentation Health Check Issues

If your documentation health score is low:

1. Fix orphaned documents by including them in navigation
2. Repair broken links
3. Ensure all documents have complete metadata
4. Update draft documents to published status when ready

## Tool-Specific Issues

### Knowledge Base Generator

- Ensure all documents have proper frontmatter
- Check that template variables are properly formatted

### Navigation Generator

- Verify that document paths are correct
- Check that order values are properly set

## Getting Help

If you continue to experience issues, please:

1. Check the [API Reference](../api/tools-reference.md) for proper tool usage
2. Review the [Examples](../examples/documentation-health-check.md) for implementation guidance
3. Consult the [Getting Started Guide](getting-started.md) for basic setup
