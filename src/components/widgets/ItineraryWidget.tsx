import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { COLORS } from '../../constants/colors';
import Icon from 'react-native-vector-icons/Feather';

interface ItineraryProps {
    data: {
        name: string;
        items: Array<{ d: string, v: string }>;
    };
}

export const ItineraryWidget: React.FC<ItineraryProps> = ({ data }) => {
    const { name, items } = data;

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Icon name="map" size={18} color={COLORS.accent} />
                    <Text style={styles.title}>{name}</Text>
                </View>
                <Text style={styles.subtitle}>Proposed AI Itinerary</Text>
            </View>

            <View style={styles.timeline}>
                {items.map((item, index) => (
                    <View key={index} style={styles.timelineItem}>
                        <View style={styles.lineIndicator}>
                            <View style={styles.dot} />
                            {index < items.length - 1 && <View style={styles.line} />}
                        </View>
                        <View style={styles.content}>
                            <Text style={styles.dayText}>{item.d}</Text>
                            <View style={styles.costBadge}>
                                <Text style={styles.costText}>Est: RM {item.v}</Text>
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1.5,
        borderColor: '#EFEBE9',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 4,
    },
    header: {
        marginBottom: 20,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.accent,
    },
    subtitle: {
        fontSize: 12,
        color: COLORS.darkGray,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    timeline: {
        paddingLeft: 4,
    },
    timelineItem: {
        flexDirection: 'row',
        minHeight: 60,
    },
    lineIndicator: {
        alignItems: 'center',
        width: 20,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: COLORS.white,
        zIndex: 2,
    },
    line: {
        flex: 1,
        width: 2,
        backgroundColor: '#EEEEEE',
        marginVertical: 2,
    },
    content: {
        flex: 1,
        marginLeft: 12,
        paddingBottom: 20,
    },
    dayText: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.accent,
        marginBottom: 4,
    },
    costBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    costText: {
        fontSize: 11,
        fontWeight: '800',
        color: COLORS.darkGray,
    }
});
