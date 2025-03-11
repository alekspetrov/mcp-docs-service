/**
 * Document processor for handling markdown files with front matter
 */
import { DocContent, DocMetadata } from "../types/index.js";
/**
 * Parses front matter and content from a markdown file
 * Front matter format is YAML between triple dashes:
 * ---
 * key: value
 * ---
 */
export declare function parseMarkdownWithFrontMatter(filePath: string, content: string): DocContent;
/**
 * Creates front matter text from metadata
 */
export declare function createFrontMatter(metadata: DocMetadata): string;
/**
 * Combines metadata and content into a full document
 */
export declare function combineMetadataAndContent(metadata: DocMetadata, content: string): string;
