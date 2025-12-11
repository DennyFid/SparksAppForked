import React, { forwardRef } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { createCommonStyles } from '../styles/CommonStyles';

interface BaseInputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
    labelStyle?: TextStyle;
    inputStyle?: TextStyle;
}

/**
 * Standard single-line input component with label support
 */
export const Input = forwardRef<TextInput, BaseInputProps>(({
    label,
    error,
    containerStyle,
    labelStyle,
    inputStyle,
    style,
    ...props
}, ref) => {
    const { colors } = useTheme();
    const commonStyles = createCommonStyles(colors);

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={[styles.label, { color: colors.text }, labelStyle]}>
                    {label}
                </Text>
            )}
            <TextInput
                ref={ref}
                style={[
                    commonStyles.input,
                    error ? { borderColor: colors.error } : null,
                    style
                ]}
                placeholderTextColor={colors.textSecondary}
                {...props}
            />
            {error && (
                <Text style={[styles.error, { color: colors.error }]}>
                    {error}
                </Text>
            )}
        </View>
    );
});

/**
 * Multiline text area component
 */
export const TextArea = forwardRef<TextInput, BaseInputProps>(({
    label,
    error,
    containerStyle,
    style,
    ...props
}, ref) => {
    const { colors } = useTheme();
    const commonStyles = createCommonStyles(colors);

    return (
        <Input
            ref={ref}
            label={label}
            error={error}
            containerStyle={containerStyle}
            style={[styles.textArea, style]}
            multiline
            textAlignVertical="top"
            numberOfLines={4}
            {...props}
        />
    );
});

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    error: {
        fontSize: 12,
        marginTop: 4,
    },
    textArea: {
        minHeight: 100,
        paddingTop: 12,
    },
});
