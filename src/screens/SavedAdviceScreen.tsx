// src/screens/SavedAdviceScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Advice } from '../../App';
import { COLORS } from '../constants/colors';
import Markdown from 'react-native-markdown-display';

const { width } = Dimensions.get('window');

type SavedAdviceScreenProps = {
  onBack: () => void;
  savedAdvices: Advice[];
  onGoToChat: (chatId: string, messageId: string) => void;
  onDeleteAdvice: (adviceId: string) => void;
};

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
      "Remove Advice",
      "Are you sure you want to remove this memory?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => onDelete(advice.id) }
      ]
    );
  };

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.headerRow}>
        <View style={cardStyles.dateBadge}>
          <Icon name="clock" size={10} color={COLORS.accent} />
          <Text style={cardStyles.dateText}>{advice.date}</Text>
        </View>
        <TouchableOpacity onPress={handleDeletePress} style={cardStyles.deleteBtn}>
          <Icon name="trash-2" size={14} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <View style={cardStyles.contentWrapper}>
        <Markdown style={markdownStyles}>{advice.text}</Markdown>
      </View>

      <View style={cardStyles.footer}>
        <TouchableOpacity
          style={cardStyles.linkButton}
          onPress={() => onGoToChat(advice.chatId, advice.messageId)}
          activeOpacity={0.7}
        >
          <Text style={cardStyles.linkText}>See full session</Text>
          <Icon name="external-link" size={12} color={COLORS.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const SavedAdviceScreen = ({
  onBack,
  savedAdvices,
  onGoToChat,
  onDeleteAdvice,
}: SavedAdviceScreenProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAdvices = useMemo(() => {
    let result = [...savedAdvices];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(a => a.text.toLowerCase().includes(q) || a.date.toLowerCase().includes(q));
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [savedAdvices, searchQuery]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={COLORS.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Knowledge Base</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          stickyHeaderIndices={[1]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 50 }}
        >
          {/* Top Hero - Sage Green Focus - COMPACT VERSION */}
          <View style={styles.hero}>
            <View style={styles.heroContent}>
              <View style={styles.iconBox}>
                <Icon name="bookmark" size={20} color={COLORS.white} />
              </View>
              <View>
                <Text style={styles.heroLabel}>Preserved Wisdom</Text>
                <Text style={styles.heroCount}>{savedAdvices.length} saved items</Text>
              </View>
            </View>
          </View>

          {/* Minimal Search Bar */}
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Icon name="search" size={16} color={COLORS.accent} style={{ marginRight: 10, opacity: 0.5 }} />
              <TextInput
                placeholder="Find a saved tip..."
                placeholderTextColor={COLORS.accent + '50'}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="x-circle" size={16} color={COLORS.accent + '40'} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Advice List */}
          <View style={styles.listContainer}>
            {filteredAdvices.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyCircle}>
                  <Icon name="feather" size={40} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>Nothing here yet</Text>
                <Text style={styles.emptyText}>
                  {searchQuery ? "No matches found." : "Long-press helpful AI messages to save them here."}
                </Text>
              </View>
            ) : (
              filteredAdvices.map((advice) => (
                <AdviceCard
                  key={advice.id}
                  advice={advice}
                  onGoToChat={onGoToChat}
                  onDelete={onDeleteAdvice}
                />
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const markdownStyles: any = {
  body: {
    color: COLORS.accent,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  strong: {
    fontWeight: '800',
    color: COLORS.accent,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
  },
};

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primary, // SOLID SAGE GREEN AS REQUESTED
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 5,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accent,
    textTransform: 'uppercase',
  },
  deleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    backgroundColor: COLORS.primary + '30', // LIGHT GREEN BUBBLE
    padding: 14,
    borderRadius: 16,
    borderTopLeftRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  footer: {
    marginTop: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  linkText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accent,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.accent,
    letterSpacing: 0.5,
  },
  hero: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.accent, // DARK BROWN FOR BETTER CLARITY ON SAGE
  },
  heroCount: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
    opacity: 0.8,
  },
  searchSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.accent,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 20,
    fontWeight: '600',
  },
});