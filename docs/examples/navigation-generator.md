---
title: Navigation Generator Example
description: Example of how to generate navigation for documentation
author: Claude
date: 2023-03-12
tags:
  - example
  - navigation
  - code
status: published
order: 1
---

# Navigation Generator Example

This example demonstrates how to generate a navigation structure for your documentation using the MCP Docs Manager.

## The Code

````typescript
import { MCP } from "@modelcontextprotocol/sdk/client";

// Initialize MCP client
const mcp = new MCP();

/**
 * Generates a navigation structure for documentation
 * @param basePath Base path to generate navigation from
 * @returns HTML navigation menu
 */
async function generateNavigation(basePath: string): Promise<string> {
  // Get navigation structure
  const result = await mcp.callTool("docs-manager", "get_navigation", {
    basePath,
  });

  if (result.isError) {
    throw new Error(`Failed to generate navigation: ${result.content[0].text}`);
  }

  // Build HTML navigation
  let html = '<nav class="docs-nav">\n';

  result.metadata.navigation.forEach((section) => {
    html += `  <div class="nav-section">\n`;
    html += `    <h3>${section.title}</h3>\n`;
    html += `    <ul>\n`;

    section.items.forEach((item) => {
      html += `      <li><a href="${item.path}">${item.title}</a></li>\n`;
    });

    html += `    </ul>\n`;
    html += `  </div>\n`;
  });

  html += "</nav>";

  return html;
}

/**
 * Generates a sidebar navigation for a documentation site
 */
async function main() {
  try {
    const html = await generateNavigation("docs");
    console.log(html);

    // Write the navigation to a file using write_document
    const tempContent = "# Navigation\n\n```html\n" + html + "\n```";
    const writeResult = await mcp.callTool("docs-manager", "write_document", {
      path: "docs/generated/navigation.md",
      content: tempContent,
      metadata: {
        title: "Generated Navigation",
        description: "Auto-generated navigation for documentation",
        author: "Navigation Generator",
        date: new Date().toISOString().split("T")[0],
        tags: ["generated", "navigation"],
        status: "published",
        order: 0,
      },
    });

    if (writeResult.isError) {
      console.error(
        `Failed to write navigation: ${writeResult.content[0].text}`
      );
      return;
    }

    console.log(
      "Navigation generated and saved to docs/generated/navigation.md"
    );

    // Get all documentation files
    const docsResult = await mcp.callTool("docs-manager", "list_documents", {
      basePath: "docs",
    });

    if (docsResult.isError) {
      console.error(`Failed to list documents: ${docsResult.content[0].text}`);
      return;
    }

    // Create a documentation index
    let indexContent = "# Documentation Index\n\n";
    indexContent += "This index was automatically generated.\n\n";

    docsResult.metadata.documents.forEach((doc) => {
      const title = doc.metadata.title || doc.name;
      const description = doc.metadata.description || "No description";
      indexContent += `## [${title}](${doc.path})\n\n`;
      indexContent += `${description}\n\n`;

      if (doc.metadata.tags && doc.metadata.tags.length > 0) {
        indexContent += `Tags: ${doc.metadata.tags.join(", ")}\n\n`;
      }
    });

    // Write the index as a document with frontmatter
    const indexResult = await mcp.callTool("docs-manager", "write_document", {
      path: "docs/index.md",
      content: indexContent,
      metadata: {
        title: "Documentation Index",
        description: "Index of all documentation files",
        author: "Navigation Generator",
        date: new Date().toISOString().split("T")[0],
        tags: ["index", "generated"],
        status: "published",
        order: 0,
      },
    });

    if (indexResult.isError) {
      console.error(`Failed to write index: ${indexResult.content[0].text}`);
      return;
    }

    console.log("Documentation index generated and saved to docs/index.md");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
````

## How It Works

1. The code uses the `get_navigation` tool to retrieve the navigation structure for the documentation.
2. It then transforms this structure into an HTML navigation menu.
3. It saves the HTML navigation as a markdown document using `write_document`.
4. Additionally, it demonstrates how to use document-specific tools:
   - It uses `list_documents` to get all markdown documents with their metadata
   - It creates a documentation index with links to all documents
   - It uses `write_document` to save the index as a markdown file with frontmatter

## CSS Styling

You can style the navigation with CSS like this:

```css
.docs-nav {
  width: 250px;
  padding: 20px;
  background-color: #f5f5f5;
  border-right: 1px solid #ddd;
}

.nav-section {
  margin-bottom: 20px;
}

.nav-section h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.nav-section ul {
  list-style-type: none;
  padding-left: 0;
  margin: 0;
}

.nav-section li {
  margin-bottom: 5px;
}

.nav-section a {
  display: block;
  padding: 5px 10px;
  color: #0066cc;
  text-decoration: none;
  border-radius: 4px;
}

.nav-section a:hover {
  background-color: #e0e0e0;
}

.nav-section a.active {
  background-color: #0066cc;
  color: white;
}
```

## Usage

To use this example:

1. Copy the code to a file named `generate-navigation.ts`
2. Install the required dependencies: `npm install @modelcontextprotocol/sdk`
3. Run the script: `ts-node generate-navigation.ts`

The script will generate an HTML navigation menu based on your documentation structure and save it to `docs/generated/navigation.md`.

## Next Steps

You can extend this example to:

1. Add active state highlighting for the current page
2. Include nested navigation for deeper documentation structures
3. Generate different navigation formats (JSON, XML, etc.)
4. Integrate with a static site generator
