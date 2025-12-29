import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '../theme';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: keyof typeof spacing;
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    variant = 'default',
    padding = 'lg',
}) => {
    const cardStyles = [
        styles.card,
        styles[`card_${variant}`],
        { padding: spacing[padding] },
        style,
    ];

    return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
    card: {
        borderRadius: borderRadius.md,
    },
    card_default: {
        backgroundColor: colors.surface,
    },
    card_elevated: {
        backgroundColor: colors.surface,
        ...shadows.md,
    },
    card_outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
    },
});
