import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useInspectionStore } from '../store/inspectionStore';
import { Button, Card } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';
import { exportToCSV } from '../utils/csvExport';

interface ExportModalProps {
    visible: boolean;
    onClose: () => void;
    inspectionId: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
    visible,
    onClose,
    inspectionId,
}) => {
    const { getInspection } = useInspectionStore();
    const inspection = getInspection(inspectionId);
    const [isExporting, setIsExporting] = useState(false);

    if (!inspection) return null;

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportToCSV(inspection);
            Alert.alert('Success', 'Data exported successfully');
            onClose();
        } catch (error) {
            console.error('Export error:', error);
            Alert.alert('Error', 'Failed to export data');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Export Data</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.body}>
                        <Text style={styles.description}>
                            Select a format to export the latest readings from{' '}
                            <Text style={styles.projectName}>{inspection.name}</Text>.
                        </Text>

                        <TouchableOpacity activeOpacity={0.7}>
                            <Card style={styles.formatCard}>
                                <View style={styles.formatContent}>
                                    <View style={styles.formatIcon}>
                                        <Text style={styles.formatIconText}>📊</Text>
                                    </View>
                                    <View style={styles.formatInfo}>
                                        <Text style={styles.formatName}>CSV (Spreadsheet)</Text>
                                        <Text style={styles.formatDescription}>
                                            Best for Excel analysis
                                        </Text>
                                    </View>
                                </View>
                            </Card>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Button
                            title="📤 Export Now"
                            onPress={handleExport}
                            size="large"
                            style={styles.exportButton}
                            loading={isExporting}
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
        maxHeight: '60%',
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
    closeIcon: {
        fontSize: 24,
        color: colors.textSecondary,
    },
    body: {
        padding: spacing.lg,
    },
    description: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.xl,
        lineHeight: 22,
    },
    projectName: {
        color: colors.primary,
        fontWeight: '600',
    },
    formatCard: {
        borderWidth: 2,
        borderColor: colors.primary,
    },
    formatContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    formatIcon: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    formatIconText: {
        fontSize: 28,
    },
    formatInfo: {
        flex: 1,
    },
    formatName: {
        ...typography.h3,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    formatDescription: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    footer: {
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    exportButton: {
        width: '100%',
    },
});
