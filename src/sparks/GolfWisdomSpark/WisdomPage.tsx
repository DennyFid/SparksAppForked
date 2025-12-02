import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WisdomQuote } from './wisdomData';

interface WisdomPageProps {
    quote: WisdomQuote;
}

export const WisdomPage: React.FC<WisdomPageProps> = ({ quote }) => {
    return (
        <View style={styles.container}>
            {/* Top decorative flourish */}
            <View style={styles.topFlourish}>
                <Text style={styles.flourishText}>✦ ✦ ✦</Text>
                <View style={styles.dividerLine} />
            </View>

            <View style={styles.quoteContainer}>
                {/* Opening quote mark */}
                <Text style={styles.openQuote}>"</Text>

                {/* Quote content */}
                <Text style={styles.quoteText}>{quote.content}</Text>

                {/* Closing quote mark */}
                <Text style={styles.closeQuote}>"</Text>
            </View>

            {/* Attribution */}
            <Text style={styles.attribution}>— {quote.contributor || 'Tam O\'Shanter'}</Text>

            {/* Bottom decorative flourish */}
            <View style={styles.bottomFlourish}>
                <View style={styles.dividerLine} />
                <Text style={styles.flourishText}>✦ ✦ ✦</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 80,
    },
    topFlourish: {
        alignItems: 'center',
        marginBottom: 40,
    },
    bottomFlourish: {
        alignItems: 'center',
        marginTop: 40,
    },
    flourishText: {
        fontSize: 16,
        color: '#8B7355',
        letterSpacing: 8,
        opacity: 0.6,
    },
    dividerLine: {
        width: 120,
        height: 1,
        backgroundColor: '#8B7355',
        marginVertical: 8,
        opacity: 0.4,
    },
    quoteContainer: {
        position: 'relative',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    openQuote: {
        fontSize: 96,
        color: '#2D5016',
        fontFamily: 'American Typewriter',
        fontWeight: '700',
        opacity: 0.25,
        position: 'absolute',
        top: -50,
        left: -40,
    },
    quoteText: {
        fontSize: 26,
        lineHeight: 40,
        color: '#2C2C2C',
        textAlign: 'center',
        fontFamily: 'American Typewriter',
        fontWeight: '600',
        paddingHorizontal: 20,
        maxWidth: 600,
    },
    closeQuote: {
        fontSize: 96,
        color: '#2D5016',
        fontFamily: 'American Typewriter',
        fontWeight: '700',
        opacity: 0.25,
        position: 'absolute',
        bottom: -50,
        right: -40,
    },
    attribution: {
        fontSize: 22,
        color: '#666',
        fontFamily: 'American Typewriter',
        fontStyle: 'italic',
        marginTop: 30,
    },
});
