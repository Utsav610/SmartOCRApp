import AsyncStorage from '@react-native-async-storage/async-storage';
import { Inspection } from '../types/inspection';

export interface AppSettings {
    autoAdvance: boolean;
    defaultGridLayout: string;
}

export async function storeData(key: string, detail: any) {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(detail));
    } catch (error) {
        console.error(`Failed to store data for key ${key}:`, error);
    }
}

export async function getData(key: string): Promise<string | null> {
    try {
        return await AsyncStorage.getItem(key);
    } catch (error) {
        console.error(`Failed to get data for key ${key}:`, error);
        return null;
    }
}

export async function removeData(key: string) {
    try {
        await AsyncStorage.removeItem(key);
    } catch (error) {
        console.error(`Failed to remove data for key ${key}:`, error);
    }
}

export async function removeAllData() {
    try {
        await AsyncStorage.clear();
    } catch (error) {
        console.error('Failed to clear all data:', error);
    }
}

// Typed helpers using the generic functions
export async function saveInspections(inspections: Inspection[]): Promise<void> {
    await storeData('inspections', inspections);
}

export async function loadInspections(): Promise<Inspection[]> {
    const data = await getData('inspections');
    if (!data) return [];
    try {
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to parse inspections:', error);
        return [];
    }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
    await storeData('settings', settings);
}

export async function loadSettings(): Promise<AppSettings | null> {
    const data = await getData('settings');
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to parse settings:', error);
        return null;
    }
}
