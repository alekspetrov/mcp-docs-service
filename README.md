# MCP Documentation Service

The MCP Documentation Service is a custom implementation of the Model Context Protocol that allows AI assistants to interact with documentation. This service enables the creation, reading, updating, and deletion of documentation files, as well as searching and analyzing the documentation.

## Features

- **Document Management**: Create, read, update, and delete markdown documentation files
- **Metadata Management**: Work with document frontmatter (YAML metadata)
- **Search**: Search through documentation using keywords and filters
- **Analytics**: Analyze documentation health and get suggestions for improvement

## Installation

### Deno

```typescript
import { MCPDocsServer } from "https://deno.land/x/mcp_docs/mod.ts";
```

### npm (Coming Soon)

```bash
npm install mcp-docs-service
```

## Quick Start

### Deno

```typescript
import { MCPDocsServer } from "./mod.ts";

// Create a new MCP server
const server = new MCPDocsServer("./docs");

// Execute a query
try {
  const result = await server.executeQuery("list_files");
  console.log(result);
} catch (error) {
  console.error(error);
}
```

### CLI

```bash
# Start the server
deno run --allow-read --allow-write --allow-env src/cli/index.ts
```

## Query Format

The service uses a SQL-like query format to execute commands:

```
command_name(param1="value1", param2="value2")
```

For example:

```
get_document(path="architecture/overview.md")
```

## Available Commands

### Document Operations

- **list_files(directory="")**: List all markdown files (optionally in a specific directory)
- **list_directories(directory="")**: List all directories (optionally in a specific directory)
- **get_document(path="path/to/doc.md")**: Get a document's content and metadata
- **create_document(path="path/to/doc.md", content="content", metadata={...})**: Create a new document
- **update_document(path="path/to/doc.md", content="updated content", metadata={...})**: Update an existing document
- **delete_document(path="path/to/doc.md")**: Delete a document

### Search & Analysis

- **search_documents(query="search term", directory="", tags=["tag1"], status="published")**: Search documents
- **analyze_docs(directory="")**: Analyze documentation health
- **get_health_score()**: Get overall documentation health score
- **get_suggestions()**: Get suggestions for improving documentation

## License

MIT
