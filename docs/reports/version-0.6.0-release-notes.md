---
title: Version 0.6.0 Release Notes
description: Release notes for version 0.6.0 of the MCP Documentation Service
author: Claude
date: "2024-03-21T00:00:00.000Z"
tags:
  - release notes
  - version
  - llm
status: published
order: 1
---

# Version 0.6.0 Release Notes

## Overview

Version 0.6.0 introduces the LLM-optimized documentation feature, which allows you to generate a single consolidated markdown file containing your project's documentation, specifically formatted and optimized for Large Language Models (LLMs).

## New Features

### LLM-Optimized Documentation

- **--single-doc Flag**: Generate a consolidated document containing all documentation
- **--output Flag**: Specify custom output filename (default: consolidated-docs.md)
- **--max-tokens Flag**: Set maximum token limit for the generated document
- **Token Counting**: Automatic token counting for each section in the documentation
- **Table of Contents**: Generated with token counts for each section
- **Section Organization**: Documentation is organized by folder structure

### MCP Integration

- **New Tool: consolidate_documentation**: Generate consolidated documentation through MCP

## Usage Examples

### CLI Usage

```bash
# Generate consolidated documentation with default filename
npx mcp-docs-service --single-doc /path/to/docs

# Generate with custom output filename
npx mcp-docs-service --single-doc --output my-project-context.md /path/to/docs

# Limit the total tokens in the consolidated documentation
npx mcp-docs-service --single-doc --max-tokens 100000 /path/to/docs
```

### MCP Tool Usage

```
# Generate consolidated documentation with default settings
mcp_docs_manager_consolidate_documentation

# Generate with custom settings
mcp_docs_manager_consolidate_documentation outputPath="api-docs.md" maxTokens=100000
```

## Technical Improvements

- Added token counting utilities based on the Claude tokenizer approximation
- Implemented document collection and consolidation logic
- Added metadata and table of contents generation
- Enhanced CLI with new flags and options
- Updated help documentation to include new features

## Documentation Updates

- Updated the LLM-Optimized Documentation guide
- Added consolidated documentation examples
- Updated roadmap to mark the feature as completed
- Added new section in the README about the feature

## Resolved Issues

- None (new feature)

## Known Issues

- Approximation of token counts may differ slightly from actual tokenization by specific LLMs

## Contributors

This release was made possible by the contributions of the MCP Documentation Service team.

## Next Steps

- Enhance token counting accuracy
- Add more configuration options for consolidated documentation
- Improve content prioritization for token limit optimization