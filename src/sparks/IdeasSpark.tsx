import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSparkStore } from '../store';
import { useTheme } from '../contexts/ThemeContext';
import { createCommonStyles } from '../styles/CommonStyles';
import { Input } from '../components/FormComponents';
import { SettingsContainer, SettingsScrollView, SettingsHeader, SettingsFeedbackSection } from '../components/SettingsComponents';

interface Idea {
    id: string;
    content: string;
    createdAt: string; // ISO string
}

interface IdeasSparkProps {
    showSettings?: boolean;
    onCloseSettings?: () => void;
}

export const IdeasSpark: React.FC<IdeasSparkProps> = ({ showSettings, onCloseSettings }) => {
    const { getSparkData, setSparkData } = useSparkStore();
    const { colors } = useTheme();
    const commonStyles = createCommonStyles(colors);

    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [newIdea, setNewIdea] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Load ideas on mount
    useEffect(() => {
        const data = getSparkData('ideas');
        if (data && data.ideas) {
            setIdeas(data.ideas);
        }
    }, [getSparkData]);

    // Save ideas when changed
    useEffect(() => {
        const data = getSparkData('ideas');
        setSparkData('ideas', { ...data, ideas });
    }, [ideas, setSparkData, getSparkData]);

    const handleAddIdea = () => {
        if (!newIdea.trim()) return;

        const idea: Idea = {
            id: Date.now().toString(),
            content: newIdea.trim(),
            createdAt: new Date().toISOString(),
        };

        setIdeas([idea, ...ideas]); // Newest first
        setNewIdea('');
    };

    const formatDate = (isoString: string) => {
        return isoString.split('T')[0];
    };

    const renderContentWithHighlight = (content: string, keyword: string) => {
        if (!keyword) return <Text style={{ color: colors.text }}>{content}</Text>;

        const parts = content.split(new RegExp(`(${keyword})`, 'gi'));
        return (
            <Text style={{ color: colors.text }}>
                {parts.map((part, index) =>
                    part.toLowerCase() === keyword.toLowerCase() ? (
                        <Text key={index} style={styles.highlightedText}>{part}</Text>
                    ) : (
                        <Text key={index}>{part}</Text>
                    )
                )}
            </Text>
        );
    };

    const filteredIdeas = ideas.filter(idea => {
        const matchKeyword = !searchKeyword || idea.content.toLowerCase().includes(searchKeyword.toLowerCase());

        // Simple date string comparison (YYYY-MM-DD)
        const ideaDate = idea.createdAt.split('T')[0];
        const afterStart = !startDate || ideaDate >= startDate;
        const beforeEnd = !endDate || ideaDate <= endDate;

        return matchKeyword && afterStart && beforeEnd;
    });

    const styles = StyleSheet.create({
        ...commonStyles,
        container: {
            flex: 1,
            backgroundColor: colors.background,
            padding: 16,
        },
        header: {
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: 16,
            textAlign: 'center',
        },
        inputContainer: {
            flexDirection: 'row',
            marginBottom: 16,
            gap: 8,
        },
        addButton: {
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 8,
            height: 50, // Match typical input height
            marginTop: 22, // Align with input field (below label spacer)
        },
        addButtonText: {
            color: 'white',
            fontWeight: 'bold',
        },
        searchContainer: {
            marginBottom: 16,
            backgroundColor: colors.surface,
            padding: 12,
            borderRadius: 8,
        },
        ideasList: {
            flex: 1,
        },
        ideaCard: {
            backgroundColor: colors.surface,
            padding: 16,
            borderRadius: 8,
            marginBottom: 12,
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
        },
        ideaDate: {
            fontSize: 12,
            color: colors.textSecondary,
            marginBottom: 4,
        },
        ideaText: {
            fontSize: 16,
            color: colors.text,
            lineHeight: 22,
        },
        highlightedText: {
            textDecorationLine: 'underline',
            fontWeight: 'bold',
            backgroundColor: 'rgba(255, 255, 0, 0.2)',
            color: colors.text,
        },
        emptyText: {
            textAlign: 'center',
            color: colors.textSecondary,
            marginTop: 20,
        },
        settingsCloseButton: {
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: 'center',
            borderWidth: 1,
            backgroundColor: 'transparent',
            marginTop: 20,
            alignSelf: 'center',
        },
    });

    if (showSettings) {
        return (
            <SettingsContainer>
                <SettingsScrollView>
                    <SettingsHeader
                        title="Ideas Settings"
                        subtitle="Manage your ideas spark"
                        icon="💡"
                        sparkId="ideas"
                    />

                    <SettingsFeedbackSection sparkName="Ideas" sparkId="ideas" />

                    <TouchableOpacity
                        style={[styles.settingsCloseButton, { borderColor: colors.border }]}
                        onPress={() => onCloseSettings?.()}
                    >
                        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                            Close
                        </Text>
                    </TouchableOpacity>
                </SettingsScrollView>
            </SettingsContainer>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Ideas 💡</Text>

            <View style={styles.inputContainer}>
                <Input
                    containerStyle={{ flex: 1, marginBottom: 0 }}
                    placeholder="New Idea..."
                    value={newIdea}
                    onChangeText={setNewIdea}
                    label="Capture Idea"
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddIdea}>
                    <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Input
                    label="Search Keywords"
                    placeholder="Search..."
                    value={searchKeyword}
                    onChangeText={setSearchKeyword}
                    containerStyle={{ marginBottom: 12 }}
                />

                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                        <Input
                            label="Start Date"
                            placeholder="2024-01-01"
                            value={startDate}
                            onChangeText={setStartDate}
                            containerStyle={{ marginBottom: 0 }}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Input
                            label="End Date"
                            placeholder="2024-12-31"
                            value={endDate}
                            onChangeText={setEndDate}
                            containerStyle={{ marginBottom: 0 }}
                        />
                    </View>
                </View>
            </View>

            <ScrollView style={styles.ideasList}>
                {filteredIdeas.map(idea => (
                    <View key={idea.id} style={styles.ideaCard}>
                        <Text style={styles.ideaDate}>{formatDate(idea.createdAt)}</Text>
                        <Text style={styles.ideaText}>
                            {renderContentWithHighlight(idea.content, searchKeyword)}
                        </Text>
                    </View>
                ))}
                {filteredIdeas.length === 0 && (
                    <Text style={styles.emptyText}>
                        No ideas found
                    </Text>
                )}
            </ScrollView>
        </View>
    );
};

export default IdeasSpark;
