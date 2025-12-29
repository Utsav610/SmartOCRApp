import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, PhotoFile } from 'react-native-vision-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../theme';
import RNFS from 'react-native-fs';
import OCRModule from '../native-modules/OCRModule';

export const CameraScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { row, column } = route.params as { row: number; column: number };

    const camera = useRef<Camera>(null);
    const device = useCameraDevice('back');

    const [hasPermission, setHasPermission] = useState(false);
    const [flashEnabled, setFlashEnabled] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);

    useEffect(() => {
        (async () => {
            const status = await Camera.requestCameraPermission();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleCapture = async () => {
        if (!camera.current || isCapturing) return;

        setIsCapturing(true);

        try {
            const photo = await camera.current.takePhoto({
                flash: flashEnabled ? 'on' : 'off',
                qualityPrioritization: 'balanced',
            });

            // Process with OCR
            const result = await OCRModule.scanMeasurement(photo.path);

            // Navigate to confirmation screen
            navigation.navigate('ReadingConfirmation' as never, {
                row,
                column,
                imagePath: photo.path,
                ocrResult: result,
            } as never);
        } catch (error) {
            console.error('Capture error:', error);
            Alert.alert('Error', 'Failed to capture or process image');
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
        <View style={styles.container}>
            <Camera
                ref={camera}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
                photo={true}
            />

            {/* Overlay */}
            <SafeAreaView style={styles.overlay}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.spacer} />
                    <TouchableOpacity
                        onPress={() => setFlashEnabled(!flashEnabled)}
                        style={styles.flashButton}>
                        <Text style={styles.flashIcon}>{flashEnabled ? '⚡' : '🔦'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Scan Frame */}
                <View style={styles.scanFrame}>
                    <View style={[styles.corner, styles.cornerTopLeft]} />
                    <View style={[styles.corner, styles.cornerTopRight]} />
                    <View style={[styles.corner, styles.cornerBottomLeft]} />
                    <View style={[styles.corner, styles.cornerBottomRight]} />
                </View>

                {/* Instruction */}
                <View style={styles.instructionContainer}>
                    <Text style={styles.instructionText}>Hold steady to capture</Text>
                </View>

                {/* Capture Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.captureButton}
                        onPress={handleCapture}
                        disabled={isCapturing}>
                        <View style={styles.captureButtonInner} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    permissionText: {
        ...typography.h3,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xxxl,
    },
    overlay: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.overlay,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: colors.text,
    },
    spacer: {
        flex: 1,
    },
    flashButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.overlay,
        alignItems: 'center',
        justifyContent: 'center',
    },
    flashIcon: {
        fontSize: 24,
    },
    scanFrame: {
        position: 'absolute',
        top: '30%',
        left: '10%',
        right: '10%',
        height: 200,
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: colors.primary,
        borderWidth: 3,
    },
    cornerTopLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderTopLeftRadius: borderRadius.md,
    },
    cornerTopRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
        borderTopRightRadius: borderRadius.md,
    },
    cornerBottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
        borderBottomLeftRadius: borderRadius.md,
    },
    cornerBottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderBottomRightRadius: borderRadius.md,
    },
    instructionContainer: {
        position: 'absolute',
        bottom: 150,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    instructionText: {
        ...typography.body,
        color: colors.text,
        backgroundColor: colors.overlay,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    footer: {
        position: 'absolute',
        bottom: spacing.xxxl,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.text,
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
