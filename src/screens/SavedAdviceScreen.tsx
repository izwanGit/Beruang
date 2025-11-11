// src/screens/SavedAdviceScreen.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// --- Inlined COLORS constant ---
const COLORS = {
  primary: '#C8DBBE',
  secondary: '#9F8772',
  accent: '#665A48',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  darkGray: '#A9A9A9',
  success: '#4CAF50',
  danger: '#F44336',
  info: '#2196F3',
  yellow: '#FFD700',
};

// --- Types ---
// Define the shape of an advice object
type Advice = {
  id: string;
  text: string;
  date: string;
};

type RootStackParamList = {
  SavedAdvice: undefined;
};

// --- MODIFIED: Update props to accept savedAdvices ---
type SavedAdviceScreenProps = {
  onBack: () => void;
  savedAdvices: Advice[]; // <-- ADDED
};

// --- A component for the saved chat bubble card ---
const AdviceCard = ({ text, date }: { text: string; date: string }) => (
  <View style={styles.card}>
    <View style={styles.bubble}>
      <Text style={styles.bubbleText}>{text}</Text>
    </View>
    <View style={styles.cardFooter}>
      <Text style={styles.dateText}>Saved on {date}</Text>
      <TouchableOpacity>
        {/* This button doesn't do anything yet, but we'll leave it */}
        <Text style={styles.linkText}>Go to Chat</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ========================================================================
// --- SavedAdviceScreen Component ---
// ========================================================================
export const SavedAdviceScreen = ({
  onBack,
  savedAdvices, // <-- Destructure new prop
}: SavedAdviceScreenProps) => {
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

        {/* --- MODIFIED: Dynamic list based on props --- */}
        {savedAdvices.length === 0 ? (
          // --- Show this if the list is empty ---
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
          // --- Render the list if it has items ---
          savedAdvices.map((advice) => (
            <AdviceCard
              key={advice.id}
              text={advice.text}
              date={advice.date}
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
    backgroundColor: COLORS.white, // Use white for the page background
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
    backgroundColor: COLORS.primary, // Using the theme's light green
    borderRadius: 15,
    borderBottomLeftRadius: 0, // Chat bubble shape
    padding: 15,
    alignSelf: 'flex-start', // Make it hug the text
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

// ========================================================================
// --- Preview App Wrapper ---
// (This makes the file runnable in the preview)
// ========================================================================

const Stack = createNativeStackNavigator<RootStackParamList>();

// --- MODIFIED: Mock the props for the preview ---
const App = () => {
  // Mock data for the preview
  const mockAdvices: Advice[] = [
    {
      id: '1',
      text: "A good rule of thumb is the 50/30/20 budget: 50% for Needs, 30% for Wants, and 20% for Savings. Based on your income, that's RM 1750 for Needs.",
      date: 'Oct 28, 2025',
    },
    {
      id: '2',
      text: "You've spent RM 218 on 'Food & Beverage' this month, which is 25% over your 'Wants' budget. Try looking for cheaper lunch options.",
      date: 'Oct 27, 2025',
    },
  ];

  // Set to [] to test the empty state
  const [advices, setAdvices] = React.useState(mockAdvices);
  // const [advices, setAdvices] = React.useState<Advice[]>([]); // <-- Uncomment to test empty state

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SavedAdvice">
          {({ navigation }) => (
            <SavedAdviceScreen
              onBack={() => alert('Go Back')}
              savedAdvices={advices} // Pass the mock data
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;