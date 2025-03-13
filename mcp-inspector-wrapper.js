#!/usr/bin/env node

/**
 * MCP Inspector Wrapper
 *
 * This script is a wrapper for the MCP Docs Service that handles the MCP Inspector's argument format.
 * It extracts the docs directory from the arguments and passes it to the MCP Docs Service.
 */

import path from "path";
import { spawn } from "child_process";
import fs from "fs";
import { fileURLToPath } from "url";

// Wrap everything in a try/catch to catch any initialization errors
try {
  // Get the current directory
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Redirect logs to stderr instead of stdout to avoid interfering with JSON communication
  const log = (...args) => {
    console.error(...args);
  };

  // Create a log file for debugging
  const logFile = path.join(process.cwd(), "inspector-debug.log");
  fs.writeFileSync(
    logFile,
    `MCP Inspector Wrapper called at ${new Date().toISOString()}\n`
  );

  // Get all arguments
  const args = process.argv.slice(2);
  fs.appendFileSync(
    logFile,
    `MCP Inspector Wrapper - Arguments: ${JSON.stringify(args)}\n`
  );
  fs.appendFileSync(logFile, `Working directory: ${process.cwd()}\n`);
  fs.appendFileSync(logFile, `Script directory: ${__dirname}\n`);
  log("MCP Inspector Wrapper - Arguments:", args);

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

  // Find the docs directory in the arguments
  let docsDir = path.join(process.cwd(), "docs");
  let foundDocsDir = false;

  // Look for a path ending with /docs
  for (const arg of args) {
    if (arg.endsWith("/docs") || arg.includes("/docs ")) {
      const potentialPath = arg.split(" ")[0];
      log("Found potential docs path:", potentialPath);
      fs.appendFileSync(
        logFile,
        `Found potential docs path: ${potentialPath}\n`
      );

      if (fs.existsSync(potentialPath)) {
        docsDir = potentialPath;
        foundDocsDir = true;
        log("Using docs directory:", docsDir);
        fs.appendFileSync(logFile, `Using docs directory: ${docsDir}\n`);
        break;
      }
    }
  }

  if (!foundDocsDir) {
    log("No docs directory found in arguments, using default:", docsDir);
    fs.appendFileSync(
      logFile,
      `No docs directory found in arguments, using default: ${docsDir}\n`
    );

    // Ensure the docs directory exists
    if (!fs.existsSync(docsDir)) {
      fs.appendFileSync(logFile, `Creating docs directory: ${docsDir}\n`);
      try {
        fs.mkdirSync(docsDir, { recursive: true });
        fs.appendFileSync(logFile, `Successfully created docs directory\n`);
      } catch (error) {
        fs.appendFileSync(logFile, `Error creating docs directory: ${error}\n`);
        log(`Error creating docs directory: ${error}`);
        process.exit(1);
      }
    }
  }

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

  log("Spawning MCP Docs Service:", binPath, "--docs-dir", docsDir);
  fs.appendFileSync(
    logFile,
    `Spawning MCP Docs Service: ${binPath} --docs-dir ${docsDir}\n`
  );

  // Check if the bin file exists before trying to run it
  if (!fs.existsSync(binPath)) {
    fs.appendFileSync(logFile, `ERROR: bin.js not found at ${binPath}\n`);
    log(`ERROR: Could not find the MCP Docs Service binary at ${binPath}`);
    process.exit(1);
  }

  // Set environment variable to indicate we're running under MCP Inspector
  const env = { ...process.env, MCP_INSPECTOR: "true" };

  // Spawn the process with stdio inheritance
  // This ensures that the JSON communication between the MCP Inspector and the service
  // is not interrupted by our logs
  const child = spawn("node", [binPath, "--docs-dir", docsDir], {
    stdio: "inherit",
    env,
  });

  // Forward exit code
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
    log(`Error spawning MCP Docs Service: ${err.message}`);
    process.exit(1);
  });
} catch (error) {
  // Write to a fallback log file in case the main one couldn't be created
  try {
    fs.writeFileSync(
      path.join(process.cwd(), "inspector-error.log"),
      `Fatal error in mcp-inspector-wrapper.js: ${error.message}\n${error.stack}\n`
    );
  } catch (e) {
    // Last resort, just log to console
    console.error(`Fatal error in mcp-inspector-wrapper.js: ${error.message}`);
    console.error(error.stack);
  }
  process.exit(1);
}
