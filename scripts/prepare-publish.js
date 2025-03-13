#!/usr/bin/env node

/**
 * This script prepares the package for publishing by copying necessary documentation files.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Create a temp directory for publishing
const tempDir = path.join(rootDir, "temp-publish");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Copy essential files
const filesToCopy = [
  "package.json",
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "mcp-inspector-wrapper.js",
  "cursor-wrapper.js",
  "npx-wrapper.js",
  "npx-standalone.cjs",
];

filesToCopy.forEach((file) => {
  const sourcePath = path.join(rootDir, file);
  const destPath = path.join(tempDir, file);
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied ${file} to temp directory`);
  } else {
    console.warn(`Warning: ${file} not found`);
  }
});

// Copy dist directory
const distDir = path.join(rootDir, "dist");
const tempDistDir = path.join(tempDir, "dist");
if (fs.existsSync(distDir)) {
  if (!fs.existsSync(tempDistDir)) {
    fs.mkdirSync(tempDistDir);
  }

  // Copy all files from dist directory
  const distFiles = fs.readdirSync(distDir);
  distFiles.forEach((file) => {
    const sourcePath = path.join(distDir, file);
    const destPath = path.join(tempDistDir, file);

    if (fs.statSync(sourcePath).isDirectory()) {
      // If it's a directory, create it and copy its contents recursively
      copyDirRecursive(sourcePath, destPath);
    } else {
      // If it's a file, just copy it
      fs.copyFileSync(sourcePath, destPath);
    }
  });

  console.log("Copied dist directory to temp directory");
} else {
  console.error("Error: dist directory not found. Run npm run build first.");
  process.exit(1);
}

// Copy docs directory (for reference, not included in the package)
const docsDir = path.join(rootDir, "docs");
const tempDocsDir = path.join(tempDir, "docs");
if (fs.existsSync(docsDir)) {
  copyDirRecursive(docsDir, tempDocsDir);
  console.log("Copied docs directory to temp directory");
} else {
  console.warn("Warning: docs directory not found");
}

console.log("\nPackage prepared for publishing in temp-publish directory.");
console.log("To publish, run:");
console.log("cd temp-publish && npm publish");

/**
 * Recursively copy a directory
 */
function copyDirRecursive(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination);
  }

  const files = fs.readdirSync(source);

  files.forEach((file) => {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);

    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirRecursive(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}
