/**
 * Parse frontmatter from markdown content
 * @param content - The markdown content with frontmatter
 * @returns Parsed frontmatter and content
 */
export function parseFrontmatter(content: string): {
  frontmatter: Record<string, any>;
  content: string;
};

/**
 * Format an object as YAML frontmatter
 * @param frontmatter - The frontmatter object
 * @returns The formatted frontmatter string
 */
export function formatFrontmatter(frontmatter: Record<string, any>): string;
