import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RectButton } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useInspectionStore } from '../store/inspectionStore';
import { Inspection } from '../types/inspection';
import { Button, Card, Input, StatusIndicator } from '../components';
import { colors, typography, spacing, borderRadius } from '../theme';
import Swipeable from 'react-native-gesture-handler/Swipeable';

export const InspectionListScreen: React.FC = () => {
    const navigation = useNavigation();
    const { inspections, loadInspections, setActiveInspection, deleteInspection } = useInspectionStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewModal, setShowNewModal] = useState(false);

    useEffect(() => {
        loadInspections();
    }, []);

    const filteredInspections = inspections.filter(inspection =>
        inspection.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
            return `Modified: Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffHours < 24) {
            return `Modified: Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays === 1) {
            return `Modified: Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return `Modified: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        }
    };

    const handleInspectionPress = (inspection: Inspection) => {
        setActiveInspection(inspection.id);
        navigation.navigate('GridInspection' as never);
    };

    const renderRightActions = (id: string) => {
        return (
            <RectButton
                style={styles.deleteAction}
                onPress={() => handleDeletePress(id)}>
                <Animated.Text style={styles.deleteActionText}>Delete</Animated.Text>
            </RectButton>
        );
    };

    const handleDeletePress = (id: string) => {
        Alert.alert(
            'Delete Inspection',
            'Are you sure you want to delete this inspection? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteInspection(id);
                    },
                },
            ]
        );
    };

    const renderInspectionCard = ({ item }: { item: Inspection }) => (
        <Swipeable
            renderRightActions={() => renderRightActions(item.id)}
            friction={2}
            rightThreshold={40}>
            <TouchableOpacity
                onPress={() => handleInspectionPress(item)}
                activeOpacity={0.7}>
                <Card style={styles.inspectionCard}>
                    <View style={styles.cardContent}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.icon}>📄</Text>
                        </View>
                        <View style={styles.cardInfo}>
                            <Text style={styles.inspectionName}>{item.name}</Text>
                            <Text style={styles.inspectionDate}>{formatDate(item.modifiedAt)}</Text>
                        </View>
                        <View style={styles.cardRight}>
                            <StatusIndicator status={item.status} size={10} />
                            <Text style={styles.chevron}>›</Text>
                        </View>
                    </View>
                </Card>
            </TouchableOpacity>
        </Swipeable>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerSubtitle}>DASHBOARD</Text>
                    <Text style={styles.headerTitle}>Local Files</Text>
                </View>
                <TouchableOpacity style={styles.settingsButton}>
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Input
                    placeholder="Search Job ID..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    leftIcon={<Text style={styles.searchIcon}>🔍</Text>}
                    containerStyle={styles.searchInput}
                />
            </View>

            <FlatList
                data={filteredInspections}
                renderItem={renderInspectionCard}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No inspections found</Text>
                        <Text style={styles.emptySubtext}>
                            Create a new inspection to get started
                        </Text>
                    </View>
                }
            />

            <View style={styles.footer}>
                <Button
                    title="+ New Inspection"
                    onPress={() => setShowNewModal(true)}
                    size="large"
                    style={styles.newButton}
                />
            </View>

            {showNewModal && (
                <NewInspectionModal
                    visible={showNewModal}
                    onClose={() => setShowNewModal(false)}
                />
            )}
        </SafeAreaView>
    );
};

// Import NewInspectionModal (will be created next)
import { NewInspectionModal } from './NewInspectionModal';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    headerSubtitle: {
        ...typography.label,
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    headerTitle: {
        ...typography.h1,
        color: colors.text,
    },
    settingsButton: {
        padding: spacing.sm,
    },
    settingsIcon: {
        fontSize: 24,
    },
    searchContainer: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    searchInput: {
        marginBottom: 0,
    },
    searchIcon: {
        fontSize: 18,
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxxl,
    },
    inspectionCard: {
        marginBottom: spacing.md,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    icon: {
        fontSize: 24,
    },
    cardInfo: {
        flex: 1,
    },
    inspectionName: {
        ...typography.h3,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    inspectionDate: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    cardRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    chevron: {
        fontSize: 24,
        color: colors.textSecondary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxxl * 2,
    },
    emptyText: {
        ...typography.h3,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    emptySubtext: {
        ...typography.body,
        color: colors.textTertiary,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.lg,
        backgroundColor: colors.background,
    },
    newButton: {
        width: '100%',
    },
    deleteAction: {
        backgroundColor: colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '81%', // Match card height minus margin
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    deleteActionText: {
        color: 'white',
        fontWeight: '600',
        padding: 20,
    },
});
