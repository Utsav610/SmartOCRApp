import React, { useState } from 'react';
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
import { colors, typography, spacing, borderRadius } from '../theme';

export const GridInspectionScreen: React.FC = () => {
    const navigation = useNavigation();
    const { getActiveInspection, autoAdvance, setAutoAdvance, addRow } = useInspectionStore();
    const inspection = getActiveInspection();

    const [selectedCell, setSelectedCell] = useState<{ row: number; column: number } | null>(null);

    if (!inspection) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>No active inspection</Text>
            </SafeAreaView>
        );
    }

    const { gridConfig, matrixValues, name, metadata } = inspection;

    const handleCellPress = (row: number, column: number) => {
        setSelectedCell({ row, column });
        (navigation as any).navigate('Camera', { row, column });
    };

    const handleManualEntry = () => {
        if (selectedCell) {
            (navigation as any).navigate('ManualEntry', selectedCell);
        }
    };

    const renderGridCell = (row: number, column: number) => {
        const value = matrixValues[row][column];
        const cellId = getCellId(row, column);
        const isSelected = selectedCell?.row === row && selectedCell?.column === column;
        const hasValue = value !== null;

        return (
            <TouchableOpacity
                key={cellId}
                style={[
                    styles.gridCell,
                    isSelected && styles.gridCell_selected,
                    hasValue && styles.gridCell_filled,
                ]}
                onPress={() => handleCellPress(row, column)}
                activeOpacity={0.7}>
                {hasValue ? (
                    <View style={styles.cellContent}>
                        <Text style={styles.cellValue}>{value.toFixed(3)}</Text>
                        <View style={styles.cellIndicator} />
                    </View>
                ) : (
                    <Text style={styles.cellEmpty}>-</Text>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{name}</Text>
                    {metadata && (
                        <Text style={styles.headerSubtitle}>
                            {metadata.zone} • {metadata.location}
                        </Text>
                    )}
                </View>
                <View style={styles.connectedBadge}>
                    <View style={styles.connectedDot} />
                    <Text style={styles.connectedText}>CONNECTED</Text>
                </View>
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
                        <Text style={styles.matrixIcon}>⊞</Text>
                        <Text style={styles.matrixTitle}>DATA MATRIX</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.autoAdvanceToggle}
                        onPress={async () => await setAutoAdvance(!autoAdvance)}>
                        <View style={[styles.toggle, autoAdvance && styles.toggle_active]}>
                            <View style={[styles.toggleThumb, autoAdvance && styles.toggleThumb_active]} />
                        </View>
                        <Text style={styles.autoAdvanceText}>AUTO-ADVANCE</Text>
                    </TouchableOpacity>
                </View>

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

                        {/* Grid Rows */}
                        {matrixValues.map((row, rowIdx) => (
                            <View key={rowIdx} style={styles.gridRow}>
                                {/* Row Number */}
                                <View style={styles.gridRowHeader}>
                                    <Text style={styles.gridRowText}>{rowIdx + 1}</Text>
                                </View>
                                {/* Row Cells */}
                                {row.map((_, colIdx) => renderGridCell(rowIdx, colIdx))}
                            </View>
                        ))}

                        {/* Add Row Button */}
                        <TouchableOpacity
                            style={styles.addRowButton}
                            onPress={async () => await addRow(inspection.id)}>
                            <Text style={styles.addRowIcon}>+</Text>
                            <Text style={styles.addRowText}>ADD ROW</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>

            {/* Bottom Action Bar */}
            <View style={styles.actionBar}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleManualEntry}>
                    <Text style={styles.actionIcon}>⌨</Text>
                    <Text style={styles.actionLabel}>KEYPAD</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cameraButton}
                    onPress={() => selectedCell && handleCellPress(selectedCell.row, selectedCell.column)}>
                    <Text style={styles.cameraIcon}>📷</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={async () => await setAutoAdvance(!autoAdvance)}>
                    <Text style={styles.actionIcon}>🔄</Text>
                    <Text style={styles.actionLabel}>AUTO</Text>
                </TouchableOpacity>
            </View>
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
    backIcon: {
        fontSize: 24,
        color: colors.text,
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
    matrixIcon: {
        fontSize: 18,
        color: colors.textSecondary,
    },
    matrixTitle: {
        ...typography.label,
        color: colors.textSecondary,
    },
    autoAdvanceToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    toggle: {
        width: 40,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.surfaceLight,
        padding: 2,
    },
    toggle_active: {
        backgroundColor: colors.primary,
    },
    toggleThumb: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.text,
    },
    toggleThumb_active: {
        transform: [{ translateX: 18 }],
    },
    autoAdvanceText: {
        ...typography.captionSmall,
        color: colors.primary,
        fontWeight: '600',
    },
    gridScrollView: {
        flex: 1,
    },
    gridContainer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxxl,
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
    cellEmpty: {
        ...typography.h2,
        color: colors.textTertiary,
    },
    addRowButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        marginTop: spacing.md,
        gap: spacing.sm,
    },
    addRowIcon: {
        fontSize: 20,
        color: colors.primary,
    },
    addRowText: {
        ...typography.button,
        color: colors.primary,
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
    actionIcon: {
        fontSize: 24,
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
    cameraIcon: {
        fontSize: 32,
    },
});
