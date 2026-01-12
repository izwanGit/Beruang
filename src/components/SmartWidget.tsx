import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { COLORS } from '../constants/colors';
import { SpendingSummaryWidget } from './widgets/SpendingSummaryWidget';
import { ItineraryWidget } from './widgets/ItineraryWidget';
import { GoalProgressWidget } from './widgets/GoalProgressWidget';
import { DailyTransactionsWidget } from './widgets/DailyTransactionsWidget';

export type WidgetData = {
    t: 's' | 'i' | 'g' | 'd';
    [key: string]: any;
};

interface SmartWidgetProps {
    dataString: string;
}

export const SmartWidget: React.FC<SmartWidgetProps> = ({ dataString }) => {
    const animation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(animation, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
        }).start();
    }, []);

    let data: WidgetData;

    try {
        data = JSON.parse(dataString);
        console.log('📊 Widget parsed:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.warn('Malformed widget data:', dataString);
        return null; // Fallback to nothing if JSON is broken
    }

    const animatedStyle = {
        opacity: animation,
        transform: [
            {
                translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                }),
            },
            {
                scale: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                }),
            },
        ],
    };

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            {data.t === 's' && <SpendingSummaryWidget data={data as any} />}
            {data.t === 'i' && <ItineraryWidget data={data as any} />}
            {data.t === 'g' && <GoalProgressWidget data={data as any} />}
            {data.t === 'd' && <DailyTransactionsWidget data={data as any} />}
            {!['s', 'i', 'g', 'd'].includes(data.t) && (
                <View style={styles.errorState}>
                    <Text style={styles.errorText}>Invalid Widget Type</Text>
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
        width: '100%',
    },
    errorState: {
        padding: 12,
        backgroundColor: 'rgba(255,0,0,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,0,0,0.1)',
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 12,
        fontWeight: '600',
    }
});
