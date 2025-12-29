import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useInspectionStore } from '../store/inspectionStore';
import { getCellId, getColumnLabel } from '../types/inspection';
import { Button } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

interface RouteParams {
    row: number;
    column: number;
    imagePath: string;
    ocrResult: {
        value: number;
        confidence: number;
        rawText: string;
    };
}

export const ReadingConfirmationScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { row, column, imagePath, ocrResult } = route.params as RouteParams;

    const { getActiveInspection, updateCellValue } = useInspectionStore();
    const inspection = getActiveInspection();

    const [value, setValue] = useState(ocrResult.value.toString());
    const [isEditing, setIsEditing] = useState(false);

    const cellId = getCellId(row, column);
    const columnLabel = getColumnLabel(column);
    const rowNumber = row + 1;

    const handleConfirm = () => {
        if (!inspection) return;

        const numericValue = parseFloat(value);
        if (isNaN(numericValue)) {
            return;
        }

        updateCellValue(inspection.id, row, column, numericValue, imagePath);

        // Haptic feedback
        ReactNativeHapticFeedback.trigger('impactMedium');

        navigation.navigate('GridInspection' as never);
    };

    const handleRetake = () => {
        navigation.goBack();
    };

    const handleDelete = () => {
        if (!inspection) return;
        updateCellValue(inspection.id, row, column, null);
        navigation.navigate('GridInspection' as never);
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
                    <Text style={styles.headerTitle}>Cell {columnLabel}-{rowNumber}</Text>
                    {inspection?.metadata && (
                        <Text style={styles.headerSubtitle}>
                            {inspection.metadata.zone} • {inspection.metadata.location}
                        </Text>
                    )}
                </View>
                <View style={styles.spacer} />
            </View>

            {/* Reference Tag */}
            {inspection?.metadata?.reference && (
                <View style={styles.referenceTag}>
                    <Text style={styles.referenceIcon}>📍</Text>
                    <Text style={styles.referenceText}>Ref: {inspection.metadata.reference}</Text>
                </View>
            )}

            {/* Image Preview */}
            <View style={styles.imageContainer}>
                <Image source={{ uri: `file://${imagePath}` }} style={styles.image} />
                <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={handleRetake}>
                    <Text style={styles.retakeIcon}>🔄</Text>
                    <Text style={styles.retakeText}>Retake</Text>
                </TouchableOpacity>
            </View>

            {/* Reading Input */}
            <View style={styles.readingSection}>
                <Text style={styles.readingLabel}>THICKNESS READING</Text>
                <View style={styles.inputContainer}>
                    <TouchableOpacity
                        onPress={() => setIsEditing(true)}
                        style={styles.editIcon}>
                        <Text>✏️</Text>
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        value={value}
                        onChangeText={setValue}
                        keyboardType="decimal-pad"
                        editable={isEditing}
                        onFocus={() => setIsEditing(true)}
                        onBlur={() => setIsEditing(false)}
                    />
                    <Text style={styles.unit}>mm</Text>
                </View>
            </View>

            {/* Manual Entry Link */}
            <TouchableOpacity
                style={styles.manualEntryLink}
                onPress={() => navigation.navigate('ManualEntry' as never, { row, column } as never)}>
                <Text style={styles.manualEntryText}>Switch to Manual Entry</Text>
            </TouchableOpacity>

            {/* Footer Buttons */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}>
                    <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
                <Button
                    title="✓ Confirm Reading"
                    onPress={handleConfirm}
                    size="large"
                    style={styles.confirmButton}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
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
    spacer: {
        width: 44,
    },
    referenceTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        borderRadius: borderRadius.sm,
        gap: spacing.sm,
    },
    referenceIcon: {
        fontSize: 14,
    },
    referenceText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    imageContainer: {
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 250,
        backgroundColor: colors.surface,
    },
    retakeButton: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.overlay,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        gap: spacing.xs,
    },
    retakeIcon: {
        fontSize: 16,
    },
    retakeText: {
        ...typography.caption,
        color: colors.text,
        fontWeight: '600',
    },
    readingSection: {
        marginHorizontal: spacing.lg,
        marginTop: spacing.xl,
    },
    readingLabel: {
        ...typography.label,
        color: colors.primary,
        marginBottom: spacing.md,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 2,
        borderColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    editIcon: {
        marginRight: spacing.md,
    },
    input: {
        flex: 1,
        ...typography.display,
        color: colors.text,
        textAlign: 'center',
    },
    unit: {
        ...typography.h2,
        color: colors.textSecondary,
        marginLeft: spacing.md,
    },
    manualEntryLink: {
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    manualEntryText: {
        ...typography.body,
        color: colors.textSecondary,
        textDecorationLine: 'underline',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: spacing.md,
    },
    deleteButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteIcon: {
        fontSize: 24,
    },
    confirmButton: {
        flex: 1,
    },
});
