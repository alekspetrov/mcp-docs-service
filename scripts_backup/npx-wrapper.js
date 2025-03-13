#!/usr/bin/env node

/**
 * NPX Wrapper for MCP Docs Service
 *
 * This script is a standalone wrapper that can be used directly with npx.
 * It doesn't require any additional files from the package and will download
 * and run the MCP Docs Service directly.
 */

import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

// Wrap everything in a try/catch to catch any initialization errors
try {
  // Create a log file for debugging
  const logFile = path.join(process.cwd(), "npx-debug.log");
  fs.writeFileSync(
    logFile,
    `NPX wrapper called at ${new Date().toISOString()}\n`
  );
  fs.appendFileSync(logFile, `Arguments: ${JSON.stringify(process.argv)}\n`);
  fs.appendFileSync(logFile, `Working directory: ${process.cwd()}\n`);

  // Get the docs directory from arguments or use default
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

  // Install the MCP Docs Service if not already installed
  const packageName = "mcp-docs-service";
  fs.appendFileSync(logFile, `Checking if ${packageName} is installed...\n`);

  // Run the MCP Docs Service
  fs.appendFileSync(
    logFile,
    `Running MCP Docs Service with docs dir: ${docsDir}\n`
  );

  // Use npx to run the service directly
  const npxArgs = ["-y", packageName, "--docs-dir", docsDir];
  fs.appendFileSync(
    logFile,
    `Running npx with args: ${JSON.stringify(npxArgs)}\n`
  );

  const child = spawn("npx", npxArgs, {
    stdio: "inherit",
    env: { ...process.env, MCP_STANDALONE_WRAPPER: "true" },
  });

  child.on("exit", (code) => {
    fs.appendFileSync(logFile, `Child process exited with code ${code}\n`);
    process.exit(code);
  });

  child.on("error", (err) => {
    fs.appendFileSync(
      logFile,
      `Error spawning child process: ${err.message}\n`
    );
    console.error(`Error running MCP Docs Service: ${err.message}`);
    process.exit(1);
  });
} catch (error) {
  // Write to a fallback log file in case the main one couldn't be created
  try {
    fs.writeFileSync(
      path.join(process.cwd(), "npx-error.log"),
      `Fatal error in npx-wrapper.js: ${error.message}\n${error.stack}\n`
    );
  } catch (e) {
    // Last resort, just log to console
    console.error(`Fatal error in npx-wrapper.js: ${error.message}`);
    console.error(error.stack);
  }
  process.exit(1);
}
