# Changelog

All notable changes to the MCP Docs Service will be documented in this file.

## [0.2.17] - 2024-05-16

### Added

- Added `mcp-docs-standalone` CommonJS entry point for maximum npx compatibility
- Implemented a simplified standalone MCP server that works in any environment
- Added automatic docs directory creation with sample README.md

### Fixed

- Fixed issues with ES modules in npx environments
- Improved reliability when running via npx
- Enhanced error handling for edge cases

## [0.2.16] - 2024-05-16

### Fixed

- Fixed critical bug in error logging function that was causing crashes
- Improved error handling in wrapper scripts

## [0.2.15] - 2024-05-16

### Added

- Added `mcp-docs-npx` standalone wrapper for more reliable npx execution
- Enhanced debugging capabilities with detailed logging in all wrapper scripts
- Improved error handling and recovery in wrapper scripts

### Fixed

- Fixed issue with file access when running via npx
- Improved robustness of path resolution in wrapper scripts
- Enhanced error handling for edge cases

## [0.2.14] - 2024-05-16

### Added

- Added `mcp-docs-cursor` entry point specifically for Cursor integration
- Improved argument handling for Cursor integration
- Enhanced debugging capabilities with detailed logging

### Fixed

- Fixed issue with npx execution in Cursor's MCP integration
- Improved robustness of docs directory resolution
- Enhanced error handling for Cursor integration

## [0.2.13] - 2024-05-16

### Fixed

- Fixed packaging issue with wrapper scripts

## [0.2.12] - 2024-05-15

### Fixed

- Fixed MCP Inspector integration by preventing non-JSON output to stdout
- Improved logging to use stderr for diagnostic messages
- Ensured wrapper script is included in the published package

## [0.2.11] - 2024-05-15

### Fixed

- Fixed MCP Inspector wrapper script to use ES module syntax
- Improved compatibility with MCP Inspector

## [0.2.10] - 2024-05-15

### Added

- Added `mcp-docs-inspector` entry point for better compatibility with MCP Inspector
- Updated documentation with instructions for using MCP Inspector

### Fixed

- Fixed issue with MCP Inspector argument parsing

## [0.2.9] - 2024-05-15

### Fixed

- Enhanced CLI argument handling to support both positional and flag-based formats
- Updated Cursor integration documentation to show both supported formats
- Fixed issue with MCP Inspector integration

## [0.2.8] - 2024-05-15

### Fixed

- Fixed MCP configuration to use correct CLI argument format
- Updated documentation to use correct CLI argument format
- Fixed issue with Cursor integration

## [0.2.7] - 2024-05-15

### Fixed

- Fixed CLI argument handling to properly support flags
- Updated MCP configuration to use node directly for local development
- Improved documentation for Cursor integration

## [0.2.6] - 2024-05-15

### Added

- Added `--health-check` CLI flag for running documentation health checks
- Added comprehensive documentation for the health check feature
- Added npm script for running health checks
- Updated README with health check information

## [0.2.5] - 2024-05-15

### Fixed

- Fixed NPX usage without specifying a docs directory
- Added support for using the default docs directory in the current working directory
- Improved error handling for missing docs directory

## [0.2.4] - 2024-05-15

### Fixed

- Resolved orphaned documents issue by improving navigation structure
- Enhanced documentation health check reporting
- Updated documentation with comprehensive examples and guides

### Added

- Added index.md files to all documentation sections for better navigation
- Improved documentation structure with proper navigation hierarchy
- Added health report documentation

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
