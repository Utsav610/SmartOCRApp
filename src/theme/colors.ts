export const colors = {
    // Background colors
    background: '#0A1F1F',      // Dark teal background
    surface: '#1A2F2F',         // Card background
    surfaceLight: '#243838',    // Lighter surface
    surfaceHover: '#2A4040',    // Hover state

    // Primary colors
    primary: '#3DBDB6',         // Teal accent
    primaryDark: '#2A9A94',     // Darker teal
    primaryLight: '#5FCFC9',    // Lighter teal

    // Text colors
    text: '#FFFFFF',            // White text
    textSecondary: '#8A9999',   // Gray text
    textTertiary: '#5A6969',    // Darker gray

    // Border colors
    border: '#2A3F3F',          // Border color
    borderLight: '#3A4F4F',     // Lighter border

    // Status colors
    success: '#4ADE80',         // Green indicator
    warning: '#FBBF24',         // Yellow indicator
    error: '#EF4444',           // Red
    info: '#3B82F6',            // Blue

    // State colors
    inactive: '#4A5555',        // Gray indicator
    active: '#3DBDB6',          // Active teal

    // Overlay
    overlay: 'rgba(10, 31, 31, 0.9)',
    overlayLight: 'rgba(10, 31, 31, 0.7)',

    // Transparent
    transparent: 'transparent',
};

export type ColorKey = keyof typeof colors;
