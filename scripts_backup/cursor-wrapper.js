#!/usr/bin/env node

/**
 * Cursor Wrapper for MCP Docs Service
 *
 * This script is designed to be used as the entry point for Cursor's MCP integration.
 * It handles the arguments properly and forwards them to the actual MCP Docs Service.
 */

import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

// Wrap everything in a try/catch to catch any initialization errors
try {
  // Get the current directory
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Create a log file for debugging
  const logFile = path.join(process.cwd(), "cursor-debug.log");
  fs.writeFileSync(
    logFile,
    `Cursor wrapper called at ${new Date().toISOString()}\n`
  );
  fs.appendFileSync(logFile, `Arguments: ${JSON.stringify(process.argv)}\n`);
  fs.appendFileSync(logFile, `Working directory: ${process.cwd()}\n`);
  fs.appendFileSync(logFile, `Script directory: ${__dirname}\n`);
  fs.appendFileSync(logFile, `Package structure:\n`);

  // List files in the package directory to debug
  try {
    const files = fs.readdirSync(__dirname);
    fs.appendFileSync(
      logFile,
      `Files in package dir: ${JSON.stringify(files)}\n`
    );

    // Check if dist directory exists
    const distDir = path.join(__dirname, "dist");
    if (fs.existsSync(distDir)) {
      const distFiles = fs.readdirSync(distDir);
      fs.appendFileSync(
        logFile,
        `Files in dist dir: ${JSON.stringify(distFiles)}\n`
      );

      // Check if cli directory exists
      const cliDir = path.join(distDir, "cli");
      if (fs.existsSync(cliDir)) {
        const cliFiles = fs.readdirSync(cliDir);
        fs.appendFileSync(
          logFile,
          `Files in cli dir: ${JSON.stringify(cliFiles)}\n`
        );
      } else {
        fs.appendFileSync(logFile, `CLI directory not found: ${cliDir}\n`);
      }
    } else {
      fs.appendFileSync(logFile, `Dist directory not found: ${distDir}\n`);
    }
  } catch (err) {
    fs.appendFileSync(logFile, `Error listing files: ${err.message}\n`);
  }

  // Extract the docs directory from the arguments
  // The docs directory is expected to be the last argument
  let docsDir = path.join(process.cwd(), "docs");
  const args = process.argv.slice(2);

  fs.appendFileSync(logFile, `Processing args: ${JSON.stringify(args)}\n`);

  if (args.length > 0) {
    // Check if --docs-dir flag is used
    const docsDirIndex = args.indexOf("--docs-dir");
    if (docsDirIndex !== -1 && docsDirIndex + 1 < args.length) {
      docsDir = args[docsDirIndex + 1];
      fs.appendFileSync(logFile, `Found --docs-dir flag, using: ${docsDir}\n`);
    } else {
      // Otherwise, use the last argument if it looks like a path
      const lastArg = args[args.length - 1];
      if (!lastArg.startsWith("-")) {
        docsDir = lastArg;
        fs.appendFileSync(logFile, `Using last arg as docs dir: ${docsDir}\n`);
      }
    }
  } else {
    fs.appendFileSync(
      logFile,
      `No args provided, using default docs dir: ${docsDir}\n`
    );
  }

  // Resolve the docs directory to an absolute path
  docsDir = path.resolve(docsDir);
  fs.appendFileSync(logFile, `Using docs directory: ${docsDir}\n`);

  // Ensure the docs directory exists
  if (!fs.existsSync(docsDir)) {
    fs.appendFileSync(logFile, `Creating docs directory: ${docsDir}\n`);
    try {
      fs.mkdirSync(docsDir, { recursive: true });
      fs.appendFileSync(logFile, `Successfully created docs directory\n`);
    } catch (error) {
      fs.appendFileSync(logFile, `Error creating docs directory: ${error}\n`);
      console.error(`Error creating docs directory: ${error}`);
      process.exit(1);
    }
  }

  // Set up the arguments for the actual service
  const serviceArgs = ["--docs-dir", docsDir];
  fs.appendFileSync(
    logFile,
    `Service arguments: ${JSON.stringify(serviceArgs)}\n`
  );

  // Find the bin.js file
  let binPath = path.join(__dirname, "dist", "cli", "bin.js");

  // Check if the bin.js file exists
  if (!fs.existsSync(binPath)) {
    fs.appendFileSync(
      logFile,
      `bin.js not found at ${binPath}, searching...\n`
    );

    // Try to find bin.js in node_modules
    const nodeModulesPath = path.join(
      process.cwd(),
      "node_modules",
      "mcp-docs-service"
    );
    if (fs.existsSync(nodeModulesPath)) {
      const potentialBinPath = path.join(
        nodeModulesPath,
        "dist",
        "cli",
        "bin.js"
      );
      if (fs.existsSync(potentialBinPath)) {
        binPath = potentialBinPath;
        fs.appendFileSync(
          logFile,
          `Found bin.js in node_modules: ${binPath}\n`
        );
      }
    }
  }

  fs.appendFileSync(
    logFile,
    `Running service: ${binPath} ${serviceArgs.join(" ")}\n`
  );

  // Check if the bin file exists before trying to run it
  if (!fs.existsSync(binPath)) {
    fs.appendFileSync(logFile, `ERROR: bin.js not found at ${binPath}\n`);
    console.error(
      `ERROR: Could not find the MCP Docs Service binary at ${binPath}`
    );
    process.exit(1);
  }

  // Run the actual service
  const child = spawn("node", [binPath, ...serviceArgs], {
    stdio: "inherit",
    env: { ...process.env, MCP_CURSOR_INTEGRATION: "true" },
  });

  child.on("exit", (code) => {
    fs.appendFileSync(logFile, `Child process exited with code ${code}\n`);
    process.exit(code);
  });

  // Handle errors
  child.on("error", (err) => {
    fs.appendFileSync(
      logFile,
      `Error spawning child process: ${err.message}\n`
    );
    console.error(`Error spawning MCP Docs Service: ${err.message}`);
    process.exit(1);
  });
} catch (error) {
  // Write to a fallback log file in case the main one couldn't be created
  try {
    fs.writeFileSync(
      path.join(process.cwd(), "cursor-error.log"),
      `Fatal error in cursor-wrapper.js: ${error.message}\n${error.stack}\n`
    );
  } catch (e) {
    // Last resort, just log to console
    console.error(`Fatal error in cursor-wrapper.js: ${error.message}`);
    console.error(error.stack);
  }
  process.exit(1);
}
