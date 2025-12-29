import { NativeModules } from 'react-native';

const { OCRModule } = NativeModules;

export interface OCRResult {
    value: number;
    confidence: number;
    rawText: string;
}

export interface OCRModuleInterface {
    scanMeasurement(imagePath: string): Promise<OCRResult>;
}

export default OCRModule as OCRModuleInterface;
