// Simple test to verify single-doc mode
import { spawn } from "child_process";

// Define helper function to run server and make requests
async function testServerMode(args, request) {
  return new Promise((resolve, reject) => {
    const proc = spawn("node", ["dist/index.js", ...args], {
      env: { ...process.env, MCP_SERVICE: "true" },
    });

    let dataBuffer = "";
    let errorOutput = "";

    // Collect stderr for debugging
    proc.stderr.on("data", (data) => {
      errorOutput += data.toString();
      console.error(`[stderr]: ${data.toString()}`);
    });

    // Listen for JSON-RPC responses
    proc.stdout.on("data", (data) => {
      dataBuffer += data.toString();

      // Try to find complete JSON objects in the buffer
      let lastJsonEnd = 0;
      for (let i = 0; i < dataBuffer.length; i++) {
        if (dataBuffer[i] === "\n") {
          const line = dataBuffer.substring(lastJsonEnd, i).trim();
          lastJsonEnd = i + 1;

          if (line) {
            try {
              const response = JSON.parse(line);
              console.log(
                "Received response:",
                JSON.stringify(response, null, 2)
              );

              // We got our response, kill the process and resolve
              proc.kill();
              resolve(response);
              return;
            } catch (e) {
              console.log("Not a valid JSON:", line);
            }
          }
        }
      }

      // Remove processed data
      if (lastJsonEnd > 0) {
        dataBuffer = dataBuffer.substring(lastJsonEnd);
      }
    });

    // Handle process exit
    proc.on("close", (code) => {
      if (code !== 0 && code !== null) {
        console.error(`Process exited with code ${code}`);
        console.error(`Error output: ${errorOutput}`);
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    // Send the request after a brief delay
    setTimeout(() => {
      console.log("Sending request:", JSON.stringify(request, null, 2));
      proc.stdin.write(JSON.stringify(request) + "\n");
    }, 1000);
  });
}

// Test listing tools in regular mode
console.log("Testing regular mode...");
const regularModeRequest = {
  jsonrpc: "2.0",
  id: "1",
  method: "list_tools",
  params: {},
};

testServerMode(["./docs"], regularModeRequest)
  .then((response) => {
    console.log("\n\nREGULAR MODE TOOLS:\n");
    console.log(response.result.tools.map((t) => t.name).join("\n"));

    // Now test single-doc mode
    console.log("\n\nTesting single-doc mode...");
    const singleDocRequest = {
      jsonrpc: "2.0",
      id: "2",
      method: "list_tools",
      params: {},
    };

    return testServerMode(["--single-doc", "./docs"], singleDocRequest);
  })
  .then((response) => {
    console.log("\n\nSINGLE DOC MODE TOOLS:\n");
    console.log(response.result.tools.map((t) => t.name).join("\n"));
    console.log("\nTest completed successfully!");
  })
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
