/**
 * Document processor for handling markdown files with front matter
 */

import { DocContent, DocMetadata } from "../types/index.ts";

/**
 * Parses front matter and content from a markdown file
 * Front matter format is YAML between triple dashes:
 * ---
 * key: value
 * ---
 */
export function parseMarkdownWithFrontMatter(
  filePath: string,
  content: string
): DocContent {
  const metadata: DocMetadata = {
    title: extractTitleFromContent(content) || extractTitleFromPath(filePath),
  };

  // Check if the content has front matter
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontMatterRegex);

  if (match) {
    const frontMatterText = match[1];
    const frontMatterLines = frontMatterText.split("\n");

    // Parse front matter lines
    for (const line of frontMatterLines) {
      const lineTrimmed = line.trim();
      if (!lineTrimmed || lineTrimmed.startsWith("#")) continue;

      const colonIndex = lineTrimmed.indexOf(":");
      if (colonIndex > 0) {
        const key = lineTrimmed.slice(0, colonIndex).trim();
        const value = lineTrimmed.slice(colonIndex + 1).trim();

        // Handle special front matter keys safely
        if (key === "globs" || key === "tags") {
          try {
            // If it's a YAML array, parse it
            if (value.startsWith("[") && value.endsWith("]")) {
              const arrayItems = value
                .slice(1, -1)
                .split(",")
                .map((item) => item.trim().replace(/^['"]|['"]$/g, ""));
              (metadata as any)[key] = arrayItems;
            } else {
              (metadata as any)[key] = [value];
            }
          } catch (e) {
            console.error(`Error parsing ${key} in ${filePath}:`, e);
          }
        } else if (key === "alwaysApply") {
          metadata.alwaysApply = value.toLowerCase() === "true";
        } else {
          (metadata as any)[key] = value;
        }
      }
    }

    // Remove front matter from content
    content = content.replace(frontMatterRegex, "");
  }

  return {
    metadata,
    content,
    path: filePath,
  };
}

/**
 * Creates front matter text from metadata
 */
export function createFrontMatter(metadata: DocMetadata): string {
  const lines: string[] = ["---"];

  // Add each metadata field
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined) continue;

    if (Array.isArray(value)) {
      // Use simple format for compatibility
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${item}`);
      }
    } else if (typeof value === "boolean") {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  lines.push("---");
  lines.push("");

  return lines.join("\n");
}

/**
 * Extracts title from content (first h1)
 */
function extractTitleFromContent(content: string): string | null {
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }
  return null;
}

/**
 * Extracts title from file path
 */
function extractTitleFromPath(filePath: string): string {
  const baseName = filePath.split("/").pop() || "";
  const withoutExtension = baseName.replace(/\.md$/, "");
  return withoutExtension
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Combines metadata and content into a full document
 */
export function combineMetadataAndContent(
  metadata: DocMetadata,
  content: string
): string {
  const frontMatter = createFrontMatter(metadata);
  return `${frontMatter}${content}`;
}
