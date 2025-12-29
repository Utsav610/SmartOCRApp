import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../theme';

export const SplashScreen: React.FC = () => {
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const fadeAnim = new Animated.Value(0);
    const scaleAnim = new Animated.Value(0.9);

    useEffect(() => {
        // Start animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]).start();

        // Navigate to Home (InspectionList) after delay
        const timer = setTimeout(() => {
            navigation.reset({
                index: 0,
                routes: [{ name: 'InspectionList' as never }],
            });
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoIcon}>🔍</Text>
                </View>
                <Text style={styles.subtitle}>INDUSTRIAL</Text>
                <Text style={styles.title}>SmartOCRApp</Text>
                <View style={[styles.scannerLine, { width: width * 0.4 }]} />
            </Animated.View>
            <View style={styles.footer}>
                <Text style={styles.footerText}>SECURE SCANNING • REAL-TIME DATA</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    logoIcon: {
        fontSize: 48,
    },
    subtitle: {
        ...typography.label,
        color: colors.primary,
        letterSpacing: 4,
        marginBottom: spacing.xs,
    },
    title: {
        ...typography.h1,
        color: colors.text,
        fontSize: 40,
        fontWeight: '900',
    },
    scannerLine: {
        height: 2,
        backgroundColor: colors.primary,
        marginTop: spacing.md,
        borderRadius: 1,
        opacity: 0.5,
    },
    footer: {
        position: 'absolute',
        bottom: spacing.xxxl,
    },
    footerText: {
        ...typography.caption,
        color: colors.textTertiary,
        letterSpacing: 2,
    },
});
