import fs from "fs/promises";
import path from "path";
import { validatePath } from "../utils/path.js";
import {
  DocumentEntry,
  DocumentMetadata,
  NavigationItem,
  NavigationSection,
  TreeEntry,
} from "../types/docs.js";
import { ToolResponse } from "../types/tools.js";
import matter from "gray-matter";

/**
 * Reads a markdown document and extracts its content and metadata
 */
export async function readDocument(
  docPath: string,
  allowedDirectories: string[]
): Promise<ToolResponse> {
  try {
    const normalizedPath = await validatePath(docPath, allowedDirectories);

    // Read the file
    const content = await fs.readFile(normalizedPath, "utf-8");

    // Parse frontmatter
    const { data: metadata, content: markdownContent } = matter(content);

    return {
      content: [{ type: "text", text: "Document read successfully" }],
      metadata: {
        path: docPath,
        content: markdownContent,
        metadata,
      },
    };
  } catch (error: any) {
    return {
      content: [
        { type: "text", text: `Error reading document: ${error.message}` },
      ],
      isError: true,
    };
  }
}

/**
 * Lists all markdown documents in a directory
 */
export async function listDocuments(
  basePath: string,
  allowedDirectories: string[]
): Promise<ToolResponse> {
  try {
    const normalizedBasePath = basePath
      ? await validatePath(basePath, allowedDirectories)
      : allowedDirectories[0];

    const documents: DocumentEntry[] = [];

    async function processDirectory(dirPath: string) {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          await processDirectory(entryPath);
        } else if (entry.name.endsWith(".md")) {
          try {
            const content = await fs.readFile(entryPath, "utf-8");
            const { data: metadata } = matter(content);

            documents.push({
              path: entryPath,
              name: entry.name,
              metadata: metadata as DocumentMetadata,
            });
          } catch (error: any) {
            console.error(`Error processing ${entryPath}: ${error.message}`);
          }
        }
      }
    }

    await processDirectory(normalizedBasePath);

    return {
      content: [{ type: "text", text: `Found ${documents.length} documents` }],
      metadata: {
        documents,
      },
    };
  } catch (error: any) {
    return {
      content: [
        { type: "text", text: `Error listing documents: ${error.message}` },
      ],
      isError: true,
    };
  }
}

/**
 * Gets the structure of the documentation directory
 */
export async function getStructure(
  basePath: string,
  allowedDirectories: string[]
): Promise<ToolResponse> {
  try {
    const normalizedBasePath = basePath
      ? await validatePath(basePath, allowedDirectories)
      : allowedDirectories[0];

    async function buildStructure(
      dirPath: string,
      relativePath = ""
    ): Promise<TreeEntry> {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const children: TreeEntry[] = [];

        let metadata: DocumentMetadata | undefined;

        // Check if there's an index.md file to get directory metadata
        const indexPath = path.join(dirPath, "index.md");
        try {
          const indexStat = await fs.stat(indexPath);
          if (indexStat.isFile()) {
            const content = await fs.readFile(indexPath, "utf-8");
            const { data } = matter(content);
            metadata = data as DocumentMetadata;
          }
        } catch (error) {
          // No index.md file, that's fine
        }

        // Process all entries
        for (const entry of entries) {
          const entryPath = path.join(dirPath, entry.name);
          const entryRelativePath = path.join(relativePath, entry.name);

          if (entry.isDirectory()) {
            const subDir = await buildStructure(entryPath, entryRelativePath);
            children.push(subDir);
          } else if (entry.name.endsWith(".md") && entry.name !== "index.md") {
            try {
              const content = await fs.readFile(entryPath, "utf-8");
              const { data } = matter(content);

              children.push({
                name: entry.name,
                path: entryRelativePath,
                type: "file",
                metadata: data as DocumentMetadata,
                children: [],
              });
            } catch (error: any) {
              children.push({
                name: entry.name,
                path: entryRelativePath,
                type: "file",
                error: error.message,
                children: [],
              });
            }
          }
        }

        // Sort children by order metadata if available, then by name
        children.sort((a, b) => {
          const orderA = a.metadata?.order ?? Infinity;
          const orderB = b.metadata?.order ?? Infinity;

          if (orderA !== orderB) {
            return orderA - orderB;
          }

          return a.name.localeCompare(b.name);
        });

        return {
          name: path.basename(dirPath),
          path: relativePath,
          type: "directory",
          metadata,
          children,
        };
      } catch (error: any) {
        return {
          name: path.basename(dirPath),
          path: relativePath,
          type: "directory",
          error: error.message,
          children: [],
        };
      }
    }

    const structure = await buildStructure(normalizedBasePath);

    return {
      content: [
        {
          type: "text",
          text: "Documentation structure retrieved successfully",
        },
      ],
      metadata: {
        structure,
      },
    };
  } catch (error: any) {
    return {
      content: [
        { type: "text", text: `Error getting structure: ${error.message}` },
      ],
      isError: true,
    };
  }
}

/**
 * Gets the navigation structure for the documentation
 */
export async function getNavigation(
  basePath: string,
  allowedDirectories: string[]
): Promise<ToolResponse> {
  try {
    // First get the structure
    const structureResponse = await getStructure(basePath, allowedDirectories);

    if (structureResponse.isError) {
      return structureResponse;
    }

    const structure = structureResponse.metadata?.structure as TreeEntry;

    // Build navigation from structure
    function buildNavigation(structure: TreeEntry): NavigationSection[] {
      const sections: NavigationSection[] = [];

      function processNode(node: TreeEntry, parentPath: string[] = []) {
        // Skip nodes with errors
        if (node.error) {
          return;
        }

        if (node.type === "directory") {
          // Create a section for this directory
          const section: NavigationSection = {
            title: node.metadata?.title || node.name,
            path: node.path ? `/${node.path}` : null,
            items: [],
            order: node.metadata?.order ?? Infinity,
          };

          // Process children
          for (const child of node.children) {
            if (child.type === "file") {
              // Add file as an item
              section.items.push({
                title: child.metadata?.title || child.name.replace(/\.md$/, ""),
                path: `/${child.path}`,
                order: child.metadata?.order ?? Infinity,
              });
            } else if (child.type === "directory") {
              // Process subdirectory
              const childSections = processNode(child, [
                ...parentPath,
                node.name,
              ]);
              if (childSections) {
                sections.push(...childSections);
              }
            }
          }

          // Sort items by order
          section.items.sort((a: NavigationItem, b: NavigationItem) => {
            if (a.order !== b.order) {
              return a.order - b.order;
            }
            return a.title.localeCompare(b.title);
          });

          // Only add section if it has items
          if (section.items.length > 0) {
            sections.push(section);
          }

          return sections;
        }

        return null;
      }

      processNode(structure);

      // Sort sections by order
      sections.sort((a, b) => {
        if (a.order !== b.order) {
          return a.order - b.order;
        }
        return a.title.localeCompare(b.title);
      });

      return sections;
    }

    const navigation = buildNavigation(structure);

    return {
      content: [
        { type: "text", text: "Navigation structure retrieved successfully" },
      ],
      metadata: {
        navigation,
      },
    };
  } catch (error: any) {
    return {
      content: [
        { type: "text", text: `Error getting navigation: ${error.message}` },
      ],
      isError: true,
    };
  }
}
