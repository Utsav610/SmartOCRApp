import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useInspectionStore } from '../store/inspectionStore';
import { getColumnLabel, getCellId } from '../types/inspection';
import { Button, Card } from '../components';
import { ArrowLeft, Grid3X3, Plus, Minus, Keyboard, Camera, Share } from 'lucide-react-native';
import { ExportModal } from './ExportModal';
import { colors, typography, spacing, borderRadius } from '../theme';


interface GridCellProps {
    row: number;
    column: number;
    value: number | null;
    isSelected: boolean;
    onPress: (row: number, column: number) => void;
}

const GridCell = React.memo(({ row, column, value, isSelected, onPress }: GridCellProps) => {
    const hasValue = value !== null;
    return (
        <TouchableOpacity
            style={[
                styles.gridCell,
                isSelected && styles.gridCell_selected,
                hasValue && styles.gridCell_filled,
            ]}
            onPress={() => onPress(row, column)}
            activeOpacity={0.7}>
            {hasValue ? (
                <View style={styles.cellContent}>
                    <Text style={styles.cellValue}>{value?.toFixed(3)}</Text>
                    <View style={styles.cellIndicator} />
                </View>
            ) : (
                <Minus size={24} color={colors.textTertiary} />
            )}
        </TouchableOpacity>
    );
}, (prev, next) => {
    return prev.value === next.value && prev.isSelected === next.isSelected && prev.row === next.row && prev.column === next.column;
});

interface GridRowProps {
    row: (number | null)[];
    rowIdx: number;
    selectedCol: number | undefined;
    onPressCell: (row: number, column: number) => void;
}

const GridRow = React.memo(({ row, rowIdx, selectedCol, onPressCell }: GridRowProps) => {
    return (
        <View style={styles.gridRow}>
            <View style={styles.gridRowHeader}>
                <Text style={styles.gridRowText}>{rowIdx + 1}</Text>
            </View>
            {row.map((value, colIdx) => (
                <GridCell
                    key={colIdx}
                    row={rowIdx}
                    column={colIdx}
                    value={value}
                    isSelected={selectedCol === colIdx}
                    onPress={onPressCell}
                />
            ))}
        </View>
    );
}, (prev, next) => {
    return prev.row === next.row && prev.selectedCol === next.selectedCol;
});

