import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useInspectionStore } from '../store/inspectionStore';
import { Button } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';
import { X, Delete } from 'lucide-react-native';

interface RouteParams {
    row: number;
    column: number;
}

export const ManualEntryModal: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { row, column } = route.params as RouteParams;

    const { getActiveInspection, updateCellValue } = useInspectionStore();
    const inspection = getActiveInspection();

    const [value, setValue] = useState('');

    const handleNumberPress = (num: string) => {
        setValue(prev => prev + num);
    };

    const handleDecimal = () => {
        if (!value.includes('.')) {
            setValue(prev => prev + '.');
        }
    };

    const handleBackspace = () => {
        setValue(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        setValue('');
    };

    const handleConfirm = () => {
        if (!inspection || !value) return;

        const numericValue = parseFloat(value);
        if (isNaN(numericValue)) return;

        updateCellValue(inspection.id, row, column, numericValue);
        navigation.navigate('GridInspection' as never);
    };

    const renderKey = (label: string, onPress: () => void, style?: any) => (
        <TouchableOpacity
            style={[styles.key, style]}
            onPress={onPress}
            activeOpacity={0.7}>
            <Text style={[styles.keyText, style?.textStyle]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={true}
            animationType="slide"
            transparent
            onRequestClose={() => navigation.goBack()}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Manual Entry</Text>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.closeButton}>
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.display}>
                        <Text style={styles.displayText}>{value || '0'}</Text>
                        <Text style={styles.displayUnit}>mm</Text>
                    </View>

                    <View style={styles.keypad}>
                        <View style={styles.keyRow}>
                            {renderKey('7', () => handleNumberPress('7'))}
                            {renderKey('8', () => handleNumberPress('8'))}
                            {renderKey('9', () => handleNumberPress('9'))}
                        </View>
                        <View style={styles.keyRow}>
                            {renderKey('4', () => handleNumberPress('4'))}
                            {renderKey('5', () => handleNumberPress('5'))}
                            {renderKey('6', () => handleNumberPress('6'))}
                        </View>
                        <View style={styles.keyRow}>
                            {renderKey('1', () => handleNumberPress('1'))}
                            {renderKey('2', () => handleNumberPress('2'))}
                            {renderKey('3', () => handleNumberPress('3'))}
                        </View>
                        <View style={styles.keyRow}>
                            {renderKey('.', handleDecimal)}
                            {renderKey('0', () => handleNumberPress('0'))}
                            <TouchableOpacity
                                style={[styles.key, { backgroundColor: colors.surfaceLight }]}
                                onPress={handleBackspace}
                                activeOpacity={0.7}>
                                <Delete size={28} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Button
                            title="Clear"
                            onPress={handleClear}
                            variant="outline"
                            size="large"
                            style={styles.clearButton}
                        />
                        <Button
                            title="Confirm"
                            onPress={handleConfirm}
                            size="large"
                            style={styles.confirmButton}
                            disabled={!value}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: colors.overlay,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        paddingBottom: spacing.xxxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        ...typography.h2,
        color: colors.text,
    },
    closeButton: {
        padding: spacing.sm,
    },
    display: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        paddingVertical: spacing.xxxl,
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
    },
    displayText: {
        ...typography.display,
        color: colors.text,
        fontSize: 56,
    },
    displayUnit: {
        ...typography.h2,
        color: colors.textSecondary,
    },
    keypad: {
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
    },
    keyRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    key: {
        flex: 1,
        height: 64,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    keyText: {
        ...typography.h1,
        color: colors.text,
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        gap: spacing.md,
    },
    clearButton: {
        flex: 1,
    },
    confirmButton: {
        flex: 2,
    },
});
