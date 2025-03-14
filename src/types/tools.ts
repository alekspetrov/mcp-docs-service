/**
 * Standard response format for tools
 */
export type ToolResponse = {
  content: Array<{ type: string; text: string }>;
  metadata?: Record<string, any>;
  isError?: boolean;
};
