---
title: LLM-Optimized Documentation Template
description: A template and guidelines for creating documentation specifically optimized for LLM consumption
author: Claude
date: '2024-03-20T00:00:00.000Z'
tags:
  - template
  - llm
  - documentation
  - best-practices
status: published
order: 1
---

# LLM-Optimized Documentation Template

This template provides a structure and guidelines for creating documentation specifically optimized for Large Language Models (LLMs) rather than human browsing. Following Andrej Karpathy's insight that "in 2025 the docs should be a single your_project.md text file that is intended to go into the context window of an LLM," this approach maximizes the utility of documentation for AI assistants.

## Purpose

Traditional documentation is designed for human navigation through hyperlinked pages. LLM-optimized documentation consolidates all essential information into a single, well-structured file that fits within an LLM's context window, allowing the model to have complete understanding of your project without relying on chunked retrieval methods.

## Template Structure

Below is a template you can use as a starting point for creating LLM-optimized documentation. Copy this structure and adapt it to your project.

```markdown
# [PROJECT-NAME] Documentation [v1.2.3]

CONTEXT-TYPE: Technical Documentation
TOKEN-COUNT: ~150,000
LAST-UPDATED: YYYY-MM-DD
STRUCTURE-VERSION: 1.0

## METADATA

PROJECT-NAME: Your Project Name
VERSION: 1.2.3
REPOSITORY: https://github.com/username/repository
PRIMARY-LANGUAGE: Language
KEY-TECHNOLOGIES: Tech1, Tech2, Tech3
MAINTAINERS: Name1, Name2
LICENSE: License Type

## TABLE OF CONTENTS

1. [QUICK-REFERENCE](#quick-reference) (~5,000 tokens)
2. [CONCEPTS](#concepts) (~20,000 tokens)
3. [ARCHITECTURE](#architecture) (~15,000 tokens)
4. [API-REFERENCE](#api-reference) (~50,000 tokens)
5. [GUIDES](#guides) (~30,000 tokens)
6. [CONFIGURATION](#configuration) (~15,000 tokens)
7. [TROUBLESHOOTING](#troubleshooting) (~10,000 tokens)
8. [APPENDIX](#appendix) (~5,000 tokens)

## QUICK-REFERENCE

[SECTION-ID:quick-reference]

Most commonly needed information, commands, and patterns.

### Installation

```bash
# Installation command
npm install your-package
```

### Common Usage Patterns

```typescript
// Most common usage example
import { something } from 'your-package';

const result = something();
```

### Key Concepts at a Glance

- **Concept1**: Brief explanation
- **Concept2**: Brief explanation
- **Concept3**: Brief explanation

## CONCEPTS

[SECTION-ID:concepts]

Key concepts and terminology used throughout the project.

### [Concept1]

[CONCEPT-ID:concept1]

Detailed explanation of Concept1, including:
- Purpose and importance
- Core principles
- Relationship to other concepts
- Examples of using this concept

RELATED-TO: [concept2, concept3]

### [Concept2]

[CONCEPT-ID:concept2]

Detailed explanation of Concept2...

## ARCHITECTURE

[SECTION-ID:architecture]

Overall system architecture and design.

### System Overview

```
┌───────────────┐      ┌───────────────┐
│  Component A  │─────▶│  Component B  │
└───────────────┘      └───────────────┘
        │                      │
        ▼                      ▼
