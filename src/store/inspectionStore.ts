import { create } from 'zustand';
import { Inspection, GridConfig, createEmptyMatrix, getCellId } from '../types/inspection';
import { saveInspections, loadInspections } from '../utils/storage';

interface InspectionStore {
    inspections: Inspection[];
    activeInspectionId: string | null;
    autoAdvance: boolean;

    // Actions
    loadInspections: () => void;
    createInspection: (name: string, gridConfig: GridConfig, metadata?: Inspection['metadata']) => string;
    updateInspection: (id: string, updates: Partial<Inspection>) => void;
    deleteInspection: (id: string) => void;
    setActiveInspection: (id: string | null) => void;
    updateCellValue: (inspectionId: string, row: number, column: number, value: number | null, imagePath?: string) => void;
    addRow: (inspectionId: string) => void;
    setAutoAdvance: (enabled: boolean) => void;
    getInspection: (id: string) => Inspection | undefined;
    getActiveInspection: () => Inspection | undefined;
}

export const useInspectionStore = create<InspectionStore>((set, get) => ({
    inspections: [],
    activeInspectionId: null,
    autoAdvance: true,

    loadInspections: () => {
        const inspections = loadInspections();
        set({ inspections });
    },

    createInspection: (name: string, gridConfig: GridConfig, metadata?: Inspection['metadata']) => {
        const id = `inspection-${Date.now()}`;
        const newInspection: Inspection = {
            id,
            name,
            gridConfig,
            matrixValues: createEmptyMatrix(gridConfig.rows, gridConfig.columns),
            imageReferences: {},
            createdAt: Date.now(),
            modifiedAt: Date.now(),
            status: 'draft',
            metadata,
        };

        const inspections = [...get().inspections, newInspection];
        set({ inspections });
        saveInspections(inspections);

        return id;
    },

    updateInspection: (id: string, updates: Partial<Inspection>) => {
        const inspections = get().inspections.map(inspection =>
            inspection.id === id
                ? { ...inspection, ...updates, modifiedAt: Date.now() }
                : inspection
        );
        set({ inspections });
        saveInspections(inspections);
    },

    deleteInspection: (id: string) => {
        const inspections = get().inspections.filter(inspection => inspection.id !== id);
        set({ inspections });
        saveInspections(inspections);

        if (get().activeInspectionId === id) {
            set({ activeInspectionId: null });
        }
    },

    setActiveInspection: (id: string | null) => {
        set({ activeInspectionId: id });
    },

    updateCellValue: (inspectionId: string, row: number, column: number, value: number | null, imagePath?: string) => {
        const inspection = get().inspections.find(i => i.id === inspectionId);
        if (!inspection) return;

        const newMatrixValues = inspection.matrixValues.map((r, rIdx) =>
            rIdx === row
                ? r.map((c, cIdx) => (cIdx === column ? value : c))
                : r
        );

        const cellId = getCellId(row, column);
        const newImageReferences = { ...inspection.imageReferences };

        if (imagePath) {
            newImageReferences[cellId] = imagePath;
        } else if (value === null) {
            delete newImageReferences[cellId];
        }

        // Update status based on filled cells
        const totalCells = inspection.gridConfig.rows * inspection.gridConfig.columns;
        const filledCells = newMatrixValues.flat().filter(v => v !== null).length;
        const status = filledCells === 0 ? 'draft' : filledCells === totalCells ? 'completed' : 'in-progress';

        get().updateInspection(inspectionId, {
            matrixValues: newMatrixValues,
            imageReferences: newImageReferences,
            status,
        });
    },

    addRow: (inspectionId: string) => {
        const inspection = get().inspections.find(i => i.id === inspectionId);
        if (!inspection) return;

        const newRow = Array(inspection.gridConfig.columns).fill(null);
        const newMatrixValues = [...inspection.matrixValues, newRow];
        const newGridConfig = {
            ...inspection.gridConfig,
            rows: inspection.gridConfig.rows + 1,
        };

        get().updateInspection(inspectionId, {
            matrixValues: newMatrixValues,
            gridConfig: newGridConfig,
        });
    },

    setAutoAdvance: (enabled: boolean) => {
        set({ autoAdvance: enabled });
    },

    getInspection: (id: string) => {
        return get().inspections.find(i => i.id === id);
    },

    getActiveInspection: () => {
        const { activeInspectionId, inspections } = get();
        if (!activeInspectionId) return undefined;
        return inspections.find(i => i.id === activeInspectionId);
    },
}));
