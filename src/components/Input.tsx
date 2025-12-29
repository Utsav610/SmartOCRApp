import React from 'react';
import {
    TextInput as RNTextInput,
    View,
    Text,
    StyleSheet,
    TextInputProps,
    ViewStyle,
} from 'react-native';
import { colors, typography, borderRadius, spacing } from '../theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    containerStyle,
    leftIcon,
    rightIcon,
    style,
    ...props
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.inputContainer, error && styles.inputContainer_error]}>
                {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
                <RNTextInput
                    style={[styles.input, style]}
                    placeholderTextColor={colors.textTertiary}
                    {...props}
                />
                {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.label,
        color: colors.primary,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1.5,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
    },
    inputContainer_error: {
        borderColor: colors.error,
    },
    input: {
        flex: 1,
        ...typography.body,
        color: colors.text,
        paddingVertical: spacing.md,
        minHeight: 48,
    },
    iconLeft: {
        marginRight: spacing.sm,
    },
    iconRight: {
        marginLeft: spacing.sm,
    },
    error: {
        ...typography.caption,
        color: colors.error,
        marginTop: spacing.xs,
    },
});