┌───────────────┐      ┌───────────────┐
│  Component C  │◀─────│  Component D  │
└───────────────┘      └───────────────┘
```

### Component Details

1. **Component A**
   - Purpose: What it does
   - Responsibilities: What it handles
   - Dependencies: What it requires

2. **Component B**
   - Purpose: What it does
   - Responsibilities: What it handles
   - Dependencies: What it requires

### Data Flow

1. Request comes in through Component A
2. Component A processes and forwards to Component B
3. Component B performs operations and updates Component D
4. Component D notifies Component C
5. Component C generates response

## API-REFERENCE

[SECTION-ID:api-reference]

Complete API documentation.

### [FunctionName1]

[API:function-name1]
TYPE: Function
DESCRIPTION: What this function does
PARAMETERS:
  - param1 (type): description
  - param2 (type): description
RETURNS: return type and description
THROWS: potential errors
ADDED-IN: v1.0.0
EXAMPLE:
```typescript
// Usage example
const result = functionName1('param1', 123);
```

### [FunctionName2]

[API:function-name2]
TYPE: Function
DESCRIPTION: What this function does
...

## GUIDES

[SECTION-ID:guides]

Step-by-step guides for common tasks.

### Guide 1: Accomplishing Task X

[GUIDE-ID:task-x]

Complete walkthrough of Task X:

1. First, install dependencies:
   ```bash
   npm install dependency-a dependency-b
   ```

2. Create a configuration file:
   ```typescript
   // config.ts
   export default {
     setting1: 'value1',
     setting2: 'value2'
   };
   ```

3. Implement the main functionality:
   ```typescript
   // implementation steps...
   ```

4. Testing your implementation:
   ```typescript
   // testing code...
   ```

COMMON-MISTAKES:
- Forgetting to initialize X before calling Y
- Using incorrect configuration parameters
- Not handling errors from Z

## CONFIGURATION

[SECTION-ID:configuration]

All configuration options explained.

### Configuration File Format

```json
{
  "option1": "value1",
  "option2": 123,
  "nestedOptions": {
    "subOption1": true,
    "subOption2": ["array", "values"]
  }
}
```

### Configuration Options

[CONFIG:option1]
TYPE: string
DEFAULT: "default"
REQUIRED: yes
DESCRIPTION: Controls the behavior of X
EXAMPLE: "custom-value"

[CONFIG:option2]
TYPE: number
DEFAULT: 100
REQUIRED: no
DESCRIPTION: Sets the limit for Y operations
EXAMPLE: 500

## TROUBLESHOOTING

[SECTION-ID:troubleshooting]

Common issues and their solutions.

### Error: "XYZ is not defined"

[ERROR-ID:xyz-not-defined]

CAUSE: This typically happens when the library is not properly initialized.
SOLUTION:
```typescript
// Make sure to import and initialize the library
import { initialize } from 'your-package';
initialize({ option: 'value' });
```

### Performance Issues with Large Datasets

[ISSUE-ID:performance-large-datasets]

CAUSE: Default configuration is optimized for smaller datasets.
SOLUTION:
1. Increase the 'batchSize' configuration option
2. Enable the 'caching' feature
3. Consider implementing pagination as shown below:
   ```typescript
   // Pagination example...
   ```

## APPENDIX

[SECTION-ID:appendix]

Additional information.

### Version History

- v1.2.3 (Current):
  - Added feature X
  - Fixed bug in Y
  - Improved performance of Z

- v1.2.2:
  - Security fixes for A and B
  - Updated dependencies

### Related Resources

- [Official Documentation](https://project-website.com/docs)
- [GitHub Repository](https://github.com/username/repository)
- [Community Forum](https://community.project-website.com)

### Glossary

- **Term1**: Definition of Term1
- **Term2**: Definition of Term2
- **Term3**: Definition of Term3

===== END OF DOCUMENTATION =====
```

## Guidelines for Implementation

### 1. Content Organization Principles

- Use consistent heading levels (H1, H2, H3) to create a parseable hierarchy
- Prefix sections with identifiers for easier reference
- Include section IDs that can be referenced directly

### 2. Information Density Optimization

- Prioritize information-dense, concise explanations over verbose descriptions
- Use bullet points and numbered lists for series of related items
- Eliminate redundant information that appears in multiple places

### 3. Reference System

- Create a standardized cross-referencing system
- Include a metadata section at the top with key definitions and terms
- Group related concepts together to minimize context switches

### 4. Token Efficiency

- Use standard abbreviations where clear (e.g., "config" vs "configuration")
- Eliminate unnecessary words and phrases
- Use tables for structured data to improve token efficiency

### 5. Context-Awareness Markers

- Add section delimiters with unique patterns
- Include relationship markers
- Use explicit versioning notes

### 6. Specialized Sections for LLM Understanding

- Add "REASONING:" blocks that explain the "why" behind design decisions
- Include "COMMON-MISTAKES:" sections that highlight typical errors
- Provide "EXAMPLE-FLOW:" sections that walk through complete processes

### 7. Token Budgeting

- Core documentation: 60% of available tokens
- Examples and tutorials: 25% of available tokens
- Reference materials: 15% of available tokens

## LLM Context Window Considerations

Different LLMs have different context window sizes. Adjust your documentation accordingly:

| Model | Approximate Context Size | Documentation Guidance |
|-------|--------------------------|------------------------|
| Claude 3 Haiku | 48,000 tokens | Focus on core API and essential concepts |
| Claude 3 Sonnet | 200,000 tokens | Complete documentation with examples |
| Claude 3 Opus | 200,000 tokens | Full documentation with extended examples |
| GPT-4 | 128,000 tokens | Comprehensive but prioritized content |

## Implementation in MCP Docs Service

In future versions of MCP Docs Service, we plan to implement a tool that automatically generates LLM-optimized documentation from your existing docs structure, following the guidelines and structure outlined in this template.

## References

1. Andrej Karpathy's insights on LLM-optimized documentation
2. MCP Docs Service development roadmap
3. Documentation optimization research