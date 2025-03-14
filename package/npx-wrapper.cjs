#!/usr/bin/env node

/**
 * MCP NPX Wrapper
 *
 * This script is a wrapper for the MCP Docs Service that ensures proper stdio handling when run via npx.
 * It redirects all console.log output to stderr to avoid interfering with the JSON communication.
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Create a debug log file
const logDir = path.join(
  process.env.HOME || process.env.USERPROFILE,
  ".mcp-docs-service"
);
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (err) {
  // Ignore errors creating log directory
}

const logFile = path.join(logDir, "npx-debug.log");
try {
  fs.writeFileSync(
    logFile,
    `MCP NPX Wrapper called at ${new Date().toISOString()}\n`
  );
} catch (err) {
  // Ignore errors writing to log file
}

// Helper function to log to the file
const logToFile = (message) => {
  try {
    fs.appendFileSync(logFile, `${message}\n`);
  } catch (err) {
    // Ignore errors writing to log file
  }
};

// Log debug information
logToFile(`Process arguments: ${JSON.stringify(process.argv)}`);
logToFile(`Working directory: ${process.cwd()}`);
logToFile(`Script directory: ${__dirname}`);
logToFile(`Node version: ${process.version}`);
logToFile(`Platform: ${process.platform}`);
logToFile(`Environment variables: ${JSON.stringify(process.env.PATH)}`);

// Find the path to the actual service script
// When run via npx, the script will be in the package's directory
let servicePath;
try {
  servicePath = path.resolve(path.join(__dirname, "dist", "index.js"));
  logToFile(`Service path: ${servicePath}`);

  // Check if the service script exists
  if (!fs.existsSync(servicePath)) {
    logToFile(`ERROR: Service script not found at ${servicePath}`);

    // Try to find the script in the current directory
    const localPath = path.resolve(
      path.join(process.cwd(), "dist", "index.js")
    );
    logToFile(`Trying local path: ${localPath}`);

    if (fs.existsSync(localPath)) {
      servicePath = localPath;
      logToFile(`Found service script at local path: ${servicePath}`);
    } else {
      // Try to find the script in node_modules
      const nodeModulesPath = path.resolve(
        path.join(
          process.cwd(),
          "node_modules",
          "mcp-docs-service",
          "dist",
          "index.js"
        )
      );
      logToFile(`Trying node_modules path: ${nodeModulesPath}`);

      if (fs.existsSync(nodeModulesPath)) {
        servicePath = nodeModulesPath;
        logToFile(`Found service script in node_modules: ${servicePath}`);
      } else {
        logToFile(`ERROR: Could not find service script`);
        console.error(`ERROR: Could not find service script`);
        process.exit(1);
      }
    }
  }
} catch (err) {
  logToFile(`ERROR finding service path: ${err.message}`);
  console.error(`ERROR finding service path: ${err.message}`);
  process.exit(1);
}

// Get command line arguments, skipping the first two (node and script path)
const args = process.argv.slice(2);
logToFile(`Command line arguments: ${JSON.stringify(args)}`);

// Set environment variables
const env = {
  ...process.env,
  MCP_NPX_WRAPPER: "true",
  // Redirect console.log to stderr
  NODE_OPTIONS: `${process.env.NODE_OPTIONS || ""} --redirect-warnings=stderr`,
};

// Create a child process with piped stdio
// This is critical for MCP - we need to control stdin/stdout directly
try {
  logToFile(`Spawning child process: node ${servicePath} ${args.join(" ")}`);

  const child = spawn("node", [servicePath, ...args], {
    stdio: ["pipe", "pipe", "pipe"],
    env,
  });

  // Redirect child's stderr to our stderr
  child.stderr.on("data", (data) => {
    process.stderr.write(data);

    // Also log to file for debugging
    try {
      logToFile(`STDERR: ${data.toString()}`);
    } catch (err) {
      // Ignore errors
    }
  });

  // Pipe our stdin directly to child's stdin
  process.stdin.pipe(child.stdin);

  // Pipe child's stdout directly to our stdout
  // This is the critical part - we don't want to modify the JSON communication
  child.stdout.pipe(process.stdout);

  // Handle process exit
  child.on("exit", (code) => {
    logToFile(`Child process exited with code ${code}`);
    process.exit(code || 0);
  });

  // Handle errors
  child.on("error", (err) => {
    logToFile(`Error spawning child process: ${err.message}`);
    console.error(`Error spawning MCP Docs Service: ${err.message}`);
    process.exit(1);
  });
} catch (err) {
  logToFile(`ERROR spawning child process: ${err.message}`);
  console.error(`ERROR spawning child process: ${err.message}`);
  process.exit(1);
}
