import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../theme';
import { useAuthStore } from '../store/authStore';

export const SplashScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { width } = useWindowDimensions();
    const { checkAuth } = useAuthStore();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        let initTimeout: NodeJS.Timeout;
        let splashTimeout: NodeJS.Timeout;
        let isMounted = true;

        // Start splash animation
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

        const init = async () => {
            try {
                const isAuthenticated = await checkAuth();

                if (!isMounted) return;

                splashTimeout = setTimeout(() => {
                    navigation.reset({
                        index: 0,
                        routes: [
                            {
                                name: isAuthenticated
                                    ? 'InspectionList'
                                    : 'Login',
                            },
                        ],
                    });
                }, 2000);
            } catch (error) {
                // fallback in case auth fails
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            }
        };

        initTimeout = setTimeout(init, 100);

        return () => {
            isMounted = false;
            clearTimeout(initTimeout);
            clearTimeout(splashTimeout);
        };
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
                ]}
            >
                <View style={styles.logoContainer}>
                    <Text style={styles.logoIcon}>🔍</Text>
                </View>

                <Text style={styles.subtitle}>INDUSTRIAL</Text>
                <Text style={styles.title}>SmartOCRApp</Text>

                <View
                    style={[
                        styles.scannerLine,
                        { width: width * 0.4 },
                    ]}
                />
            </Animated.View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    SECURE SCANNING • REAL-TIME DATA
                </Text>
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
