import { create } from 'zustand';
import { Inspection, GridConfig, createEmptyMatrix, getCellId } from '../types/inspection';
import { storeData, getData } from '../utils/storage';

interface InspectionStore {
    inspections: Inspection[];
    activeInspectionId: string | null;
    autoAdvance: boolean;

    // Actions
    loadInspections: () => Promise<void>;
    createInspection: (name: string, gridConfig: GridConfig, metadata?: Inspection['metadata']) => Promise<string>;
    updateInspection: (id: string, updates: Partial<Inspection>) => Promise<void>;
    deleteInspection: (id: string) => Promise<void>;
    setActiveInspection: (id: string | null) => void;
    updateCellValue: (inspectionId: string, row: number, column: number, value: number | null, imagePath?: string) => Promise<void>;
    addRow: (inspectionId: string) => Promise<void>;
    setAutoAdvance: (enabled: boolean) => Promise<void>;
    getInspection: (id: string) => Inspection | undefined;
    getActiveInspection: () => Inspection | undefined;
}

export const useInspectionStore = create<InspectionStore>((set, get) => ({
    inspections: [],
    activeInspectionId: null,
    autoAdvance: true,

    loadInspections: async () => {
        const data = await getData('inspections');
        const inspections = data ? JSON.parse(data) : [];
        set({ inspections });
    },

    createInspection: async (name: string, gridConfig: GridConfig, metadata?: Inspection['metadata']) => {
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
        await storeData('inspections', inspections);

        return id;
    },

    updateInspection: async (id: string, updates: Partial<Inspection>) => {
        const inspections = get().inspections.map(inspection =>
            inspection.id === id
                ? { ...inspection, ...updates, modifiedAt: Date.now() }
                : inspection
        );
        set({ inspections });
        await storeData('inspections', inspections);
    },

    deleteInspection: async (id: string) => {
        const inspections = get().inspections.filter(inspection => inspection.id !== id);
        set({ inspections });
        await storeData('inspections', inspections);

        if (get().activeInspectionId === id) {
            set({ activeInspectionId: null });
        }
    },

    setActiveInspection: (id: string | null) => {
        set({ activeInspectionId: id });
    },

    updateCellValue: async (inspectionId: string, row: number, column: number, value: number | null, imagePath?: string) => {
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

        await get().updateInspection(inspectionId, {
            matrixValues: newMatrixValues,
            imageReferences: newImageReferences,
            status,
        });
    },

    addRow: async (inspectionId: string) => {
        const inspection = get().inspections.find(i => i.id === inspectionId);
        if (!inspection) return;

        const newRow = Array(inspection.gridConfig.columns).fill(null);
        const newMatrixValues = [...inspection.matrixValues, newRow];
        const newGridConfig = {
            ...inspection.gridConfig,
            rows: inspection.gridConfig.rows + 1,
        };

        await get().updateInspection(inspectionId, {
            matrixValues: newMatrixValues,
            gridConfig: newGridConfig,
        });
    },

    setAutoAdvance: async (enabled: boolean) => {
        set({ autoAdvance: enabled });
        // Optional: Persist settings if storage supports it
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
