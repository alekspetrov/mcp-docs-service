# Changelog

All notable changes to the MCP Docs Service will be documented in this file.

## [0.2.2] - 2023-03-15

### Added

- New `check_documentation_health` tool for analyzing documentation quality
- Documentation health score calculation based on metadata completeness, broken links, and orphaned documents
- Detailed issue reporting for documentation problems
- Updated documentation with examples and usage guidelines for the health check tool

## [0.2.1] - 2023-03-14

### Added

- New MCP integration guide in `docs/guides/mcp-integration.md`
- New Cursor integration guide in `docs/guides/cursor-integration.md`
- Proper CLI support for easy execution via npx
- Test client scripts (`mcp-client.js` and `test-mcp.js`) for easier testing and debugging
- Updated `.npmignore` to exclude test client scripts from npm package

### Fixed

- Fixed MCP service response format handling to properly work with the MCP SDK
- Corrected double-wrapped response handling in client implementations
- Improved JSON metadata parsing in command-line arguments
- Ensured proper executable permissions for CLI entry point

## [0.2.0] - 2023-03-12

### Added

- New `get_docs_knowledge_base` tool for creating comprehensive knowledge bases for LLM context
- Knowledge base generation example in `docs/examples/knowledge-base-generator.md`
- Support for document summaries in knowledge base
- Organization of documents by categories and tags in knowledge base
- Updated documentation to reflect new features

### Changed

- Improved documentation structure and organization
- Updated roadmap to include knowledge base features
- Enhanced basic usage tutorial with knowledge base examples
- Removed unnecessary file operation tools in favor of document-specific tools

### Fixed

- TypeScript type errors in knowledge base implementation
- Various documentation improvements and corrections

## [0.1.1] - 2023-03-11

### Added

- Initial release of MCP Docs Service
- Basic documentation management functionality
- Support for reading, writing, editing, and deleting markdown files with frontmatter
- Search functionality for documentation
- Navigation generation
- Documentation structure analysis
