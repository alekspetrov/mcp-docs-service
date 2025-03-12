---
title: Knowledge Base Generator Example
description: Example of how to generate a comprehensive knowledge base for documentation
author: Claude
date: 2023-03-13
tags:
  - example
  - knowledge-base
  - llm
status: published
order: 2
---

# Knowledge Base Generator Example

This example demonstrates how to generate a comprehensive knowledge base for your documentation using the MCP Docs Manager. This knowledge base can be used to provide context to an LLM without requiring multiple file searches.

## The Code

```typescript
import { MCP } from "@modelcontextprotocol/sdk/client";
import fs from "fs/promises";

// Initialize MCP client
const mcp = new MCP();

/**
 * Generates a knowledge base for documentation
 * @param basePath Base path to generate knowledge base from
 * @returns Knowledge base object
 */
async function generateKnowledgeBase(basePath: string) {
  // Get the knowledge base
  const result = await mcp.callTool("docs-manager", "get_docs_knowledge_base", {
    basePath,
    includeSummaries: true,
    maxSummaryLength: 300,
  });

  if (result.isError) {
    throw new Error(
      `Failed to generate knowledge base: ${result.content[0].text}`
    );
  }

  return result.metadata.knowledgeBase;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log("Generating knowledge base...");
    const knowledgeBase = await generateKnowledgeBase("docs");

    // Print some statistics
    console.log(
      `Generated knowledge base with ${knowledgeBase.documents.length} documents`
    );
    console.log(`Navigation sections: ${knowledgeBase.navigation.length}`);
    console.log(`Categories: ${Object.keys(knowledgeBase.categories).length}`);
    console.log(`Tags: ${Object.keys(knowledgeBase.tags).length}`);

    // Save the knowledge base to a file
    await fs.writeFile(
      "docs/generated/knowledge-base.json",
      JSON.stringify(knowledgeBase, null, 2)
    );

    console.log("Knowledge base saved to docs/generated/knowledge-base.json");

    // Example: Find all documents with a specific tag
    const tag = "tutorial";
    if (knowledgeBase.tags[tag]) {
      console.log(`\nDocuments with tag "${tag}":`);
      knowledgeBase.tags[tag].forEach((doc) => {
        console.log(`- ${doc.metadata.title || doc.name} (${doc.path})`);
      });
    }

    // Example: Find all documents in a specific category
    const category = "docs/tutorials";
    if (knowledgeBase.categories[category]) {
      console.log(`\nDocuments in category "${category}":`);
      knowledgeBase.categories[category].forEach((doc) => {
        console.log(`- ${doc.metadata.title || doc.name} (${doc.path})`);
      });
    }

    // Example: Generate a markdown index of all documents with summaries
    let markdownIndex = "# Documentation Index\n\n";

    knowledgeBase.documents.forEach((doc) => {
      const title = doc.metadata.title || doc.name;
      markdownIndex += `## [${title}](${doc.path})\n\n`;

      if (doc.metadata.description) {
        markdownIndex += `*${doc.metadata.description}*\n\n`;
      }

      if (doc.summary) {
        markdownIndex += `${doc.summary}\n\n`;
      }

      if (doc.metadata.tags && doc.metadata.tags.length > 0) {
        markdownIndex += `**Tags:** ${doc.metadata.tags.join(", ")}\n\n`;
      }

      markdownIndex += `---\n\n`;
    });

    // Save the markdown index
    await fs.writeFile("docs/generated/index.md", markdownIndex);
    console.log("Markdown index saved to docs/generated/index.md");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
```

## How It Works

1. The code uses the `get_docs_knowledge_base` tool to generate a comprehensive knowledge base for the documentation.
2. The knowledge base includes:
   - Navigation structure
   - All documents with metadata and summaries
   - Documents organized by category (directory)
   - Documents organized by tags
3. The example demonstrates several ways to use the knowledge base:
   - Saving it as a JSON file for later use
   - Finding documents with a specific tag
   - Finding documents in a specific category
   - Generating a markdown index with summaries

## Usage

To use this example:

1. Copy the code to a file named `generate-knowledge-base.ts`
2. Install the required dependencies: `npm install @modelcontextprotocol/sdk fs`
3. Run the script: `ts-node generate-knowledge-base.ts`

The script will generate a knowledge base for your documentation and save it to `docs/generated/knowledge-base.json` and a markdown index to `docs/generated/index.md`.

## Using with LLMs

The knowledge base is particularly useful when working with LLMs. Here's how you can use it:

```typescript
import { MCP } from "@modelcontextprotocol/sdk/client";
import fs from "fs/promises";

async function askLLM(question: string) {
  // Load the knowledge base
  const knowledgeBaseJson = await fs.readFile(
    "docs/generated/knowledge-base.json",
    "utf-8"
  );
  const knowledgeBase = JSON.parse(knowledgeBaseJson);

  // Prepare context for the LLM
  let context = "Here is information about our documentation:\n\n";

  // Find relevant documents based on the question
  const relevantDocs = findRelevantDocuments(knowledgeBase, question);

  // Add summaries of relevant documents to the context
  relevantDocs.forEach((doc) => {
    context += `Document: ${doc.metadata.title || doc.name}\n`;
    context += `Path: ${doc.path}\n`;
    if (doc.summary) {
      context += `Summary: ${doc.summary}\n\n`;
    }
  });

  // Call the LLM with the context and question
  // This is a placeholder for your actual LLM call
  const answer = await callLLM(context, question);

  return answer;
}

// Simple relevance function (in a real application, use embeddings or better search)
function findRelevantDocuments(knowledgeBase, question) {
  const questionLower = question.toLowerCase();
  return knowledgeBase.documents.filter((doc) => {
    const title = (doc.metadata.title || doc.name).toLowerCase();
    const description = (doc.metadata.description || "").toLowerCase();
    const summary = (doc.summary || "").toLowerCase();

    return (
      title.includes(questionLower) ||
      description.includes(questionLower) ||
      summary.includes(questionLower)
    );
  });
}

// Example usage
async function main() {
  const answer = await askLLM("How do I get the navigation structure?");
  console.log("Answer:", answer);
}

main();
```

This approach allows you to provide relevant context to the LLM without having to search through files for each question.

## Next Steps

You can extend this example to:

1. Implement more sophisticated relevance ranking using embeddings
2. Create a caching mechanism to periodically update the knowledge base
3. Build a question-answering system on top of the knowledge base
4. Integrate with a web UI for interactive documentation exploration
