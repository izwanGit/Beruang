import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Modal,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Animated,
    Dimensions,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS } from '../constants/colors';

const SCREEN_HEIGHT = Dimensions.get('window').height;

type ReallocateModalProps = {
    isVisible: boolean;
    onClose: () => void;
    onConfirm: (months: number) => Promise<void>;
    totalRemaining: number;
    initialMonths?: number;
};

export const ReallocateModal: React.FC<ReallocateModalProps> = ({
    isVisible,
    onClose,
    onConfirm,
    totalRemaining,
    initialMonths = 3,
}) => {
    const [months, setMonths] = useState(String(initialMonths || 3));
    const [isLoading, setIsLoading] = useState(false);

    // Animation values
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    // Handle Visibility Animation
    useEffect(() => {
        if (isVisible) {
            // Reset state on open
            setMonths(String(initialMonths || 3));
            setIsLoading(false);

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    damping: 20,
                    mass: 0.8,
                    stiffness: 100,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: SCREEN_HEIGHT,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isVisible]);

    const handleIncrement = () => {
        const current = parseInt(months, 10) || 1;
        setMonths(Math.min(current + 1, 60).toString());
    };

    const handleDecrement = () => {
        const current = parseInt(months, 10) || 1;
        setMonths(Math.max(current - 1, 1).toString());
    };

    const handleSave = async () => {
        const numMonths = parseInt(months, 10);
        if (!numMonths || numMonths < 1) return;

        setIsLoading(true);
        await onConfirm(numMonths);
        setIsLoading(false);
    };

    const numMonths = parseInt(months, 10) || 1;
    const amountPerMonth = totalRemaining / numMonths;

    if (!isVisible) return null;

    return (
        <Modal transparent visible={isVisible} animationType="none" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
            </TouchableWithoutFeedback>

            <Animated.View
                style={[
                    styles.modalContainer,
                    { transform: [{ translateY: slideAnim }] },
                ]}
            >
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Reallocate Series</Text>
                            <Text style={styles.subtitle}>Redistribute remaining amount</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Icon name="x" size={20} color={COLORS.darkGray} />
                        </TouchableOpacity>
                    </View>

                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>TOTAL REMAINING POOL</Text>
                        <Text style={styles.infoValue}>RM {(totalRemaining || 0).toFixed(2)}</Text>
                    </View>

                    {/* Month Input */}
                    <View style={styles.inputSection}>
                        <Text style={styles.sectionLabel}>SPREAD OVER HOW MANY MONTHS?</Text>

                        <View style={styles.monthPickerContainer}>
                            <TouchableOpacity onPress={handleDecrement} style={styles.pickerButton}>
                                <Icon name="minus" size={24} color={COLORS.accent} />
                            </TouchableOpacity>

                            <View style={styles.pickerDisplay}>
                                <TextInput
                                    style={styles.pickerInput}
                                    value={months}
                                    onChangeText={(t) => setMonths(t.replace(/[^0-9]/g, ''))}
                                    keyboardType="numeric"
                                    maxLength={2}
                                />
                                <Text style={styles.pickerUnit}>{numMonths === 1 ? 'Month' : 'Months'}</Text>
                            </View>

                            <TouchableOpacity onPress={handleIncrement} style={styles.pickerButton}>
                                <Icon name="plus" size={24} color={COLORS.accent} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Preview */}
                    <View style={styles.previewContainer}>
                        <Text style={styles.previewLabel}>NEW ALLOCATION PER MONTH</Text>
                        <Text style={styles.previewAmount}>~ RM {amountPerMonth.toFixed(2)}</Text>
                        <Text style={styles.previewNote}>
                            Starting from the first affected month
                        </Text>
                    </View>

                    {/* Action Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.saveButton, isLoading && styles.disabledButton]}
                            onPress={handleSave}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Icon name="refresh-cw" size={18} color="#FFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.saveButtonText}>Confirm Reallocation</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        height: 'auto',
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
    },
    modalContent: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.accent,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.darkGray,
        marginTop: 4,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoCard: {
        backgroundColor: COLORS.secondary, // Light green/sage
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginBottom: 24,
    },
    infoLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: COLORS.primary,
        letterSpacing: 1,
        marginBottom: 6,
    },
    infoValue: {
        fontSize: 28,
        fontWeight: '900',
        color: COLORS.white,
    },
    inputSection: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.darkGray,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    monthPickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FAFAFA',
        borderRadius: 20,
        padding: 6,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    pickerButton: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
    },
    pickerDisplay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pickerInput: {
        fontSize: 28,
        fontWeight: '900',
        color: COLORS.accent,
        textAlign: 'center',
        padding: 0,
        minWidth: 50,
    },
    pickerUnit: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.darkGray,
        marginTop: -4,
    },
    previewContainer: {
        alignItems: 'center',
        marginBottom: 30,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    previewLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
        marginBottom: 8,
    },
    previewAmount: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.success, // Green
    },
    previewNote: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 6,
        fontStyle: 'italic',
    },
    footer: {
        marginTop: 0,
    },
    saveButton: {
        backgroundColor: COLORS.accent,
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
