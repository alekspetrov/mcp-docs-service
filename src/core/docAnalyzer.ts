/**
 * Document Analyzer for generating insights about documentation
 */

import { DocAnalysisResult, DocSummary } from "../types/index.js";
import { DocManager } from "./docManager.js";

export class DocAnalyzer {
  private docManager: DocManager;

  constructor(docManager: DocManager) {
    this.docManager = docManager;
  }

  /**
   * Analyze the documentation and generate insights
   */
  async analyzeDocumentation(directory?: string): Promise<DocAnalysisResult> {
    const summaries = await this.docManager.getAllDocumentSummaries(directory);

    // Count documents by status
    const byStatus: Record<string, number> = {};
    summaries.forEach((doc) => {
      const status = doc.status || "undefined";
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    // Count documents by directory
    const byDirectory: Record<string, number> = {};
    summaries.forEach((doc) => {
      const dirPath = doc.path.split("/").slice(0, -1).join("/");
      byDirectory[dirPath] = (byDirectory[dirPath] || 0) + 1;
    });

    // Find documents missing descriptions
    const missingDescriptions = summaries.filter((doc) => !doc.description);

    // Find recently updated documents (if lastUpdated is available)
    let recentlyUpdated: DocSummary[] = [];
    const docsWithDates = summaries.filter((doc) => doc.lastUpdated);

    if (docsWithDates.length > 0) {
      recentlyUpdated = docsWithDates
        .sort((a, b) => {
          const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
          const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5); // Get the 5 most recently updated
    }

    return {
      documentCount: summaries.length,
      byStatus,
      byDirectory,
      recentlyUpdated,
      missingDescriptions,
    };
  }

  /**
   * Find documentation gaps (directories with few or no documents)
   */
  async findDocumentationGaps(): Promise<Record<string, number>> {
    const directories = await this.docManager.listDirectories();
    const gaps: Record<string, number> = {};

    for (const dir of directories) {
      const files = await this.docManager.listMarkdownFiles(dir);
      if (files.length < 2) {
        // Consider a directory with less than 2 docs as a gap
        gaps[dir] = files.length;
      }
    }

    return gaps;
  }

  /**
   * Calculate overall documentation health score (0-100)
   */
  async calculateHealthScore(): Promise<number> {
    const summaries = await this.docManager.getAllDocumentSummaries();

    if (summaries.length === 0) {
      return 0; // No documents
    }

    // Calculate metrics
    const withDescription = summaries.filter((doc) => doc.description).length;
    const withTags = summaries.filter(
      (doc) => doc.tags && doc.tags.length > 0
    ).length;
    const withStatus = summaries.filter((doc) => doc.status).length;

    // Calculate score components (each worth up to 33.3 points)
    const descriptionScore = (withDescription / summaries.length) * 33.3;
    const tagsScore = (withTags / summaries.length) * 33.3;
    const statusScore = (withStatus / summaries.length) * 33.3;

    // Calculate the overall score
    const healthScore = descriptionScore + tagsScore + statusScore;

    return Math.round(healthScore);
  }

  /**
   * Generate suggestions for improving documentation
   */
  async generateSuggestions(): Promise<string[]> {
    const analysis = await this.analyzeDocumentation();
    const gaps = await this.findDocumentationGaps();
    const healthScore = await this.calculateHealthScore();

    const suggestions: string[] = [];

    // Suggest adding descriptions to documents that lack them
    if (
      analysis.missingDescriptions &&
      analysis.missingDescriptions.length > 0
    ) {
      suggestions.push(
        `Add descriptions to ${analysis.missingDescriptions.length} documents that are missing them.`
      );
    }

    // Suggest creating documents in empty or sparse directories
    if (Object.keys(gaps).length > 0) {
      for (const [dir, count] of Object.entries(gaps)) {
        suggestions.push(
          `Add more documentation to the ${dir} directory (currently has ${count} documents).`
        );
      }
    }

    // General suggestions based on health score
    if (healthScore < 50) {
      suggestions.push(
        "Improve overall documentation quality by adding proper metadata to existing documents."
      );
    }

    // Suggestion for adding status to documents
    if (
      analysis.byStatus &&
      analysis.byStatus["undefined"] &&
      analysis.byStatus["undefined"] > 0
    ) {
      suggestions.push(
        `Add status (draft, review, or published) to ${analysis.byStatus["undefined"]} documents.`
      );
    }

    return suggestions;
  }
}
