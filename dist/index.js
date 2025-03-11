// Helper function for programmatic usage
export async function query(command, options = {}) {
    // Import the server dynamically to avoid circular dependencies
    const { MCPDocsServer } = await import("./server.js");
    const server = new MCPDocsServer(options.docsDir || "./docs", {
        createIfNotExists: options.createIfNotExists || false,
    });
    // Parse the command and execute it
    const [name, argsStr] = command.split("(");
    const argsObj = {}; // Use proper typing
    if (argsStr && argsStr !== ")") {
        const cleanArgsStr = argsStr.substring(0, argsStr.length - 1);
        const argPairs = cleanArgsStr.split(",");
        for (const pair of argPairs) {
            const [key, rawValue] = pair.split("=");
            const trimmedKey = key.trim();
            const trimmedValue = rawValue.trim();
            // Handle different value types
            if (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) {
                argsObj[trimmedKey] = trimmedValue.substring(1, trimmedValue.length - 1);
            }
            else if (trimmedValue === "true" || trimmedValue === "false") {
                argsObj[trimmedKey] = trimmedValue === "true";
            }
            else if (!isNaN(Number(trimmedValue))) {
                argsObj[trimmedKey] = Number(trimmedValue);
            }
            else if (trimmedValue.startsWith("{") && trimmedValue.endsWith("}")) {
                argsObj[trimmedKey] = JSON.parse(trimmedValue);
            }
            else if (trimmedValue.startsWith("[") && trimmedValue.endsWith("]")) {
                argsObj[trimmedKey] = JSON.parse(trimmedValue);
            }
        }
    }
    // Execute the command
    const result = await server.executeHandler(name, argsObj);
    return result;
}
// Export types and the MCPDocsServer
export * from "./types.js";
export { MCPDocsServer } from "./server.js";
//# sourceMappingURL=index.js.map