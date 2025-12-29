import { Inspection, getColumnLabel } from '../types/inspection';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';

export async function exportToCSV(inspection: Inspection): Promise<void> {
    try {
        const csv = generateCSV(inspection);
        const fileName = `${inspection.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.csv`;
        const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

        // Write CSV file
        await RNFS.writeFile(filePath, csv, 'utf8');

        // Share file
        await Share.open({
            title: 'Export Inspection Data',
            message: `Inspection: ${inspection.name}`,
            url: `file://${filePath}`,
            type: 'text/csv',
            subject: `Inspection Data - ${inspection.name}`,
        });
    } catch (error) {
        console.error('Failed to export CSV:', error);
        throw error;
    }
}

export function generateCSV(inspection: Inspection): string {
    const { gridConfig, matrixValues } = inspection;

    // Generate column headers (A, B, C, ...)
    const columns = Array.from({ length: gridConfig.columns }, (_, i) => getColumnLabel(i));

    // Header row
    let csv = ',' + columns.join(',') + '\n';

    // Data rows
    matrixValues.forEach((row, rowIndex) => {
        const rowNumber = rowIndex + 1;
        const rowData = row.map(val => val !== null ? val.toString() : '').join(',');
        csv += `${rowNumber},${rowData}\n`;
    });

    return csv;
}

export function getCSVPreview(inspection: Inspection): string {
    const csv = generateCSV(inspection);
    const lines = csv.split('\n').slice(0, 6); // First 5 rows + header
    return lines.join('\n');
}
