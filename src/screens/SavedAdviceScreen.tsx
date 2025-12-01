// src/screens/SavedAdviceScreen.tsx
import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
// --- ★★★ App.tsx now defines these types, so we import them ★★★ ---
import { Advice } from '../../App'; 
import { COLORS } from '../constants/colors';

// --- ★★★ MODIFIED Props ★★★ ---
type SavedAdviceScreenProps = {
  onBack: () => void;
  savedAdvices: Advice[]; 
  onGoToChat: (chatId: string, messageId: string) => void; 
  onDeleteAdvice: (adviceId: string) => void; // <-- ADDED
};

// --- ★★★ MODIFIED Component ★★★ ---
const AdviceCard = ({
  advice,
  onGoToChat,
  onDelete,
}: {
  advice: Advice;
  onGoToChat: (chatId: string, messageId: string) => void;
  onDelete: (adviceId: string) => void;
}) => {
  
  const handleDeletePress = () => {
    Alert.alert(
      "Delete Advice",
      "Are you sure you want to delete this saved advice?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => onDelete(advice.id) 
        }
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>{advice.text}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>Saved on {advice.date}</Text>
        
        <View style={styles.actionsContainer}>
            <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => onGoToChat(advice.chatId, advice.messageId)}
            >
                <Text style={styles.linkText}>Go to Chat</Text>
                <Icon name="arrow-right" size={14} color={COLORS.accent} style={{marginLeft: 4}}/>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.actionButton, { marginLeft: 15 }]} 
                onPress={handleDeletePress}
            >
                 <Icon name="trash-2" size={18} color={COLORS.danger} />
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ========================================================================
// --- SavedAdviceScreen Component ---
// ========================================================================
export const SavedAdviceScreen = ({
  onBack,
  savedAdvices, 
  onGoToChat, 
  onDeleteAdvice, // <-- ★★★ ADDED ★★★
}: SavedAdviceScreenProps) => {

  // --- SORTING LOGIC ---
  const sortedAdvices = useMemo(() => {
    return [...savedAdvices].sort((a, b) => {
      // Convert "Nov 12, 2025" to timestamp
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      // Descending order (Newest first)
      return dateB - dateA;
    });
  }, [savedAdvices]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={COLORS.accent} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Advice</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* --- Info Box --- */}
        <View style={styles.infoBox}>
          <Icon
            name="bookmark"
            size={20}
            color={COLORS.accent}
            style={{ marginRight: 15 }}
          />
          <Text style={styles.infoText}>
            Here are all the helpful tips and advice you've saved with Beruang.
          </Text>
        </View>

        {/* --- ★★★ MODIFIED List Rendering ★★★ --- */}
        {sortedAdvices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="bookmark" size={40} color={COLORS.darkGray} />
            <Text style={styles.emptyText}>
              You haven't saved any advice yet.
            </Text>
            <Text style={styles.emptySubText}>
              Long-press a message from the Beruang Assistant to save it here.
            </Text>
          </View>
        ) : (
          sortedAdvices.map((advice) => (
            <AdviceCard
              key={advice.id}
              advice={advice}
              onGoToChat={onGoToChat}
              onDelete={onDeleteAdvice}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles for SavedAdviceScreen ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white, 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  scrollContainer: {
    padding: 20,
  },
  infoBox: {
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    color: COLORS.accent,
    fontSize: 15,
    lineHeight: 22,
  },
  // --- Card Styles ---
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  bubble: {
    backgroundColor: COLORS.primary, 
    borderRadius: 15,
    borderBottomLeftRadius: 0, 
    padding: 15,
    alignSelf: 'flex-start', 
    maxWidth: '100%',
  },
  bubbleText: {
    fontSize: 15,
    color: COLORS.accent,
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 5,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  linkText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  // --- NEW: Styles for the empty state ---
  emptyContainer: {
    marginTop: 50,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 5,
    textAlign: 'center',
  },
});