---
title: Basic Usage Example
description: Examples of using the MCP Documentation Service
status: published
---

# Basic Usage Examples

This document provides examples of using the MCP Documentation Service with various tools.

## Reading Documents

To read a document:

```
@docs-manager read_document path=README.md
```

## Writing Documents

To create a new document:

```
@docs-manager write_document path=guides/installation.md content="---
title: Installation Guide
description: How to install the project
---

# Installation Guide

## Prerequisites

- Node.js 18 or higher
- npm or yarn

## Steps

1. Clone the repository
2. Run `npm install`
3. Run `npm start`
"
```

## Editing Documents

To edit a document:

```
@docs-manager edit_document path=README.md edits=[
  {
    "oldText": "# Project Title",
    "newText": "# Awesome Project"
  }
]
```

## Listing Documents

To list all documents in a directory:

```
@docs-manager list_documents basePath=guides recursive=true
```

## Searching Documents

To search for documents containing specific text:

```
@docs-manager search_documents query="installation"
```

## Generating Navigation

To generate a navigation structure:

```
@docs-manager generate_navigation outputPath=navigation.json
```

## Checking Documentation Health

To check the health of your documentation:

```
@docs-manager check_documentation_health
```
