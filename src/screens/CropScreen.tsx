import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Image,
    TouchableOpacity,
    Text,
    ActivityIndicator,
    Dimensions,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useInspectionStore } from '../store/inspectionStore';
import { colors, typography, spacing, borderRadius } from '../theme';
import { ArrowLeft, Check, RotateCcw, Image as ImageIcon } from 'lucide-react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import OCRModule from '../native-modules/OCRModule';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ScreenParams {
    row: number;
    column: number;
    imagePath: string;
    width: number;
    height: number;
}

export const CropScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params as ScreenParams;
    const { imagePath, row, column, width, height } = params;

    // const lastCropRegion = useInspectionStore(state => state.lastCropRegion); // Removed subscription
    const setLastCropRegion = useInspectionStore(state => state.setLastCropRegion);

    const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>({ width, height });
    const [viewSize, setViewSize] = useState<{ width: number; height: number } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Crop Region State (Normalized 0-1)
    const cropX = useSharedValue(0);
    const cropY = useSharedValue(0);
    const cropWidth = useSharedValue(1);
    const cropHeight = useSharedValue(1);

    const isInitialized = useRef(false);

    // Initialize Crop Region from Store
    useEffect(() => {
        if (!imageSize || !viewSize || isInitialized.current) return;

        // Read directly from store to avoid re-renders
        const lastCropRegion = useInspectionStore.getState().lastCropRegion;
        let region = lastCropRegion;

        // Handle potential double-serialization from previous bug
        if (typeof region === 'string') {
            try {
                region = JSON.parse(region);
            } catch (e) {
                // console.warn('Failed to parse lastCropRegion', e);
            }
        }

        if (!region) {
            // No saved region -> default to full
            resetToFull();
            isInitialized.current = true;
            return;
        }

        // Support both normalized (preferred) and legacy pixel-based regions
        let nX: number, nY: number, nW: number, nH: number;
        // @ts-ignore - Handle legacy/stringified types dynamically
        if (region.normalized) {
            nX = region.x;
            nY = region.y;
            nW = region.width;
            nH = region.height;
        } else {
            // Legacy: pixels -> normalize using current image size
            nX = region.x / imageSize.width;
            nY = region.y / imageSize.height;
            nW = region.width / imageSize.width;
            nH = region.height / imageSize.height;
        }

        if (nW > 0 && nH > 0) {
            // Clamp to valid range
            cropX.value = Math.max(0, Math.min(1, nX));
            cropY.value = Math.max(0, Math.min(1, nY));
            cropWidth.value = Math.max(0.1, Math.min(1, nW));
            cropHeight.value = Math.max(0.1, Math.min(1, nH));

            // Ensure it stays within bounds
            if (cropX.value + cropWidth.value > 1) cropWidth.value = 1 - cropX.value;
            if (cropY.value + cropHeight.value > 1) cropHeight.value = 1 - cropY.value;
        } else {
            resetToFull();
        }

        isInitialized.current = true;

    }, [imageSize, viewSize]);

    const resetToFull = () => {
        cropX.value = 0;
        cropY.value = 0;
        cropWidth.value = 1;
        cropHeight.value = 1;
    };

    const handleApply = async () => {
        console.log('press');
        console.log('imagesize', viewSize, imageSize, isProcessing);


        if (!imageSize || !viewSize || isProcessing) return;
        setIsProcessing(true);

        try {
            // 1. Get the actual rendered image frame inside the view
            const frame = getRenderedImageFrame();
            if (!frame) throw new Error("Could not calculate image frame");

            // 2. Map CropBox (0-1 of View) to Pixels relative to Image Content
            // cropX.value is 0..1 of View Width
            // viewPixelX = cropX.value * viewSize.width
            // imagePixelX = (viewPixelX - frame.x) * (imageSize.width / frame.width)

            const viewX = cropX.value * viewSize.width;
            const viewY = cropY.value * viewSize.height;
            const viewW = cropWidth.value * viewSize.width;
            const viewH = cropHeight.value * viewSize.height;

            // Intersect view rect with frame rect to avoid cropping black bars
            // (Though strictly speaking we should just map blindly and clamp)

            const scaleX = imageSize.width / frame.width;
            const scaleY = imageSize.height / frame.height;

            let finalX = (viewX - frame.x) * scaleX;
            let finalY = (viewY - frame.y) * scaleY;
            let finalW = viewW * scaleX;
            let finalH = viewH * scaleY;

            // Clamp
            finalX = Math.max(0, finalX);
            finalY = Math.max(0, finalY);
            if (finalX + finalW > imageSize.width) finalW = imageSize.width - finalX;
            if (finalY + finalH > imageSize.height) finalH = imageSize.height - finalY;

            const x = Math.floor(finalX);
            const y = Math.floor(finalY);
            const w = Math.floor(finalW);
            const h = Math.floor(finalH);

            if (w <= 0 || h <= 0) {
                Alert.alert("Invalid Crop", "Selected area is empty.");
                return;
            }

            // Persist as normalized region tied to this imagePath
            const saveRegion = {
                x: x / imageSize.width,
                y: y / imageSize.height,
                width: w / imageSize.width,
                height: h / imageSize.height,
                normalized: true,
            };
            await setLastCropRegion(saveRegion);


            // Crop Native
            const croppedPath = await OCRModule.cropImage(imagePath, x, y, w, h);
            console.log('croppedPath', croppedPath);

            // Navigate
            navigation.navigate('ReadingConfirmation' as never, {
                row,
                column,
                imagePath: croppedPath, // Pass the cropped image
            } as never);

        } catch (error) {
            console.error("Crop error:", error);
            Alert.alert("Error", "Failed to crop image. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const getRenderedImageFrame = () => {
        if (!imageSize || !viewSize) return null;

        const { width: iw, height: ih } = imageSize;
        const { width: vw, height: vh } = viewSize;

        const imageRatio = iw / ih;
        const viewRatio = vw / vh;

        let rw = vw;
        let rh = vh;

        if (imageRatio > viewRatio) {
            // Image is wider than view (fit to width)
            rh = vw / imageRatio;
        } else {
            // Image is taller than view (fit to height)
            rw = vh * imageRatio;
        }

        const tx = (vw - rw) / 2;
        const ty = (vh - rh) / 2;

        return { x: tx, y: ty, width: rw, height: rh };
    };

    const panGesture = Gesture.Pan()
        .onChange((e) => {
            // Simple logic: Move top-left, resize bottom-right? 
            // For a full crop rect, we need corner handles. 
            // For MVP simplicty: One gesture to move, pinch to resize? Or just a box you can drag and resize corners.

            // Let's implement a simple "Center Drag" and "Corner Drag" logic is complex for one file without components.
            // Simpler: Pan moves the box. Pinch scales it.

            const newX = cropX.value + (e.changeX / (viewSize?.width || 1));
            const newY = cropY.value + (e.changeY / (viewSize?.height || 1));

            // Clamp
            cropX.value = Math.max(0, Math.min(1 - cropWidth.value, newX));
            cropY.value = Math.max(0, Math.min(1 - cropHeight.value, newY));
        });

    const pinchGesture = Gesture.Pinch()
        .onChange((e) => {
            // Scale width/height around center
            // This is tricky to get right UX-wise quickly.

            // Alternative UX: 
            // Two sliders? No. 
            // Corner handles are standard.

            // Let's use a simplified approach:
            // 1. The box is fixed aspect? No.
            // 2. Just use a "Resize Handle" at bottom-right.
        });


    // Re-implementing a simple 4-handle crop UI logic using absolute positioning
    // We will use 2 gestures: 
    // 1. Pan on the BOX -> Moves it
    // 2. Pan on the HANDLE -> Resizes it (Bottom Right)

    // View Dimensions as Shared Values for Gestures
    const viewWidth = useSharedValue(0);
    const viewHeight = useSharedValue(0);

    const onBoxPan = Gesture.Pan().onChange((e) => {
        if (viewWidth.value === 0 || viewHeight.value === 0) return;

        const dx = e.changeX / viewWidth.value;
        const dy = e.changeY / viewHeight.value;

        cropX.value = Math.max(0, Math.min(1 - cropWidth.value, cropX.value + dx));
        cropY.value = Math.max(0, Math.min(1 - cropHeight.value, cropY.value + dy));
    });

    const onHandlePan = Gesture.Pan().onChange((e) => {
        if (viewWidth.value === 0 || viewHeight.value === 0) return;

        const dx = e.changeX / viewWidth.value;
        const dy = e.changeY / viewHeight.value;

        cropWidth.value = Math.max(0.1, Math.min(1 - cropX.value, cropWidth.value + dx));
        cropHeight.value = Math.max(0.1, Math.min(1 - cropY.value, cropHeight.value + dy));
    });

    const animatedStyle = useAnimatedStyle(() => ({
        left: `${cropX.value * 100}%`,
        top: `${cropY.value * 100}%`,
        width: `${cropWidth.value * 100}%`,
        height: `${cropHeight.value * 100}%`,
    }));

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <ArrowLeft size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Crop Image</Text>
                <View style={styles.headerRight} />
            </View>

            <View
                style={styles.editorContainer}
                onLayout={(e) => {
                    const { width, height } = e.nativeEvent.layout;
                    setViewSize({ width, height });
                    viewWidth.value = width;
                    viewHeight.value = height;
                }}
            >
                {/* Image */}
                <Image
                    source={{ uri: `file://${params.imagePath}` }}
                    style={styles.image}
                    resizeMode="contain"
                />

                {/* Overlay / Crop Box */}
                {viewSize && (
                    <View style={StyleSheet.absoluteFill}>
                        {/* Semi-transparent overlay outside selection is hard with just one view. 
                            We'll just show the box with a border for now. 
                        */}

                        <GestureHandlerRootView style={StyleSheet.absoluteFill}>
                            <GestureDetector gesture={onBoxPan}>
                                <Animated.View style={[styles.cropBox, animatedStyle]}>
                                    <View style={styles.cropCornerTL} />
                                    <View style={styles.cropCornerTR} />
                                    <View style={styles.cropCornerBL} />

                                    <GestureDetector gesture={onHandlePan}>
                                        <View style={styles.resizeHandle}>
                                            <View style={styles.cropCornerBR} />
                                        </View>
                                    </GestureDetector>
                                </Animated.View>
                            </GestureDetector>
                        </GestureHandlerRootView>
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.resetButton} onPress={resetToFull}>
                    <RotateCcw size={20} color="white" />
                    <Text style={styles.footerButtonText}>Original</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.applyButton}
                    onPress={handleApply}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Check size={20} color="white" />
                            <Text style={styles.footerButtonText}>Apply Scan</Text>
                        </>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
    },
    headerButton: {
        padding: spacing.sm,
    },
    headerTitle: {
        ...typography.h3,
        color: 'white',
    },
    headerRight: {
        width: 40,
    },
    editorContainer: {
        flex: 1,
        backgroundColor: '#111',
        margin: spacing.md,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    cropBox: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: colors.primary,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    resizeHandle: {
        position: 'absolute',
        bottom: -10,
        right: -10,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cropCornerTL: {
        position: 'absolute',
        top: -2,
        left: -2,
        width: 16,
        height: 16,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderColor: colors.primary,
    },
    cropCornerTR: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 16,
        height: 16,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderColor: colors.primary,
    },
    cropCornerBL: {
        position: 'absolute',
        bottom: -2,
        left: -2,
        width: 16,
        height: 16,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderColor: colors.primary,
    },
    cropCornerBR: {
        width: 16,
        height: 16,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderColor: colors.primary,
    },
    footer: {
        flexDirection: 'row',
        padding: spacing.lg,
        gap: spacing.md,
        backgroundColor: 'black',
    },
    resetButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#333',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    applyButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    footerButtonText: {
        ...typography.button,
        color: 'white',
        fontWeight: '600',
    },
});
