/**
 * Health check handlers for the MCP Docs Service
 *
 * These handlers implement the documentation health check functionality.
 */

import fs from "fs/promises";
import path from "path";
import { glob } from "glob";
import { safeLog } from "../utils/logging.js";
import { ToolResponse } from "../types/tools.js";
import { parseFrontmatter } from "./documents.js";
import { NavigationHandler } from "./navigation.js";
import { HealthCheckResult, HealthIssue } from "../types/docs.js";

export class HealthCheckHandler {
  private docsDir: string;
  private navigationHandler: NavigationHandler;

  constructor(docsDir: string) {
    this.docsDir = docsDir;
    this.navigationHandler = new NavigationHandler(docsDir);
  }

  /**
   * Check documentation health
   */
  async checkDocumentationHealth(basePath = ""): Promise<ToolResponse> {
    try {
      const baseDir = path.join(this.docsDir, basePath);
      const pattern = path.join(baseDir, "**/*.md");

      const files = await glob(pattern);

      const results: HealthCheckResult = {
        score: 0,
        totalDocuments: files.length,
        issues: [],
        metadataCompleteness: 0,
        brokenLinks: 0,
        orphanedDocuments: 0,
        missingReferences: 0,
        documentsByStatus: {},
        documentsByTag: {},
      };

      // Check frontmatter and content
      let totalMetadataFields = 0;
      let presentMetadataFields = 0;

      for (const file of files) {
        const relativePath = path.relative(this.docsDir, file);
        const content = await fs.readFile(file, "utf-8");
        const { frontmatter } = parseFrontmatter(content);

        // Check for required metadata
        const requiredFields = ["title", "description"];
        totalMetadataFields += requiredFields.length;

        if (Object.keys(frontmatter).length === 0) {
          results.issues.push({
            path: relativePath,
            type: "missing_metadata",
            severity: "error",
            message: "Missing frontmatter",
          });
        }

        for (const field of requiredFields) {
          if (!frontmatter[field]) {
            results.issues.push({
              path: relativePath,
              type: "missing_metadata",
              severity: "warning",
              message: `Missing ${field} in frontmatter`,
            });
          } else {
            presentMetadataFields++;
          }
        }

        // Track documents by status
        if (frontmatter.status) {
          results.documentsByStatus[frontmatter.status] =
            (results.documentsByStatus[frontmatter.status] || 0) + 1;
        }

        // Track documents by tags
        if (frontmatter.tags && Array.isArray(frontmatter.tags)) {
          for (const tag of frontmatter.tags) {
            results.documentsByTag[tag] =
              (results.documentsByTag[tag] || 0) + 1;
          }
        }

        // Check for internal links
        const linkRegex = /\[.*?\]\((.*?)\)/g;
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
          const link = match[1];

          // Only check relative links to markdown files
          if (
            !link.startsWith("http") &&
            !link.startsWith("#") &&
            link.endsWith(".md")
          ) {
            const linkPath = path.join(path.dirname(file), link);

            try {
              await fs.access(linkPath);
            } catch {
              results.brokenLinks++;
              results.issues.push({
                path: relativePath,
                type: "broken_link",
                severity: "error",
                message: `Broken link to ${link}`,
              });
            }
          }
        }
      }

      // Calculate metadata completeness percentage
      results.metadataCompleteness =
        totalMetadataFields > 0
          ? Math.round((presentMetadataFields / totalMetadataFields) * 100)
          : 100;

      // Generate navigation to check for orphaned documents
      const navResponse = await this.navigationHandler.generateNavigation(
        basePath
      );

      if (!navResponse.isError && navResponse.content[0].text) {
        const navigation = JSON.parse(navResponse.content[0].text);

        function collectPaths(items: any[]): string[] {
          let paths: string[] = [];

          for (const item of items) {
            if (item.path) {
              paths.push(item.path);
            }

            if (item.children && item.children.length > 0) {
              paths = paths.concat(collectPaths(item.children));
            }
          }

          return paths;
        }

        const navigationPaths = collectPaths(navigation);

        for (const file of files) {
          const relativePath = path.relative(this.docsDir, file);

          if (!navigationPaths.includes(relativePath)) {
            results.orphanedDocuments++;
            results.issues.push({
              path: relativePath,
              type: "orphaned",
              severity: "warning",
              message: "Orphaned document (not in navigation)",
            });
          }
        }
      }

      // Calculate health score (0-100)
      const issueWeights = {
        missing_metadata: 1,
        broken_link: 2,
        orphaned: 1,
        missing_reference: 1,
      };

      let weightedIssueCount = 0;
      for (const issue of results.issues) {
        weightedIssueCount += issueWeights[issue.type] || 1;
      }

      const maxIssues = results.totalDocuments * 5; // 5 possible issues per document
      results.score = Math.max(
        0,
        100 - Math.round((weightedIssueCount / maxIssues) * 100)
      );

      // Format the response
      const formattedResponse = `Documentation Health Report:
Health Score: ${results.score}/100

Summary:
- Total Documents: ${results.totalDocuments}
- Metadata Completeness: ${results.metadataCompleteness}%
- Broken Links: ${results.brokenLinks}
- Orphaned Documents: ${results.orphanedDocuments}

Issues:
${results.issues
  .map((issue) => `- ${issue.path}: ${issue.message} (${issue.severity})`)
  .join("\n")}

Document Status:
${
  Object.entries(results.documentsByStatus)
    .map(([status, count]) => `- ${status}: ${count}`)
    .join("\n") || "- No status information available"
}

Document Tags:
${
  Object.entries(results.documentsByTag)
    .map(([tag, count]) => `- ${tag}: ${count}`)
    .join("\n") || "- No tag information available"
}
`;

      return {
        content: [{ type: "text", text: formattedResponse }],
        metadata: results,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error checking documentation health: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }
}
