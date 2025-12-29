import { MMKV } from 'react-native-mmkv';
import { Inspection } from '../types/inspection';

// Create MMKV instance safely
let storage: MMKV | null = null;
try {
    storage = new MMKV({
        id: 'smart-ocr-storage',
    });
} catch (error) {
    console.error('Failed to initialize MMKV:', error);
}

const INSPECTIONS_KEY = 'inspections';
const SETTINGS_KEY = 'settings';

export interface AppSettings {
    autoAdvance: boolean;
    defaultGridLayout: string;
}

// Inspection storage
export function saveInspections(inspections: Inspection[]): void {
    if (!storage) return;
    try {
        storage.set(INSPECTIONS_KEY, JSON.stringify(inspections));
    } catch (error) {
        console.error('Failed to save inspections:', error);
    }
}

export function loadInspections(): Inspection[] {
    if (!storage) return [];
    try {
        const data = storage.getString(INSPECTIONS_KEY);
        if (!data) return [];
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load inspections:', error);
        return [];
    }
}

export function clearInspections(): void {
    if (storage) storage.delete(INSPECTIONS_KEY);
}

// Settings storage
export function saveSettings(settings: AppSettings): void {
    if (!storage) return;
    try {
        storage.set(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

export function loadSettings(): AppSettings | null {
    if (!storage) return null;
    try {
        const data = storage.getString(SETTINGS_KEY);
        if (!data) return null;
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load settings:', error);
        return null;
    }
}

export function clearAllData(): void {
    if (storage) storage.clearAll();
}
