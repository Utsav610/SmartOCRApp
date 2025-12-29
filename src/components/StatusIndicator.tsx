import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface StatusIndicatorProps {
    status: 'draft' | 'in-progress' | 'completed';
    size?: number;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
    status,
    size = 8,
}) => {
    const color = {
        draft: colors.inactive,
        'in-progress': colors.warning,
        completed: colors.success,
    }[status];

    return (
        <View
            style={[
                styles.indicator,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                },
            ]}
        />
    );
};

const styles = StyleSheet.create({
    indicator: {},
});
