# Changelog

All notable changes to the MCP Docs Service will be documented in this file.

## [0.2.3] - 2024-03-12

### Fixed

- Fixed orphaned documents check in health check tool
- Improved navigation loading from .navigation and \_navigation.json files
- Added support for nested navigation items
- Fixed health score calculation to properly handle orphaned documents

### Added

- Added navigation.json file for better documentation structure

## [0.2.2] - 2024-03-12

### Fixed

- Fixed health check tool to properly access docs directory
- Improved path validation to better handle relative paths
- Enhanced CLI to support custom docs directory with `--docs-dir` and `--create-dir` options
- Added better error handling and fallback for invalid paths

### Added

- Added troubleshooting section to health check documentation

## [0.2.1] - 2023-03-15

### Added

- New `check_documentation_health` tool for analyzing documentation quality
- Documentation health score calculation based on metadata completeness, broken links, and orphaned documents
- Detailed issue reporting for documentation problems
- Updated documentation with examples and usage guidelines for the health check tool

## [0.2.0] - 2023-03-14

### Added

- Added proper CLI support with `npx mcp-docs-service`
- Added support for custom docs directory with `--docs-dir` option
- Added support for creating docs directory with `--create-dir` option
- Added Cursor integration guide
- Added Claude Desktop integration guide

### Fixed

- Fixed MCP response format to comply with the latest protocol
- Fixed path validation for Windows paths
- Fixed error handling for invalid paths

## [0.1.0] - 2023-03-10

### Added

- Initial release with core documentation management features
- Support for reading, writing, and editing markdown files with frontmatter
- Support for listing documents and getting structure
- Support for generating navigation
- Support for searching documents
- Support for generating knowledge bases for LLM context
