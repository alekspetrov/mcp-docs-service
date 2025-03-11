---
title: Getting Started with MCP Docs Manager
description: A guide to help you get started with the MCP documentation manager
author: Claude
date: 2023-11-16
tags:
  - guide
  - getting-started
  - documentation
status: published
---

# Getting Started with MCP Docs Manager

This guide will help you get started with using the MCP documentation manager.

## Installation

To install the MCP docs manager, run:

```bash
npm install mcp-docs-service
```

## Basic Usage

The MCP docs manager provides several tools for managing documentation:

### List Files

```javascript
const result = await query("list_files()");
console.log(result);
```

### Get Document

```javascript
const result = await query("get_document(path=\"path/to/document.md\")");
console.log(JSON.parse(result));
```

### Create Document

```javascript
const result = await query(`create_document(
  path="path/to/document.md",
  content="# My Document\n\nThis is my document content.",
  metadata={"title": "My Document", "tags": ["example"]}
)`);
console.log(result);
```

## Advanced Features

The MCP docs manager also provides tools for analyzing documentation health and getting suggestions for improvement.