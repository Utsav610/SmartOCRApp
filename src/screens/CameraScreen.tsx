import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    Alert,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, PhotoFile, useCameraPermission } from 'react-native-vision-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { getColumnLabel } from '../types/inspection';
import RNFS from 'react-native-fs';
import OCRModule from '../native-modules/OCRModule';
import { ArrowLeft, Zap, ZapOff } from 'lucide-react-native';

export const CameraScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { row, column } = route.params as { row: number; column: number };

    const camera = useRef<Camera>(null);
    const device = useCameraDevice('back');

    const { hasPermission, requestPermission } = useCameraPermission();
    const [flashEnabled, setFlashEnabled] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);

    const { width } = useWindowDimensions();
    const camSize = width * 0.5;

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission, requestPermission]);

    const handleCapture = async () => {
        if (!camera.current || isCapturing) return;

        setIsCapturing(true);

        try {
            const photo = await camera.current.takePhoto({
                flash: flashEnabled ? 'on' : 'off',
                enableShutterSound: false,
            });

            // Navigate immediately to confirmation screen
            navigation.navigate('ReadingConfirmation' as never, {
                row,
                column,
                imagePath: photo.path,
            } as never);
        } catch (error) {
            console.error('Capture error:', error);
            Alert.alert('Error', 'Failed to capture image');
        } finally {
            setIsCapturing(false);
        }
    };

    if (!hasPermission) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.permissionText}>Camera permission required</Text>
            </SafeAreaView>
        );
    }

    if (!device) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.permissionText}>No camera device found</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerButton}>
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Scan {getColumnLabel(column)}-{row + 1}</Text>

                <TouchableOpacity
                    onPress={() => setFlashEnabled(!flashEnabled)}
                    style={styles.headerButton}>
                    {flashEnabled ? (
                        <Zap size={24} color={colors.primary} />
                    ) : (
                        <ZapOff size={24} color="white" />
                    )}
                </TouchableOpacity>
            </View>

            {/* Centered Camera View */}
            <View style={styles.cameraContainer}>
                <View style={[styles.cameraFrame, { width: camSize, height: camSize }]}>
                    <Camera
                        ref={camera}
                        style={StyleSheet.absoluteFill}
                        device={device}
                        isActive={true}
                        photo={true}
                        resizeMode="cover"
                    />
                    {/* Visual corners to indicate active area */}
                    <View style={[styles.corner, styles.cornerTopLeft]} />
                    <View style={[styles.corner, styles.cornerTopRight]} />
                    <View style={[styles.corner, styles.cornerBottomLeft]} />
                    <View style={[styles.corner, styles.cornerBottomRight]} />
                </View>
                <Text style={styles.instructionText}>Hold steady to capture</Text>
            </View>

            {/* Footer / Capture */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.captureButton}
                    onPress={handleCapture}
                    disabled={isCapturing}>
                    {isCapturing ? (
                        <ActivityIndicator size="large" color={colors.primary} />
                    ) : (
                        <View style={styles.captureButtonInner} />
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    permissionText: {
        ...typography.h3,
        color: 'white',
        textAlign: 'center',
        marginTop: spacing.xxxl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
        zIndex: 10,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        ...typography.h3,
        color: 'white',
    },
    cameraContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xl,
    },
    cameraFrame: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        position: 'relative',
    },
    instructionText: {
        ...typography.body,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },
    corner: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderColor: colors.primary,
        borderWidth: 3,
    },
    cornerTopLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderTopLeftRadius: borderRadius.lg, // Match container radius
    },
    cornerTopRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
        borderTopRightRadius: borderRadius.lg,
    },
    cornerBottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
        borderBottomLeftRadius: borderRadius.lg,
    },
    cornerBottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderBottomRightRadius: borderRadius.lg,
    },
    footer: {
        paddingVertical: spacing.xxxl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: colors.primary,
    },
    captureButtonInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primary,
    },
});
