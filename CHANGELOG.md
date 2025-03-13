# Changelog

All notable changes to this project will be documented in this file.

## [0.3.8] - 2024-03-13

### Added

- Added dedicated `npx-wrapper.cjs` script for better npx integration
- Extended environment variable detection to support npx execution context

### Fixed

- Fixed npx integration issues by properly handling stdio communication
- Redirected console output to stderr when running under npx to maintain clean protocol communication
- Updated package.json to include the new npx wrapper script in the published package

## [0.3.7] - 2024-03-13

### Added

- Added dedicated `cursor-wrapper.cjs` script for better Cursor integration
- Implemented safe logging mechanism to prevent interference with MCP protocol
- Added environment variable detection for different execution contexts

### Fixed

- Fixed Cursor integration issues by properly handling stdio communication
- Redirected console output to stderr when running under Cursor to maintain clean protocol communication
- Updated package.json to include the new wrapper script in the published package

## [0.3.6] - 2024-03-13

### Fixed

- Fixed critical version mismatch in server configuration
- Added environment variables to Cursor configuration for better debugging
- Ensured consistent version across package.json and server code

## [0.3.5] - 2024-03-13

### Fixed

- Fixed version mismatch between package.json and server configuration
- Improved argument handling to support both positional and flag-based paths
- Enhanced Cursor integration with better configuration examples

### Changed

- Updated documentation to clarify usage with Cursor
- Simplified configuration approach for better compatibility

## [0.3.4] - 2024-03-13

### Fixed

- Fixed version mismatch between package.json and server configuration
- Improved argument handling to support both positional and flag-based paths
- Enhanced Cursor integration with better configuration examples

### Changed

- Updated documentation to clarify usage with Cursor
- Simplified configuration approach for better compatibility

## [0.3.2] - 2024-03-13

### Fixed

- Removed build directory and ensured output to dist directory
- Fixed build process to correctly output to the directory referenced in package.json

## [0.3.1] - 2024-03-13

### Changed

- Updated documentation to use direct path argument pattern similar to filesystem server
- Improved Cursor integration guide with clearer examples
- Enhanced README with more explicit configuration examples

## [0.3.0] - 2024-03-13

### Changed

- Complete refactoring to use the filesystem server pattern
- Simplified implementation with a single entry point
- Removed all wrapper scripts for a more direct approach
- Improved error handling and validation
- Enhanced documentation tools with better diffing and navigation

### Added

- Automatic docs directory creation with sample README.md
- Documentation health check functionality
- Navigation generation for documentation structure
- Comprehensive examples and guides

## [0.2.17] - 2024-03-13

### Fixed

- Fixed critical bug in error logging function that caused crashes
- Enhanced error handling throughout the application

### Added

- Created new wrapper script `npx-standalone.cjs` for improved reliability with npx
- Added detailed logging for troubleshooting

### Changed

- Updated documentation to reflect new findings and recommendations
- Improved Cursor integration guide with clearer instructions

## [0.2.16] - 2024-03-12

### Fixed

- Fixed issue with MCP Inspector integration
- Improved error handling in wrapper scripts

### Added

- Added more detailed logging for troubleshooting

## [0.2.15] - 2024-03-12

### Fixed

- Fixed issue with path resolution in wrapper scripts
- Improved error handling in CLI

### Added

- Added more detailed logging for troubleshooting

## [0.2.14] - 2024-03-12

### Fixed

- Fixed issue with path resolution in wrapper scripts
- Improved error handling in CLI

### Added

- Added more detailed logging for troubleshooting

## [0.2.13] - 2024-03-12

### Fixed

- Fixed issue with path resolution in wrapper scripts
- Improved error handling in CLI

### Added

- Added more detailed logging for troubleshooting

## [0.2.12] - 2024-03-12

### Fixed

- Fixed issue with path resolution in wrapper scripts
- Improved error handling in CLI

### Added

- Added more detailed logging for troubleshooting

## [0.2.11] - 2024-03-12

### Fixed

- Fixed issue with path resolution in wrapper scripts
- Improved error handling in CLI

### Added

- Added more detailed logging for troubleshooting

## [0.2.10] - 2024-03-12

### Fixed

- Fixed issue with path resolution in wrapper scripts
- Improved error handling in CLI

### Added

- Added more detailed logging for troubleshooting

## [0.2.9] - 2024-03-12

### Fixed

- Fixed issue with path resolution in wrapper scripts
- Improved error handling in CLI

### Added

- Added more detailed logging for troubleshooting

## [0.2.8] - 2024-03-12

### Fixed

- Fixed issue with path resolution in wrapper scripts
- Improved error handling in CLI

### Added

- Added more detailed logging for troubleshooting

## [0.2.7] - 2024-03-12

### Fixed

- Fixed issue with path resolution in wrapper scripts
- Improved error handling in CLI

### Added

- Added more detailed logging for troubleshooting

## [0.2.6] - 2024-03-12

### Fixed

- Fixed issue with path resolution in wrapper scripts
- Improved error handling in CLI

### Added

- Added more detailed logging for troubleshooting

## [0.2.5] - 2024-03-12

### Fixed

- Fixed issue with path resolution in wrapper scripts
- Improved error handling in CLI

### Added

- Added more detailed logging for troubleshooting

## [0.2.4] - 2024-03-12

### Fixed

- Fixed issue with path resolution in wrapper scripts
- Improved error handling in CLI

### Added

- Added more detailed logging for troubleshooting

## [0.2.3] - 2024-03-12

### Fixed

- Fixed issue with path resolution in wrapper scripts
- Improved error handling in CLI

### Added

- Added more detailed logging for troubleshooting

## [0.2.1] - 2024-03-11

### Fixed

- Fixed issue with path resolution in wrapper scripts
- Improved error handling in CLI

### Added

- Added more detailed logging for troubleshooting

## [0.2.0] - 2024-03-11

### Added

- Initial release of MCP Docs Service
- Support for reading, writing, and managing markdown documentation
- Integration with Cursor and MCP Inspector
- Comprehensive documentation and examples
