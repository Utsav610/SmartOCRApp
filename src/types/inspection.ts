export type InspectionStatus = 'draft' | 'in-progress' | 'completed';

export interface GridConfig {
    rows: number;
    columns: number;
}

export interface CellValue {
    value: number | null;
    imagePath?: string;
    timestamp?: number;
}

export interface Inspection {
    id: string;
    name: string;
    gridConfig: GridConfig;
    matrixValues: (number | null)[][];
    imageReferences: Record<string, string>; // cellId (e.g., "A-1") -> imagePath
    createdAt: number;
    modifiedAt: number;
    status: InspectionStatus;
    metadata?: {
        zone?: string;
        location?: string;
        reference?: string;
    };
}

export interface GridLayoutOption {
    id: string;
    name: string;
    description: string;
    icon: string;
    gridConfig: GridConfig;
}

export const GRID_LAYOUTS: GridLayoutOption[] = [
    {
        id: '3x3',
        name: '3 Grid',
        description: '3x3 Inspection points',
        icon: 'grid-3x3',
        gridConfig: { rows: 3, columns: 3 },
    },
    {
        id: '4x4',
        name: '4 Grid',
        description: '4x4 Standard area',
        icon: 'grid-4x4',
        gridConfig: { rows: 4, columns: 4 },
    },
    {
        id: 'custom',
        name: 'Custom Grid',
        description: 'Define rows & columns',
        icon: 'grid-custom',
        gridConfig: { rows: 3, columns: 3 }, // Default for custom
    },
];

export interface CellPosition {
    row: number;
    column: number;
    cellId: string; // e.g., "A-1", "B-2"
}

export interface OCRScanResult {
    value: number;
    confidence: number;
    rawText: string;
    imagePath: string;
    cellPosition: CellPosition;
}

// Helper function to get column label (0 -> A, 1 -> B, etc.)
export function getColumnLabel(index: number): string {
    return String.fromCharCode(65 + index); // 65 is 'A' in ASCII
}

// Helper function to get cell ID
export function getCellId(row: number, column: number): string {
    return `${getColumnLabel(column)}-${row + 1}`;
}

// Helper function to create empty matrix
export function createEmptyMatrix(rows: number, columns: number): (number | null)[][] {
    return Array.from({ length: rows }, () => Array(columns).fill(null));
}
