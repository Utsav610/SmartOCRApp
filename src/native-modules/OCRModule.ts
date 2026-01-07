import { NativeModules } from 'react-native';

const { OCRModule } = NativeModules;

export interface OCRResult {
    value: number;
    confidence: number;
    rawText: string;
}

export interface OCRModuleInterface {
    scanMeasurement(imagePath: string): Promise<OCRResult>;
    cropImage(imagePath: string, x: number, y: number, width: number, height: number): Promise<string>;
}

export default OCRModule as OCRModuleInterface;
