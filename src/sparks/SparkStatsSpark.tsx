import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    TouchableOpacity,
    Alert
} from 'react-native';
import { Svg, Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { SparkProps } from '../types/spark';
import { FirebaseService } from '../services/FirebaseService';
import { AnalyticsEvent } from '../types/analytics';
import { useNavigation } from '@react-navigation/native';
import { getSparkById } from '../components/SparkRegistry';

interface DailyStats {
    date: string; // YYYY-MM-DD
    activeUsers: number;
}

interface SparkTrend {
    sparkId: string;
    name: string;
    opens: number;
}

export const SparkStatsSpark: React.FC<SparkProps> = ({ onCloseSettings }) => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
    const [topSparks, setTopSparks] = useState<SparkTrend[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            // Fetch last 14 days of data
            const events = await FirebaseService.getGlobalAnalytics(14);

            processStats(events);
        } catch (error) {
            console.error('Error loading stats:', error);
            Alert.alert('Error', 'Failed to load community stats');
        } finally {
            setLoading(false);
        }
    };

    const processStats = (events: AnalyticsEvent[]) => {
        // 1. Calculate DAU (Daily Active Users)
        const usersByDay = new Map<string, Set<string>>();
        const today = new Date();
        const last14Days = Array.from({ length: 14 }, (_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - (13 - i));
            return d.toISOString().split('T')[0];
        });

        // Initialize map
        last14Days.forEach(date => usersByDay.set(date, new Set()));

        events.forEach(event => {
            if (!event.timestamp) return;

            // Handle Firestore Timestamp or Date object
            const dateObj = (event.timestamp as any).toDate ? (event.timestamp as any).toDate() : new Date(event.timestamp as any);
            const dateStr = dateObj.toISOString().split('T')[0];

            if (usersByDay.has(dateStr) && event.userId) {
                usersByDay.get(dateStr)?.add(event.userId);
            }
        });

        const stats: DailyStats[] = last14Days.map(date => ({
            date,
            activeUsers: usersByDay.get(date)?.size || 0
        }));
        setDailyStats(stats);

        // 2. Calculate Top Sparks (Last 7 Days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const sparkOpens = new Map<string, { name: string, count: number }>();

        events.forEach(event => {
            const dateObj = (event.timestamp as any).toDate ? (event.timestamp as any).toDate() : new Date(event.timestamp as any);

            // Filter out 'app' sparkId
            if (dateObj >= oneWeekAgo && event.eventType === 'spark_opened' && event.sparkId && event.sparkId !== 'app') {
                const current = sparkOpens.get(event.sparkId) || { name: event.eventData?.sparkName || event.sparkId, count: 0 };
                sparkOpens.set(event.sparkId, { ...current, count: current.count + 1 });
            }
        });

        const sortedSparks = Array.from(sparkOpens.entries())
            .map(([id, data]) => ({ sparkId: id, name: data.name, opens: data.count }))
            .sort((a, b) => b.opens - a.opens)
            .slice(0, 5); // Top 5

        setTopSparks(sortedSparks);
    };

    const Chart = () => {
        if (dailyStats.length < 2) return null;

        const width = Dimensions.get('window').width - 40;
        const height = 220;
        const padding = 30;

        const values = dailyStats.map(d => d.activeUsers);
        const minVal = 0; // Always start at 0 for DAU
        const maxVal = Math.max(...values, 5); // Minimum scale of 5
        const range = maxVal - minVal;

        const getX = (index: number) => padding + (index * (width - 2 * padding)) / (dailyStats.length - 1);
        const getY = (val: number) => height - padding - ((val - minVal) / range) * (height - 2 * padding);

        const pathData = dailyStats.map((d, i) =>
            `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.activeUsers)}`
        ).join(' ');

        return (
            <View style={{ marginVertical: 20, alignItems: 'center' }}>
                <Svg width={width} height={height}>
                    {/* Grid lines */}
                    <Line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke={colors.border} strokeWidth="1" />
                    <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={colors.border} strokeWidth="1" />

                    {/* Data Line */}
                    <Path
                        d={pathData}
                        stroke={colors.primary}
                        strokeWidth="3"
                        fill="none"
                    />

                    {/* Data Points */}
                    {dailyStats.map((d, i) => (
                        <React.Fragment key={d.date}>
                            <Circle
                                cx={getX(i)}
                                cy={getY(d.activeUsers)}
                                r="4"
                                fill={colors.background}
                                stroke={colors.primary}
                                strokeWidth="2"
                            />
                            {/* Value Labels */}
                            <SvgText
                                x={getX(i)}
                                y={getY(d.activeUsers) - 10}
                                fontSize="10"
                                fill={colors.text}
                                textAnchor="middle"
                            >
                                {d.activeUsers}
                            </SvgText>
                            {/* Date Labels (every 3rd day) */}
                            {i % 3 === 0 && (
                                <SvgText
                                    x={getX(i)}
                                    y={height - 10}
                                    fontSize="10"
                                    fill={colors.textSecondary}
                                    textAnchor="middle"
                                >
                                    {d.date.slice(5)}
                                </SvgText>
                            )}
                        </React.Fragment>
                    ))}
                </Svg>
            </View>
        );
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Community Stats</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    See how the Sparks community is growing
                </Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : (
                <View style={styles.content}>
                    {/* DAU Section */}
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Daily Active Users</Text>
                        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Last 14 Days</Text>
                        <Chart />
                    </View>

                    {/* Top Sparks Section */}
                    <View style={[styles.card, { backgroundColor: colors.surface, marginTop: 20 }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Trending Sparks</Text>
                        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Most opened in last 7 days</Text>

                        <View style={styles.listContainer}>
                            {topSparks.map((spark, index) => {
                                const sparkMeta = getSparkById(spark.sparkId);
                                const icon = sparkMeta?.metadata.icon || '📱';
                                const description = sparkMeta?.metadata.description || 'No description available';
                                const title = sparkMeta?.metadata.title || spark.name;

                                return (
                                    <View key={spark.sparkId} style={[styles.listItem, { borderBottomColor: colors.border }]}>
                                        <View style={styles.rankContainer}>
                                            <Text style={[styles.rank, { color: colors.primary }]}>#{index + 1}</Text>
                                        </View>
                                        <View style={styles.sparkInfo}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                <Text style={{ fontSize: 16, marginRight: 6 }}>{icon}</Text>
                                                <Text style={[styles.sparkName, { color: colors.text }]}>{title}</Text>
                                            </View>
                                            <Text style={[styles.sparkDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                                                {description}
                                            </Text>
                                            <Text style={[styles.sparkOpens, { color: colors.textSecondary, marginTop: 2 }]}>
                                                {spark.opens} opens this week
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={[styles.openButton, { backgroundColor: colors.primary }]}
                                            onPress={() => {
                                                if (sparkMeta) {
                                                    (navigation as any).push('Spark', { sparkId: spark.sparkId });
                                                } else {
                                                    Alert.alert('Unavailable', 'This spark is not available in your version.');
                                                }
                                            }}
                                        >
                                            <Text style={styles.openButtonText}>Open</Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                            {topSparks.length === 0 && (
                                <Text style={{ textAlign: 'center', padding: 20, color: colors.textSecondary }}>
                                    No data available yet.
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingBottom: 0,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
        marginTop: 4,
    },
    content: {
        padding: 20,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardSubtitle: {
        fontSize: 14,
        marginBottom: 10,
    },
    listContainer: {
        marginTop: 10,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    rankContainer: {
        width: 40,
        alignItems: 'center',
    },
    rank: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    sparkInfo: {
        flex: 1,
        marginLeft: 10,
    },
    sparkName: {
        fontSize: 16,
        fontWeight: '600',
    },
    sparkDescription: {
        fontSize: 12,
        marginBottom: 2,
    },
    sparkOpens: {
        fontSize: 12,
    },
    openButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    openButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
});

export default SparkStatsSpark;
