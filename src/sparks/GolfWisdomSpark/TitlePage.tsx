import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const TitlePage: React.FC = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.icon}>⛳</Text>
            <Text style={styles.title}>Golf Wisdom</Text>
            <Text style={styles.subtitle}>by Tam O'Shanter</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    icon: {
        fontSize: 64,
        marginBottom: 24,
    },
    title: {
        fontSize: 48,
        fontWeight: '700',
        color: '#2C2C2C',
        marginBottom: 16,
        fontFamily: 'American Typewriter',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 26,
        color: '#666',
        fontFamily: 'American Typewriter',
        fontStyle: 'italic',
        textAlign: 'center',
    },
});
