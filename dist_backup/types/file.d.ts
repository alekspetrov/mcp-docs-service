/**
 * File information structure
 */
export interface FileInfo {
    size: number;
    created: Date;
    modified: Date;
    accessed: Date;
    isDirectory: boolean;
    isFile: boolean;
    permissions: string;
}
/**
 * Tree entry for directory structure
 */
export interface FileTreeEntry {
    name: string;
    path: string;
    type: "file" | "directory";
    children?: FileTreeEntry[];
}
