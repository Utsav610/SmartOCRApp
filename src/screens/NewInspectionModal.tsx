import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useInspectionStore } from '../store/inspectionStore';
import { GRID_LAYOUTS, GridLayoutOption } from '../types/inspection';
import { Button, Card, Input } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';
import { X, Edit2, Check } from 'lucide-react-native';

interface NewInspectionModalProps {
    visible: boolean;
    onClose: () => void;
}

export const NewInspectionModal: React.FC<NewInspectionModalProps> = ({
    visible,
    onClose,
}) => {
    const navigation = useNavigation();
    const { createInspection, setActiveInspection } = useInspectionStore();

    const [fileName, setFileName] = useState(`Job-${Date.now()}`);
    const [selectedLayout, setSelectedLayout] = useState<string>('3x3');
    const [customRows, setCustomRows] = useState('3');
    const [customColumns, setCustomColumns] = useState('3');

    const handleCreate = async () => {
        const layout = GRID_LAYOUTS.find(l => l.id === selectedLayout);
        if (!layout) return;

        let gridConfig = layout.gridConfig;

        if (selectedLayout === 'custom') {
            gridConfig = {
                rows: parseInt(customRows) || 3,
                columns: parseInt(customColumns) || 3,
            };
        }

        const inspectionId = await createInspection(fileName, gridConfig);
        setActiveInspection(inspectionId);
        onClose();
        navigation.navigate('GridInspection' as never);
    };

    const renderGridIcon = (layout: GridLayoutOption) => {
        const isSelected = selectedLayout === layout.id;
        const { rows, columns } = layout.gridConfig;

        return (
            <View style={styles.gridIconContainer}>
                <View style={styles.gridIcon}>
                    {Array.from({ length: Math.min(rows, 4) }).map((_, rowIdx) => (
                        <View key={rowIdx} style={styles.gridRow}>
                            {Array.from({ length: Math.min(columns, 4) }).map((_, colIdx) => (
                                <View
                                    key={colIdx}
                                    style={[
                                        styles.gridCell,
                                        isSelected && styles.gridCell_selected,
                                    ]}
                                />
                            ))}
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>New Inspection</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        <Input
                            label="FILE NAME"
                            value={fileName}
                            onChangeText={setFileName}
                            placeholder="Enter file name"
                            rightIcon={<Edit2 size={16} color={colors.textSecondary} />}
                        />

                        <Text style={styles.sectionLabel}>SELECT GRID LAYOUT</Text>

                        {GRID_LAYOUTS.map(layout => (
                            <TouchableOpacity
                                key={layout.id}
                                onPress={() => setSelectedLayout(layout.id)}
                                activeOpacity={0.7}>
                                <Card
                                    style={[
                                        styles.layoutCard,
                                        selectedLayout === layout.id && styles.layoutCard_selected,
                                    ] as any}>
                                    <View style={styles.layoutContent}>
                                        {renderGridIcon(layout)}
                                        <View style={styles.layoutInfo}>
                                            <Text style={styles.layoutName}>{layout.name}</Text>
                                            <Text style={styles.layoutDescription}>
                                                {layout.description}
                                            </Text>
                                        </View>
                                        {selectedLayout === layout.id && (
                                            <Check size={24} color={colors.primary} />
                                        )}
                                    </View>
                                </Card>
                            </TouchableOpacity>
                        ))}

                        {selectedLayout === 'custom' && (
                            <View style={styles.customInputs}>
                                <Input
                                    label="ROWS"
                                    value={customRows}
                                    onChangeText={setCustomRows}
                                    keyboardType="number-pad"
                                    containerStyle={styles.customInput}
                                />
                                <Input
                                    label="COLUMNS"
                                    value={customColumns}
                                    onChangeText={setCustomColumns}
                                    keyboardType="number-pad"
                                    containerStyle={styles.customInput}
                                />
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <Button
                            title="Create & Start →"
                            onPress={handleCreate}
                            size="large"
                            style={styles.createButton}
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
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        ...typography.h2,
        color: colors.text,
    },
    closeButton: {
        padding: spacing.sm,
    },
    modalBody: {
        padding: spacing.lg,
    },
    sectionLabel: {
        ...typography.label,
        color: colors.textSecondary,
        marginBottom: spacing.md,
        marginTop: spacing.md,
    },
    layoutCard: {
        marginBottom: spacing.md,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    layoutCard_selected: {
        borderColor: colors.primary,
    },
    layoutContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    gridIconContainer: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    gridIcon: {
        gap: 2,
    },
    gridRow: {
        flexDirection: 'row',
        gap: 2,
    },
    gridCell: {
        width: 8,
        height: 8,
        backgroundColor: colors.background,
        borderRadius: 1,
    },
    gridCell_selected: {
        backgroundColor: colors.text,
    },
    layoutInfo: {
        flex: 1,
    },
    layoutName: {
        ...typography.h3,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    layoutDescription: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    customInputs: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    customInput: {
        flex: 1,
    },
    modalFooter: {
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    createButton: {
        width: '100%',
    },
});
