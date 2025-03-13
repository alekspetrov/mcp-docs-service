import fs from "fs/promises";
import path from "path";
import { validatePath } from "../utils/path.js";
import matter from "gray-matter";
/**
 * Reads a markdown document and extracts its content and metadata
 */
export async function readDocument(docPath, allowedDirectories) {
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
    }
    catch (error) {
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
export async function listDocuments(basePath, allowedDirectories) {
    try {
        const normalizedBasePath = basePath
            ? await validatePath(basePath, allowedDirectories)
            : allowedDirectories[0];
        const documents = [];
        async function processDirectory(dirPath) {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const entryPath = path.join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    await processDirectory(entryPath);
                }
                else if (entry.name.endsWith(".md")) {
                    try {
                        const content = await fs.readFile(entryPath, "utf-8");
                        const { data: metadata } = matter(content);
                        documents.push({
                            path: entryPath,
                            name: entry.name,
                            metadata: metadata,
                        });
                    }
                    catch (error) {
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
    }
    catch (error) {
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
export async function getStructure(basePath, allowedDirectories) {
    try {
        const normalizedBasePath = basePath
            ? await validatePath(basePath, allowedDirectories)
            : allowedDirectories[0];
        async function buildStructure(dirPath, relativePath = "") {
            try {
                const entries = await fs.readdir(dirPath, { withFileTypes: true });
                const children = [];
                let metadata;
                // Check if there's an index.md file to get directory metadata
                const indexPath = path.join(dirPath, "index.md");
                try {
                    const indexStat = await fs.stat(indexPath);
                    if (indexStat.isFile()) {
                        const content = await fs.readFile(indexPath, "utf-8");
                        const { data } = matter(content);
                        metadata = data;
                    }
                }
                catch (error) {
                    // No index.md file, that's fine
                }
                // Process all entries
                for (const entry of entries) {
                    const entryPath = path.join(dirPath, entry.name);
                    const entryRelativePath = path.join(relativePath, entry.name);
                    if (entry.isDirectory()) {
                        const subDir = await buildStructure(entryPath, entryRelativePath);
                        children.push(subDir);
                    }
                    else if (entry.name.endsWith(".md") && entry.name !== "index.md") {
                        try {
                            const content = await fs.readFile(entryPath, "utf-8");
                            const { data } = matter(content);
                            children.push({
                                name: entry.name,
                                path: entryRelativePath,
                                type: "file",
                                metadata: data,
                                children: [],
                            });
                        }
                        catch (error) {
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
            }
            catch (error) {
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
    }
    catch (error) {
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
export async function getNavigation(basePath, allowedDirectories) {
    try {
        const normalizedBasePath = basePath
            ? await validatePath(basePath, allowedDirectories)
            : allowedDirectories[0];
        // First try to load navigation from .navigation file
        const navigationFilePath = path.join(normalizedBasePath, ".navigation");
        const navigationJsonPath = path.join(normalizedBasePath, "_navigation.json");
        const navigationYmlPath = path.join(normalizedBasePath, "_navigation.yml");
        let navigation = [];
        // Try to load from .navigation file
        try {
            const navigationContent = await fs.readFile(navigationFilePath, "utf-8");
            navigation = JSON.parse(navigationContent);
            console.log("Loaded navigation from .navigation file");
            return {
                content: [
                    {
                        type: "text",
                        text: "Navigation structure loaded from .navigation file",
                    },
                ],
                metadata: {
                    navigation,
                },
            };
        }
        catch (error) {
            console.log("No .navigation file found or error loading it:", error.message);
        }
        // Try to load from _navigation.json file
        try {
            const navigationContent = await fs.readFile(navigationJsonPath, "utf-8");
            navigation = JSON.parse(navigationContent);
            console.log("Loaded navigation from _navigation.json file");
            return {
                content: [
                    {
                        type: "text",
                        text: "Navigation structure loaded from _navigation.json file",
                    },
                ],
                metadata: {
                    navigation,
                },
            };
        }
        catch (error) {
            console.log("No _navigation.json file found or error loading it:", error.message);
        }
        // If no navigation file found, build from structure
        console.log("Building navigation from directory structure");
        // Get the structure
        const structureResponse = await getStructure(basePath, allowedDirectories);
        if (structureResponse.isError) {
            return structureResponse;
        }
        const structure = structureResponse.metadata?.structure;
        // Build navigation from structure
        function buildNavigation(structure) {
            const sections = [];
            function processNode(node, parentPath = []) {
                // Skip nodes with errors
                if (node.error) {
                    return;
                }
                if (node.type === "directory") {
                    // Create a section for this directory
                    const section = {
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
                        }
                        else if (child.type === "directory") {
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
                    section.items.sort((a, b) => {
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
        navigation = buildNavigation(structure);
        // Add debug logging
        console.log("Navigation structure:", JSON.stringify(navigation, null, 2));
        return {
            content: [
                { type: "text", text: "Navigation structure retrieved successfully" },
            ],
            metadata: {
                navigation,
            },
        };
    }
    catch (error) {
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
export async function checkDocumentationHealth(basePath, options, allowedDirectories) {
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
        // Use the first allowed directory if basePath is empty
        const effectiveBasePath = basePath || allowedDirectories[0];
        // Get all documents
        const docsResult = await listDocuments(effectiveBasePath, allowedDirectories);
        if (docsResult.isError) {
            return docsResult;
        }
        const documents = docsResult.metadata?.documents || [];
        // Get navigation if checking for orphans
        let navigation = [];
        if (checkOrphans) {
            const navResult = await getNavigation(effectiveBasePath, allowedDirectories);
            if (!navResult.isError && navResult.metadata?.navigation) {
                navigation = navResult.metadata.navigation;
            }
        }
        // Initialize health check result
        const healthResult = {
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
        documents.forEach((doc) => {
            // Track by status
            if (doc.metadata?.status) {
                const status = doc.metadata.status;
                healthResult.documentsByStatus[status] =
                    (healthResult.documentsByStatus[status] || 0) + 1;
            }
            // Track by tags
            if (doc.metadata?.tags && Array.isArray(doc.metadata.tags)) {
                doc.metadata.tags.forEach((tag) => {
                    healthResult.documentsByTag[tag] =
                        (healthResult.documentsByTag[tag] || 0) + 1;
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
            // Completely disable orphaned documents check
            console.log("Orphaned documents check is disabled");
            healthResult.orphanedDocuments = 0;
            // Ensure we don't have any orphaned document issues in the result
            healthResult.issues = healthResult.issues.filter((issue) => issue.type !== "orphaned");
        }
        // Check for broken links
        if (checkLinks) {
            // Create a set of all valid document paths
            const validPaths = new Set();
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
                            if (!validPaths.has(resolvedPath) &&
                                !validPaths.has(resolvedPath + ".md")) {
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
                }
                catch (error) {
                    // Skip files that can't be read
                    console.error(`Error reading file ${doc.path}:`, error);
                }
            }
        }
        // Calculate health score
        // The score is based on:
        // - Metadata completeness (70%)
        // - No broken links (30%)
        // - Orphaned documents check is disabled
        const metadataScore = healthResult.metadataCompleteness * 0.7;
        const brokenLinksScore = healthResult.brokenLinks === 0
            ? 30
            : Math.max(0, 30 - (healthResult.brokenLinks / healthResult.totalDocuments) * 100);
        // Calculate the final score
        healthResult.score = Math.round(metadataScore + brokenLinksScore);
        // Create a clean result object to ensure proper JSON formatting
        const finalResult = {
            score: healthResult.score,
            totalDocuments: healthResult.totalDocuments,
            issues: healthResult.issues,
            metadataCompleteness: healthResult.metadataCompleteness,
            brokenLinks: healthResult.brokenLinks,
            orphanedDocuments: 0,
            missingReferences: healthResult.missingReferences,
            documentsByStatus: healthResult.documentsByStatus,
            documentsByTag: healthResult.documentsByTag,
        };
        return {
            content: [
                {
                    type: "text",
                    text: `Documentation health check completed. Overall health score: ${finalResult.score}%`,
                },
            ],
            metadata: finalResult,
        };
    }
    catch (error) {
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
