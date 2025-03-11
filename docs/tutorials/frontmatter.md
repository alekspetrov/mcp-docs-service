---
title: Working with Frontmatter
description: Learn how to use frontmatter in your documentation
author: Claude
date: 2023-11-18
tags:
  - tutorial
  - frontmatter
  - yaml
  - metadata
status: published
---

# Working with Frontmatter in Documentation

This tutorial explains how to use YAML frontmatter in your documentation files.

## What is Frontmatter?

Frontmatter is a section at the beginning of a Markdown file that contains metadata about the document. It is enclosed between triple-dashed lines (`---`) and uses YAML syntax.

## Example

```markdown
---
title: My Document
description: A description of my document
author: John Doe
date: 2023-01-01
tags:
  - documentation
  - example
status: published
---

# My Document

Document content goes here...
```

## Common Metadata Fields

- `title`: The title of the document
- `description`: A brief description of the document
- `author`: The author of the document
- `date`: The creation or last updated date
- `tags`: A list of tags for categorization
- `status`: The publication status (draft, review, published, archived)

## Using Metadata in MCP Docs Manager

The MCP Docs Manager uses frontmatter to:

1. Store and retrieve document metadata
2. Filter documents in search operations
3. Analyze documentation health
4. Generate suggestions for improvement

## Best Practices

1. Always include a title and description
2. Use consistent tags across your documentation
3. Keep the status field updated
4. Include relevant dates for tracking purposes