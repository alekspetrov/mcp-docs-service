import fs from "fs/promises";
import path from "path";
import { validatePath } from "../utils/path.js";
import {
  DocumentEntry,
  DocumentMetadata,
  NavigationItem,
  NavigationSection,
  TreeEntry,
  HealthIssue,
  HealthCheckResult,
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

/**
 * Checks the health of documentation
 */
export async function checkDocumentationHealth(
  basePath: string,
  options: {
    checkLinks?: boolean;
    checkMetadata?: boolean;
    checkOrphans?: boolean;
    requiredMetadataFields?: string[];
  },
  allowedDirectories: string[]
): Promise<ToolResponse> {
  try {
    // Set default options
    const checkLinks = options.checkLinks !== false;
    const checkMetadata = options.checkMetadata !== false;
    const checkOrphans = options.checkOrphans !== false;
    const requiredMetadataFields = options.requiredMetadataFields || [
      "title",
      "description",
      "status",
    ];

    // Get all documents
    const docsResult = await listDocuments(basePath, allowedDirectories);
    if (docsResult.isError) {
      return docsResult;
    }
    const documents = docsResult.metadata?.documents || [];

    // Get navigation if checking for orphans
    let navigation: NavigationSection[] = [];
    if (checkOrphans) {
      const navResult = await getNavigation(basePath, allowedDirectories);
      if (!navResult.isError && navResult.metadata?.navigation) {
        navigation = navResult.metadata.navigation;
      }
    }

    // Initialize health check result
    const healthResult: HealthCheckResult = {
      score: 0,
      totalDocuments: documents.length,
      issues: [],
      metadataCompleteness: 0,
      brokenLinks: 0,
      orphanedDocuments: 0,
      missingReferences: 0,
      documentsByStatus: {},
      documentsByTag: {},
    };

    // Track documents by status and tags
    documents.forEach((doc: DocumentEntry) => {
      // Track by status
      if (doc.metadata?.status) {
        const status = doc.metadata.status;
        healthResult.documentsByStatus![status] =
          (healthResult.documentsByStatus![status] || 0) + 1;
      }

      // Track by tags
      if (doc.metadata?.tags && Array.isArray(doc.metadata.tags)) {
        doc.metadata.tags.forEach((tag) => {
          healthResult.documentsByTag![tag] =
            (healthResult.documentsByTag![tag] || 0) + 1;
        });
      }
    });

    // Check metadata completeness
    if (checkMetadata) {
      let totalFields = 0;
      let missingFields = 0;

      for (const doc of documents) {
        const metadata = doc.metadata || {};

        for (const field of requiredMetadataFields) {
          totalFields++;

          if (!metadata[field]) {
            missingFields++;
            healthResult.issues.push({
              path: doc.path,
              type: "missing_metadata",
              severity: "error",
              message: `Missing required metadata field: ${field}`,
              details: { field },
            });
          }
        }
      }

      // Calculate metadata completeness percentage
      healthResult.metadataCompleteness =
        totalFields > 0
          ? Math.round(((totalFields - missingFields) / totalFields) * 100)
          : 100;
    }

    // Check for orphaned documents (not in navigation)
    if (checkOrphans) {
      // Collect all paths in navigation
      const pathsInNavigation = new Set<string>();

      function collectPaths(sections: NavigationSection[]) {
        for (const section of sections) {
          if (section.path) {
            pathsInNavigation.add(section.path);
          }

          for (const item of section.items) {
            if (item.path) {
              pathsInNavigation.add(item.path);
            }
          }
        }
      }

      collectPaths(navigation);

      // Check each document
      for (const doc of documents) {
        // Convert document path to navigation path format
        const docPath = `/${doc.path.replace(/\\/g, "/")}`;

        if (!pathsInNavigation.has(docPath)) {
          healthResult.orphanedDocuments++;
          healthResult.issues.push({
            path: doc.path,
            type: "orphaned",
            severity: "warning",
            message: "Document is not included in navigation",
          });
        }
      }
    }

    // Check for broken links
    if (checkLinks) {
      // Create a set of all valid document paths
      const validPaths = new Set<string>();
      for (const doc of documents) {
        validPaths.add(doc.path);
        // Also add without .md extension
        validPaths.add(doc.path.replace(/\.md$/, ""));
      }

      // Check each document for links
      for (const doc of documents) {
        try {
          const content = await fs.readFile(doc.path, "utf-8");

          // Find markdown links [text](link)
          const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
          let match;

          while ((match = linkRegex.exec(content)) !== null) {
            const link = match[2];

            // Only check internal links (not external URLs)
            if (!link.startsWith("http://") && !link.startsWith("https://")) {
              // Resolve the link relative to the document
              const docDir = path.dirname(doc.path);
              const resolvedPath = path.resolve(docDir, link);

              // Check if the link target exists
              if (
                !validPaths.has(resolvedPath) &&
                !validPaths.has(resolvedPath + ".md")
              ) {
                healthResult.brokenLinks++;
                healthResult.issues.push({
                  path: doc.path,
                  type: "broken_link",
                  severity: "error",
                  message: `Broken link: ${link}`,
                  details: { link, linkText: match[1] },
                });
              }
            }
          }
        } catch (error) {
          // Skip files that can't be read
          console.error(`Error reading file ${doc.path}:`, error);
        }
      }
    }

    // Calculate overall health score
    // The score is based on:
    // - Metadata completeness (40%)
    // - No broken links (30%)
    // - No orphaned documents (30%)
    const metadataScore = healthResult.metadataCompleteness * 0.4;
    const brokenLinksScore =
      healthResult.brokenLinks === 0
        ? 30
        : Math.max(
            0,
            30 - (healthResult.brokenLinks / healthResult.totalDocuments) * 100
          );
    const orphanedScore =
      healthResult.orphanedDocuments === 0
        ? 30
        : Math.max(
            0,
            30 -
              (healthResult.orphanedDocuments / healthResult.totalDocuments) *
                100
          );

    healthResult.score = Math.round(
      metadataScore + brokenLinksScore + orphanedScore
    );

    return {
      content: [
        {
          type: "text",
          text: `Documentation health check completed. Overall health score: ${healthResult.score}%`,
        },
      ],
      metadata: healthResult,
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error checking documentation health: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}
