# Publishing Checklist

This document outlines the steps to publish a new version of the MCP Docs Service to npm.

## Pre-publish Checklist

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` with new version and changes
- [ ] Ensure all documentation is up to date
- [ ] Run tests: `npm test`
- [ ] Build the package: `npm run build`
- [ ] Check what files will be included: `npm pack --dry-run`
- [ ] Prepare the package for publishing: `npm run prepare-publish`

## Publishing

### Option 1: Using the prepare-publish script

1. Run the prepare-publish script:

   ```
   npm run prepare-publish
   ```

2. Navigate to the temp-publish directory:

   ```
   cd temp-publish
   ```

3. Publish the package:
   ```
   npm publish
   ```

### Option 2: Direct publishing

1. Make sure you're logged in to npm:

   ```
   npm login
   ```

2. Publish the package:
   ```
   npm publish
   ```

## Post-publish Checklist

- [ ] Tag the release in git:

  ```
  git tag -a v0.2.0 -m "Release v0.2.0"
  git push origin v0.2.0
  ```

- [ ] Create a GitHub release (if applicable)

- [ ] Announce the release to users

## Version Bump for Development

After publishing, bump the version to the next development version:

1. Update version in `package.json` to the next development version (e.g., `0.2.1-dev`)
2. Commit the changes:
   ```
   git add package.json
   git commit -m "Bump version to 0.2.1-dev for development"
   git push
   ```
