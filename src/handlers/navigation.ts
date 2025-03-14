/**
 * Navigation handlers for the MCP Docs Service
 *
 * These handlers implement the navigation structure generation.
 */

import fs from "fs/promises";
import path from "path";
import { glob } from "glob";
import { safeLog } from "../utils/logging.js";
import { ToolResponse } from "../types/tools.js";
import { parseFrontmatter } from "./documents.js";

export class NavigationHandler {
  private docsDir: string;

  constructor(docsDir: string) {
    this.docsDir = docsDir;
  }

  /**
   * Generate navigation structure from documents
   */
  async generateNavigation(basePath = ""): Promise<ToolResponse> {
    try {
      const baseDir = path.join(this.docsDir, basePath);
      const pattern = path.join(baseDir, "**/*.md");

      const files = await glob(pattern);

      // Sort files to ensure consistent order and process index.md files first
      files.sort((a, b) => {
        const aIsIndex = path.basename(a) === "index.md";
        const bIsIndex = path.basename(b) === "index.md";

        if (aIsIndex && !bIsIndex) return -1;
        if (!aIsIndex && bIsIndex) return 1;

        return a.localeCompare(b);
      });

      const navigation: any[] = [];
      const directoryMap: Record<string, any> = {};

      for (const file of files) {
        const relativePath = path.relative(this.docsDir, file);
        const content = await fs.readFile(file, "utf-8");
        const { frontmatter } = parseFrontmatter(content);

        const title = frontmatter.title || path.basename(file, ".md");
        const order =
          frontmatter.order !== undefined ? Number(frontmatter.order) : 999;

        const item = {
          title,
          path: relativePath,
          order,
          children: [],
        };

        const dirPath = path.dirname(relativePath);

        if (dirPath === "." || dirPath === basePath) {
          navigation.push(item);
        } else {
          // Create parent directories if they don't exist in the navigation
          const pathParts = dirPath.split(path.sep);
          let currentPath = "";
          let currentNavigation = navigation;

          for (const part of pathParts) {
            currentPath = currentPath ? path.join(currentPath, part) : part;

            if (!directoryMap[currentPath]) {
              const dirItem = {
                title: part,
                path: currentPath,
                order: 0,
                children: [],
              };

              directoryMap[currentPath] = dirItem;
              currentNavigation.push(dirItem);
            }

            currentNavigation = directoryMap[currentPath].children;
          }

          currentNavigation.push(item);
        }
      }

      // Sort navigation items by order
      function sortNavigation(items: any[]) {
        items.sort((a, b) => a.order - b.order);

        for (const item of items) {
          if (item.children && item.children.length > 0) {
            sortNavigation(item.children);
          }
        }
      }

      sortNavigation(navigation);

      return {
        content: [{ type: "text", text: JSON.stringify(navigation, null, 2) }],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error generating navigation: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Save navigation structure to a file
   */
  async saveNavigation(
    basePath = "",
    outputPath = "navigation.json"
  ): Promise<ToolResponse> {
    try {
      const result = await this.generateNavigation(basePath);

      if (result.isError) {
        return result;
      }

      const navigation = JSON.parse(result.content[0].text);
      const outputFilePath = path.join(this.docsDir, outputPath);

      await fs.writeFile(
        outputFilePath,
        JSON.stringify(navigation, null, 2),
        "utf-8"
      );

      return {
        content: [
          { type: "text", text: `Navigation structure saved to ${outputPath}` },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          { type: "text", text: `Error saving navigation: ${errorMessage}` },
        ],
        isError: true,
      };
    }
  }
}
