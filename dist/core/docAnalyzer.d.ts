/**
 * Document Analyzer for generating insights about documentation
 */
import { DocAnalysisResult } from "../types/index.js";
import { DocManager } from "./docManager.js";
export declare class DocAnalyzer {
    private docManager;
    constructor(docManager: DocManager);
    /**
     * Analyze the documentation and generate insights
     */
    analyzeDocumentation(directory?: string): Promise<DocAnalysisResult>;
    /**
     * Find documentation gaps (directories with few or no documents)
     */
    findDocumentationGaps(): Promise<Record<string, number>>;
    /**
     * Calculate overall documentation health score (0-100)
     */
    calculateHealthScore(): Promise<number>;
    /**
     * Generate suggestions for improving documentation
     */
    generateSuggestions(): Promise<string[]>;
}
