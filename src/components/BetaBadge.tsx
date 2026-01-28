import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

interface BetaBadgeProps {
    size?: "small" | "medium";
}

export const BetaBadge: React.FC<BetaBadgeProps> = ({
    size = "small",
}) => {
    const { colors } = useTheme();

    const sizeStyles = {
        small: {
            minWidth: 14,
            height: 14,
            borderRadius: 7,
            fontSize: 9,
        },
        medium: {
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            fontSize: 11,
        },
    };

    const currentSize = sizeStyles[size];

    return (
        <View
            pointerEvents="none"
            style={[
                styles.badge,
                {
                    backgroundColor: '#ff9500', // standard beta orange
                    minWidth: currentSize.minWidth,
                    height: currentSize.height,
                    borderRadius: currentSize.borderRadius,
                },
            ]}
        >
            <Text
                style={[
                    styles.badgeText,
                    {
                        color: '#fff',
                        fontSize: currentSize.fontSize,
                    },
                ]}
            >
                b
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        position: "absolute",
        top: -4,
        right: -4,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 2,
        zIndex: 2, // Above notification badge
    },
    badgeText: {
        fontWeight: "bold",
        textAlign: "center",
    },
});
