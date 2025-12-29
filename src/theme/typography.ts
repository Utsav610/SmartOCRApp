export const typography = {
    // Headers
    h1: {
        fontSize: 28,
        fontWeight: '700' as const,
        lineHeight: 36,
    },
    h2: {
        fontSize: 20,
        fontWeight: '600' as const,
        lineHeight: 28,
    },
    h3: {
        fontSize: 16,
        fontWeight: '600' as const,
        lineHeight: 24,
    },

    // Body text
    body: {
        fontSize: 14,
        fontWeight: '400' as const,
        lineHeight: 20,
    },
    bodyLarge: {
        fontSize: 16,
        fontWeight: '400' as const,
        lineHeight: 24,
    },

    // Caption
    caption: {
        fontSize: 12,
        fontWeight: '400' as const,
        lineHeight: 16,
    },
    captionSmall: {
        fontSize: 10,
        fontWeight: '400' as const,
        lineHeight: 14,
    },

    // Button
    button: {
        fontSize: 16,
        fontWeight: '600' as const,
        lineHeight: 24,
    },
    buttonSmall: {
        fontSize: 14,
        fontWeight: '600' as const,
        lineHeight: 20,
    },

    // Special
    display: {
        fontSize: 48,
        fontWeight: '700' as const,
        lineHeight: 56,
    },
    label: {
        fontSize: 11,
        fontWeight: '600' as const,
        lineHeight: 16,
        letterSpacing: 0.5,
    },
};

export type TypographyKey = keyof typeof typography;
