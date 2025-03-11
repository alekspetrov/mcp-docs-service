export declare function query(command: string, options?: {
    docsDir?: string;
    createIfNotExists?: boolean;
}): Promise<string>;
export * from "./types.js";
export { MCPDocsServer } from "./server.js";
