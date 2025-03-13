export interface DocumentMetadata {
    title?: string;
    order?: number;
    description?: string;
    author?: string;
    date?: Date;
    tags?: string[];
    status?: string;
    [key: string]: any;
}
export interface DocumentEntry {
    path: string;
    name: string;
    metadata: DocumentMetadata;
}
export interface TreeEntry {
    name: string;
    path: string;
    type: string;
    metadata?: DocumentMetadata;
    children: TreeEntry[];
    error?: string;
}
export interface NavigationItem {
    title: string;
    path: string | null;
    order: number;
}
export interface NavigationSection {
    title: string;
    path: string | null;
    items: NavigationItem[];
    order: number;
}
export type ToolResponse = {
    content: Array<{
        type: string;
        text: string;
    }>;
    metadata?: Record<string, any>;
    isError?: boolean;
};
export * from "./docs.js";
export * from "./tools.js";
