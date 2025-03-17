---
title: Publishing to npm
description: Guide for publishing the MCP Docs Service to npm
author: Claude
date: 2024-06-15
tags:
  - publishing
  - npm
  - release
status: published
---

# Publishing to npm

This guide explains how to publish a new version of the MCP Docs Service to npm. Follow these steps to ensure a smooth release process.

## Prerequisites

Before publishing, ensure you have:

1. An npm account with publishing rights to the `mcp-docs-service` package
2. Node.js and npm installed on your machine
3. Git access to the repository

## Update Version and Documentation

1. **Update the version number** in `package.json`:

   ```json
   {
     "name": "mcp-docs-service",
     "version": "0.6.0", // Increment from previous version
     ...
   }
   ```

2. **Update the CHANGELOG.md** with details about the new release:

   ```markdown
   # Changelog

   ## 0.6.0 (2024-06-15)

   ### New Features
   - Added resilient-by-default behavior for documentation health checks
   - Improved error handling for missing or poorly structured documentation

   ### Bug Fixes
   - Fixed issues with health check handling of non-existent directories
   - Improved scoring algorithm for documentation health
   ```

3. **Update documentation** to reflect any new features or changes:
   - Update relevant guides
   - Add new examples if needed
   - Ensure README.md is up to date

## Testing Before Release

1. **Run all tests** to ensure everything is working correctly:

   ```bash
   npm test
   ```

2. **Check test coverage** to ensure adequate test coverage:

   ```bash
   npm run test:coverage
   ```

3. **Build the package** to ensure it builds correctly:

   ```bash
   npm run build
   ```

4. **Test the package locally** using npm link:

   ```bash
   # In the mcp-docs-service directory
   npm link

   # In a test project directory
   npm link mcp-docs-service
   ```

## Publishing Process

1. **Prepare the package** for publishing:

   ```bash
   npm run prepare-publish
   ```

   This script creates a `temp-publish` directory with all the necessary files for publishing.

2. **Publish to npm**:

   ```bash
   cd temp-publish
   npm publish
   ```

   If you're publishing a beta or release candidate version, use the appropriate tag:

   ```bash
   npm publish --tag beta
   # or
   npm publish --tag rc
   ```

3. **Verify the publication** by checking the npm registry:

   ```bash
   npm view mcp-docs-service versions
   ```

## After Publishing

1. **Create a Git tag** for the release:

   ```bash
   git tag v0.6.0
   git push origin v0.6.0
   ```

2. **Create a GitHub release** with release notes (if using GitHub)

3. **Announce the release** in appropriate channels:
   - Update documentation website
   - Notify users via appropriate channels
   - Update any integration guides

## Troubleshooting

If you encounter issues during the publishing process:

- **Authentication errors**: Ensure you're logged in to npm with the correct account:
  ```bash
  npm login
  ```

- **Version conflicts**: If the version already exists, you'll need to update the version number in `package.json`

- **Publishing errors**: Check the npm logs for details:
  ```bash
  npm publish --loglevel verbose
  ```

## Publishing Schedule

We follow semantic versioning (SemVer) for releases:

- **Major versions** (1.0.0): Breaking changes
- **Minor versions** (0.1.0): New features without breaking changes
- **Patch versions** (0.0.1): Bug fixes and minor improvements

For the current release schedule, refer to the [roadmap](../roadmap.md).