export const GridInspectionScreen: React.FC = () => {
    const navigation = useNavigation();

    const inspection = useInspectionStore(state =>
        state.inspections.find(i => i.id === state.activeInspectionId)
    );

    console.log('inspection', inspection);


    const addRow = useInspectionStore(state => state.addRow);

    const [selectedCell, setSelectedCell] = useState<{ row: number; column: number } | null>(null);
    const [isExportModalVisible, setIsExportModalVisible] = useState(false);

    // Hooks must be called unconditionally
    const inspectionMatrixValues = inspection?.matrixValues;
    const inspectionImageReferences = inspection?.imageReferences;

    const matrixValuesRef = useRef(inspectionMatrixValues);
    const imageReferencesRef = useRef(inspectionImageReferences);

    useEffect(() => {
        matrixValuesRef.current = inspectionMatrixValues;
        imageReferencesRef.current = inspectionImageReferences;
    }, [inspectionMatrixValues, inspectionImageReferences]);

    const handleCellPress = useCallback((row: number, column: number) => {
        setSelectedCell({ row, column });

        const currentValues = matrixValuesRef.current;
        const currentImages = imageReferencesRef.current;

        if (!currentValues) return;

        const existingValue = currentValues[row][column];
        const cellId = getCellId(row, column);

        if (existingValue !== null) {
            // View existing reading
            (navigation as any).navigate('ReadingConfirmation', {
                row,
                column,
                imagePath: currentImages?.[cellId] || '',
                ocrResult: {
                    value: existingValue,
                    confidence: 1.0,
                    rawText: existingValue.toString(),
                },
            });
        } else {
            // New reading -> Camera
            (navigation as any).navigate('Camera', { row, column });
        }
    }, [navigation]);

    const handleManualEntry = () => {
        if (selectedCell) {
            (navigation as any).navigate('ManualEntry', selectedCell);
        }
    };

    if (!inspection) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>No active inspection</Text>
            </SafeAreaView>
        );
    }

    const { gridConfig, name, metadata, matrixValues } = inspection;



    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('InspectionList' as never)}
                    style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{name}</Text>
                    {metadata && (
                        <Text style={styles.headerSubtitle}>
                            {metadata.zone} • {metadata.location}
                        </Text>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.connectedBadge}
                    onPress={() => setIsExportModalVisible(true)}>
                    <Share size={16} color={colors.primary} />
                    <Text style={styles.connectedText}>Export</Text>
                </TouchableOpacity>
            </View>

            {/* Camera Preview Section (Placeholder) */}
            <View style={styles.cameraSection}>
                <View style={styles.cameraPlaceholder}>
                    <Text style={styles.cameraPlaceholderText}>
                        Tap a cell to start scanning
                    </Text>
                </View>
            </View>

            {/* Data Matrix Section */}
            <View style={styles.matrixSection}>
                <View style={styles.matrixHeader}>
                    <View style={styles.matrixHeaderLeft}>
                        <Grid3X3 size={20} color={colors.textSecondary} />
                        <Text style={styles.matrixTitle}>DATA MATRIX</Text>
                    </View>
                </View>

                <ScrollView
                    style={styles.verticalScrollView}
                    contentContainerStyle={styles.verticalScrollContent}
                >
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.gridScrollView}>
                        <View style={styles.gridContainer}>
                            {/* Column Headers */}
                            <View style={styles.gridHeaderRow}>
                                <View style={styles.gridCornerCell} />
                                {Array.from({ length: gridConfig.columns }).map((_, colIdx) => (
                                    <View key={colIdx} style={styles.gridHeaderCell}>
                                        <Text style={styles.gridHeaderText}>
                                            {getColumnLabel(colIdx)}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {matrixValues.map((row, rowIdx) => (
                                <GridRow
                                    key={rowIdx}
                                    row={row}
                                    rowIdx={rowIdx}
                                    selectedCol={selectedCell?.row === rowIdx ? selectedCell.column : undefined}
                                    onPressCell={handleCellPress}
                                />
                            ))}
                        </View>
                    </ScrollView>
                </ScrollView>

                <View style={styles.floatingButtonContainer}>
                    <TouchableOpacity
                        style={styles.floatingAddButton}
                        onPress={async () => await addRow(inspection.id)}>
                        <Plus size={24} color="white" />
                        <Text style={styles.floatingAddButtonText}>Add New Row</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom Action Bar */}
            <View style={styles.actionBar}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleManualEntry}>
                    <Keyboard size={24} color={colors.textSecondary} />
                    <Text style={styles.actionLabel}>KEYPAD</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cameraButton}
                    onPress={() => selectedCell && handleCellPress(selectedCell.row, selectedCell.column)}>
                    <Camera size={32} color="white" />
                </TouchableOpacity>

            </View>

            <ExportModal
                visible={isExportModalVisible}
                onClose={() => setIsExportModalVisible(false)}
                inspectionId={inspection.id}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    errorText: {
        ...typography.h3,
        color: colors.error,
        textAlign: 'center',
        marginTop: spacing.xxxl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: spacing.sm,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        ...typography.h3,
        color: colors.text,
    },
    headerSubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    connectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceLight,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        gap: spacing.xs,
    },
    connectedDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.success,
    },
    connectedText: {
        ...typography.captionSmall,
        color: colors.primary,
        fontWeight: '600',
    },
    cameraSection: {
        height: 200,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    cameraPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraPlaceholderText: {
        ...typography.body,
        color: colors.textSecondary,
    },
    matrixSection: {
        flex: 1,
        backgroundColor: colors.background,
    },
    matrixHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    matrixHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    matrixTitle: {
        ...typography.label,
        color: colors.textSecondary,
    },
    verticalScrollView: {
        flex: 1,
    },
    verticalScrollContent: {
        paddingBottom: 80, // Space for floating button
    },
    gridScrollView: {
        flexGrow: 0,
    },
    gridContainer: {
        paddingHorizontal: spacing.lg,
    },
    gridHeaderRow: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
    },
    gridCornerCell: {
        width: 40,
        height: 40,
    },
    gridHeaderCell: {
        width: 80,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.sm,
    },
    gridHeaderText: {
        ...typography.h3,
        color: colors.textSecondary,
    },
    gridRow: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
    },
    gridRowHeader: {
        width: 40,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridRowText: {
        ...typography.h3,
        color: colors.textSecondary,
    },
    gridCell: {
        width: 80,
        height: 80,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.sm,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    gridCell_selected: {
        borderColor: colors.primary,
    },
    gridCell_filled: {
        backgroundColor: colors.surfaceLight,
    },
    cellContent: {
        alignItems: 'center',
    },
    cellValue: {
        ...typography.h3,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    cellIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.success,
    },
    floatingButtonContainer: {
        position: 'absolute',
        bottom: spacing.md,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
    },
    floatingAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: 30,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        gap: spacing.sm,
    },
    floatingAddButtonText: {
        ...typography.button,
        color: 'white',
        fontWeight: '600',
    },
    actionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    actionButton: {
        alignItems: 'center',
        gap: spacing.xs,
        padding: spacing.sm,
    },
    actionLabel: {
        ...typography.captionSmall,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    cameraButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
