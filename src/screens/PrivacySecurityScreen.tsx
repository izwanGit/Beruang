// src/screens/PrivacySecurityScreen.tsx
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    Share,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/colors';
import {
    getFirestore,
    collection,
    getDocs,
    deleteDoc,
    doc,
} from 'firebase/firestore';
import { getAuth, deleteUser, signOut } from 'firebase/auth';
import { getStorage, ref, listAll, deleteObject } from 'firebase/storage';

type PrivacySecurityScreenProps = {
    onBack: () => void;
};

type SecurityFeatureProps = {
    icon: string;
    iconType?: 'feather' | 'material';
    title: string;
    description: string;
};

const SecurityFeature = ({ icon, iconType = 'material', title, description }: SecurityFeatureProps) => (
    <View style={styles.featureCard}>
        <View style={styles.featureIcon}>
            {iconType === 'feather' ? (
                <Icon name={icon} size={22} color={COLORS.accent} />
            ) : (
                <MaterialCommunityIcon name={icon} size={22} color={COLORS.accent} />
            )}
        </View>
        <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDescription}>{description}</Text>
        </View>
    </View>
);

export const PrivacySecurityScreen = ({ onBack }: PrivacySecurityScreenProps) => {
    const insets = useSafeAreaInsets();
    const headerTopPadding = Platform.OS === 'android' ? 50 : Math.max(insets.top, 20) + 12;
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Export user data as JSON
    const handleExportData = async () => {
        setIsExporting(true);
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) {
                Alert.alert('Error', 'You must be logged in to export data.');
                setIsExporting(false);
                return;
            }

            const db = getFirestore();
            const userId = user.uid;

            // Get user profile
            const profileDoc = await getDocs(collection(db, 'users'));
            let profileData = null;
            profileDoc.forEach((docSnap) => {
                if (docSnap.id === userId) {
                    profileData = docSnap.data();
                }
            });

            // Get transactions
            const transactionsSnap = await getDocs(collection(db, 'users', userId, 'transactions'));
            const transactions: any[] = [];
            transactionsSnap.forEach((docSnap) => {
                transactions.push({ id: docSnap.id, ...docSnap.data() });
            });

            // Get chat sessions
            const chatsSnap = await getDocs(collection(db, 'users', userId, 'chatSessions'));
            const chatSessions: any[] = [];
            chatsSnap.forEach((docSnap) => {
                chatSessions.push({ id: docSnap.id, ...docSnap.data() });
            });

            const exportData = {
                exportDate: new Date().toISOString(),
                profile: profileData,
                transactions: transactions,
                chatSessions: chatSessions,
                totalTransactions: transactions.length,
                totalChatSessions: chatSessions.length,
            };

            const jsonString = JSON.stringify(exportData, null, 2);

            await Share.share({
                message: jsonString,
                title: 'Beruang Data Export',
            });

            setIsExporting(false);
        } catch (error) {
            console.error('Export error:', error);
            Alert.alert('Export Failed', 'Could not export your data. Please try again.');
            setIsExporting(false);
        }
    };

    // Delete user account and all data
    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This will permanently delete your account and ALL your data including:\n\n• Your profile\n• All transactions\n• All chat history\n\nThis action CANNOT be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Everything',
                    style: 'destructive',
                    onPress: () => confirmDeleteAccount(),
                },
            ]
        );
    };

    // Recursive function to delete all files in a folder
    const deleteFolderContents = async (storageRef: any) => {
        try {
            const listResult = await listAll(storageRef);

            // Delete all files
            const filePromises = listResult.items.map((itemRef) => deleteObject(itemRef));
            await Promise.all(filePromises);

            // Recursively delete all subfolders
            const folderPromises = listResult.prefixes.map((folderRef) => deleteFolderContents(folderRef));
            await Promise.all(folderPromises);
        } catch (error) {
            console.error('Error deleting folder contents:', error);
            // Don't throw, just log. We want text data deletion to proceed even if storage fails.
        }
    };

    const confirmDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) {
                Alert.alert('Error', 'You must be logged in to delete your account.');
                setIsDeleting(false);
                return;
            }

            const db = getFirestore();
            const storage = getStorage();
            const userId = user.uid;

            // 1. Delete all transactions
            const transactionsSnap = await getDocs(collection(db, 'users', userId, 'transactions'));
            for (const docSnap of transactionsSnap.docs) {
                await deleteDoc(doc(db, 'users', userId, 'transactions', docSnap.id));
            }

            // 2. Delete all chat sessions & messages
            const chatsSnap = await getDocs(collection(db, 'users', userId, 'chatSessions'));
            for (const docSnap of chatsSnap.docs) {
                const messagesSnap = await getDocs(collection(db, 'users', userId, 'chatSessions', docSnap.id, 'messages'));
                for (const msgDoc of messagesSnap.docs) {
                    await deleteDoc(doc(db, 'users', userId, 'chatSessions', docSnap.id, 'messages', msgDoc.id));
                }
                await deleteDoc(doc(db, 'users', userId, 'chatSessions', docSnap.id));
            }

            // 3. Delete monthlyBudgets (MISSED PREVIOUSLY)
            const budgetsSnap = await getDocs(collection(db, 'users', userId, 'monthlyBudgets'));
            for (const docSnap of budgetsSnap.docs) {
                await deleteDoc(doc(db, 'users', userId, 'monthlyBudgets', docSnap.id));
            }

            // 4. Delete savedAdvices (MISSED PREVIOUSLY)
            const adviceSnap = await getDocs(collection(db, 'users', userId, 'savedAdvices'));
            for (const docSnap of adviceSnap.docs) {
                await deleteDoc(doc(db, 'users', userId, 'savedAdvices', docSnap.id));
            }

            // 5. Delete User Storage (Profile pics, Receipts, etc)
            // Note: Client SDK cannot delete a "folder" directly, so we list and delete files.
            const userStorageRef = ref(storage, `users/${userId}`);
            await deleteFolderContents(userStorageRef);

            // 6. Delete user profile document
            await deleteDoc(doc(db, 'users', userId));

            // 7. Delete Firebase Auth user
            await deleteUser(user);

            // 8. Sign out (in case deleteUser doesn't auto-redirect)
            try {
                await signOut(auth);
            } catch (e) {
                // Ignore signout error if user is already deleted
            }

            setIsDeleting(false);
            Alert.alert('Account Deleted', 'Your account and all data have been permanently deleted.');
        } catch (error: any) {
            console.error('Delete error:', error);
            setIsDeleting(false);

            // Firebase requires recent login for sensitive operations
            if (error.code === 'auth/requires-recent-login') {
                Alert.alert(
                    'Re-authentication Required',
                    'For security, please log out and log back in, then try deleting your account again.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Delete Failed', 'Could not delete your account. Please try again. Error: ' + error.message);
            }
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Header */}
            <View style={[styles.header, { paddingTop: headerTopPadding, height: 60 + headerTopPadding }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={onBack} style={styles.headerButton}>
                        <Icon name="arrow-left" size={24} color={COLORS.accent} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Privacy & Security</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Shield Header */}
                <View style={styles.shieldContainer}>
                    <View style={styles.shieldCircle}>
                        <MaterialCommunityIcon name="shield-check" size={40} color={COLORS.white} />
                    </View>
                    <Text style={styles.shieldTitle}>Your Data is Protected</Text>
                    <Text style={styles.shieldSubtitle}>
                        Beruang uses industry-standard security measures
                    </Text>
                </View>

                {/* Security Features Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security Features</Text>

                    <SecurityFeature
                        icon="lock"
                        title="HTTPS Encryption"
                        description="All data sent between your device and Firebase servers is encrypted using TLS."
                    />

                    <SecurityFeature
                        icon="account-lock"
                        title="Firebase Authentication"
                        description="Your account is protected by Firebase Auth with secure password hashing."
                    />

                    <SecurityFeature
                        icon="database-lock"
                        title="Firestore Security Rules"
                        description="Database rules ensure you can only access your own data. Other users cannot see your transactions."
                    />

                    <SecurityFeature
                        icon="cloud-check"
                        title="Google Cloud"
                        description="Your data is stored on Google Cloud Platform infrastructure."
                    />
                </View>

                {/* Data Handling Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Data We Store</Text>

                    <View style={styles.dataCard}>
                        <View style={styles.dataRow}>
                            <MaterialCommunityIcon name="check-circle" size={18} color={COLORS.success} />
                            <Text style={styles.dataText}>Profile (name, age, goals)</Text>
                        </View>
                        <View style={styles.dataRow}>
                            <MaterialCommunityIcon name="check-circle" size={18} color={COLORS.success} />
                            <Text style={styles.dataText}>Transactions you create</Text>
                        </View>
                        <View style={styles.dataRow}>
                            <MaterialCommunityIcon name="check-circle" size={18} color={COLORS.success} />
                            <Text style={styles.dataText}>Chat history with AI assistant</Text>
                        </View>
                    </View>
                </View>

                {/* What We Don't Do Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>What We Don't Do</Text>

                    <View style={styles.dataCard}>
                        <View style={styles.dataRow}>
                            <MaterialCommunityIcon name="close-circle" size={18} color={COLORS.danger} />
                            <Text style={styles.dataText}>Connect to your bank accounts</Text>
                        </View>
                        <View style={styles.dataRow}>
                            <MaterialCommunityIcon name="close-circle" size={18} color={COLORS.danger} />
                            <Text style={styles.dataText}>Sell or share your data</Text>
                        </View>
                        <View style={styles.dataRow}>
                            <MaterialCommunityIcon name="close-circle" size={18} color={COLORS.danger} />
                            <Text style={styles.dataText}>Track your location</Text>
                        </View>
                    </View>
                </View>

                {/* AI Disclosure */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>AI Assistant</Text>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoText}>
                            When you chat with the Beruang assistant, your financial context is sent to our AI server to provide personalized advice. This data is processed in real-time and not permanently stored by the AI.
                        </Text>
                    </View>
                </View>

                {/* Your Rights Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Data Rights</Text>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleExportData}
                        disabled={isExporting}
                    >
                        <View style={styles.actionIcon}>
                            {isExporting ? (
                                <ActivityIndicator size="small" color={COLORS.accent} />
                            ) : (
                                <Icon name="download" size={20} color={COLORS.accent} />
                            )}
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Export My Data</Text>
                            <Text style={styles.actionDescription}>Download a copy of all your data as JSON</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color={COLORS.darkGray} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.dangerButton]}
                        onPress={handleDeleteAccount}
                        disabled={isDeleting}
                    >
                        <View style={[styles.actionIcon, styles.dangerIcon]}>
                            {isDeleting ? (
                                <ActivityIndicator size="small" color={COLORS.danger} />
                            ) : (
                                <Icon name="trash-2" size={20} color={COLORS.danger} />
                            )}
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={[styles.actionTitle, styles.dangerText]}>Delete My Account</Text>
                            <Text style={styles.actionDescription}>Permanently delete all your data</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color={COLORS.darkGray} />
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Beruang v1.0.0
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.accent,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    shieldContainer: {
        alignItems: 'center',
        marginBottom: 24,
        paddingTop: 8,
    },
    shieldCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    shieldTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.accent,
        marginBottom: 4,
    },
    shieldSubtitle: {
        fontSize: 14,
        color: COLORS.darkGray,
        textAlign: 'center',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.accent,
        marginBottom: 10,
    },
    featureCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.accent,
        marginBottom: 2,
    },
    featureDescription: {
        fontSize: 12,
        color: COLORS.darkGray,
        lineHeight: 16,
    },
    dataCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 14,
    },
    dataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },
    dataText: {
        fontSize: 13,
        color: COLORS.accent,
        marginLeft: 10,
    },
    infoCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        padding: 14,
    },
    infoText: {
        fontSize: 13,
        color: COLORS.accent,
        lineHeight: 18,
    },
    actionButton: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.accent,
        marginBottom: 2,
    },
    actionDescription: {
        fontSize: 12,
        color: COLORS.darkGray,
    },
    dangerButton: {
        borderWidth: 1,
        borderColor: COLORS.danger + '30',
    },
    dangerIcon: {
        backgroundColor: COLORS.danger + '15',
    },
    dangerText: {
        color: COLORS.danger,
    },
    footer: {
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E8E8E8',
    },
    footerText: {
        fontSize: 12,
        color: COLORS.darkGray,
    },
});
