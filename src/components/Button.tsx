import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { colors, typography, borderRadius, spacing } from '../theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    icon,
    style,
    textStyle,
}) => {
    const buttonStyles = [
        styles.button,
        styles[`button_${variant}`],
        styles[`button_${size}`],
        disabled && styles.button_disabled,
        style,
    ];

    const textStyles = [
        styles.text,
        styles[`text_${variant}`],
        styles[`text_${size}`],
        disabled && styles.text_disabled,
        textStyle,
    ];

    return (
        <TouchableOpacity
            style={buttonStyles}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}>
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? colors.text : colors.primary} />
            ) : (
                <>
                    {icon}
                    <Text style={textStyles}>{title}</Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },

    // Variants
    button_primary: {
        backgroundColor: colors.primary,
    },
    button_secondary: {
        backgroundColor: colors.surface,
    },
    button_outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.primary,
    },
    button_ghost: {
        backgroundColor: 'transparent',
    },

    // Sizes
    button_small: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        minHeight: 36,
    },
    button_medium: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        minHeight: 48,
    },
    button_large: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        minHeight: 56,
    },

    // Disabled
    button_disabled: {
        opacity: 0.5,
    },

    // Text styles
    text: {
        ...typography.button,
    },
    text_primary: {
        color: colors.text,
    },
    text_secondary: {
        color: colors.text,
    },
    text_outline: {
        color: colors.primary,
    },
    text_ghost: {
        color: colors.textSecondary,
    },
    text_small: {
        ...typography.buttonSmall,
    },
    text_medium: {
        ...typography.button,
    },
    text_large: {
        ...typography.button,
    },
    text_disabled: {
        opacity: 1,
    },
});
