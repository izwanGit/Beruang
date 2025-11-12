// src/screens/ChatbotScreen.tsx
import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Alert, // <-- ADDED
  Clipboard, // <-- ADDED
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS } from '../constants/colors';

// --- Import navigation types ---
import { RouteProp } from '@react-navigation/native';
// Adjust this path if your App.tsx is in a different location
import { RootStackParamList, User, Transaction } from '../../App'; // <-- ★★★ MODIFIED ★★★

// --- Define the route prop type ---
type ChatbotScreenRouteProp = RouteProp<RootStackParamList, 'Chatbot'>;

// --- Props type ---
type ChatbotScreenProps = {
  onBack: () => void;
  transactions: Array<Transaction>; // <-- ★★★ MODIFIED (using Transaction type) ★★★
  userProfile: User; // <-- ★★★ ADDED ★★★
  route: ChatbotScreenRouteProp;
  onSaveAdvice: (messageText: string) => void;
};

export const ChatbotScreen = ({
  onBack,
  transactions,
  userProfile, // <-- ★★★ ADDED ★★★
  route,
  onSaveAdvice,
}: ChatbotScreenProps) => {
  const prefillMessage = route.params?.prefillMessage;

  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello! I'm the Beruang Assistant. Ask me about budgeting, savings, or your spending habits.",
      sender: 'bot',
    },
  ]);

  const [input, setInput] = useState(prefillMessage || '');

  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);

  const handleSend = async () => {
    // ... (This function is unchanged)
    if (input.trim().length === 0) return;
    const userMessage = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    setInput('');

    const chatHistory = messages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    try {
      // Call your local backend server's /chat endpoint
      const response = await fetch('http://192.168.0.8:3000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // --- ★★★ THIS IS THE CHANGE ★★★ ---
        body: JSON.stringify({
          message: input,
          history: chatHistory,
          transactions: transactions,
          userProfile: userProfile, // <-- We now send the user's profile
        }),
        // --- ★★★ END OF CHANGE ★★★ ---
      });

      if (!response.ok) {
        throw new Error('Server error');
      }

      const { message: botResponseText } = await response.json();
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: 'bot',
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Failed to get bot response:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I ran into an error. Please try again.',
        sender: 'bot',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // --- NEW: Function to show message options ---
  const showChatOptions = (messageText: string) => {
    Alert.alert(
      'Message Options', // Title
      'What would you like to do with this message?', // Message
      [
        // Button Array
        {
          text: 'Save Advice',
          onPress: () => onSaveAdvice(messageText), // This calls the function from App.tsx
          style: 'default',
        },
        {
          text: 'Copy Text',
          onPress: () => Clipboard.setString(messageText),
          style: 'default',
        },
        {
          text: 'Cancel',
          onPress: () => {}, // Does nothing
          style: 'cancel', // This makes it the "cancel" button
        },
      ],
      { cancelable: true } // Allows tapping outside to dismiss on Android
    );
  };

  return (
    <SafeAreaView style={chatbotStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={chatbotStyles.header}>
        <TouchableOpacity onPress={onBack} style={chatbotStyles.backButton}>
          <Icon name="arrow-left" size={24} color={COLORS.accent} />
        </TouchableOpacity>
        <Text style={chatbotStyles.headerTitle}>Beruang Assistant</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={chatbotStyles.messageList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <TouchableOpacity
            // --- MODIFIED: onLongPress now calls showChatOptions ---
            onLongPress={() => {
              if (item.sender === 'bot') {
                showChatOptions(item.text);
              }
            }}
            disabled={item.sender !== 'bot'}
            activeOpacity={0.8}
          >
            <View
              style={[
                chatbotStyles.messageBubble,
                item.sender === 'user'
                  ? chatbotStyles.userBubble
                  : chatbotStyles.botBubble,
              ]}
            >
              <Text
                style={
                  item.sender === 'user'
                    ? chatbotStyles.userMessageText
                    : chatbotStyles.botMessageText
                }
              >
                {item.text}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          isTyping ? (
            <View style={[chatbotStyles.messageBubble, chatbotStyles.botBubble]}>
              <ActivityIndicator size="small" color={COLORS.accent} />
            </View>
          ) : null
        }
      />
      <View style={chatbotStyles.inputContainer}>
        <TextInput
          style={chatbotStyles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask a financial question..."
          placeholderTextColor={COLORS.darkGray}
          editable={!isTyping}
        />
        <TouchableOpacity
          style={[chatbotStyles.sendButton, isTyping && { opacity: 0.5 }]}
          onPress={handleSend}
          disabled={isTyping}
        >
          <Icon name="send" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// --- Styles for ChatbotScreen ---
// (Styles remain unchanged)
const chatbotStyles = StyleSheet.create({
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
  messageList: {
    padding: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
  },
  userBubble: {
    backgroundColor: COLORS.accent,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  botBubble: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  userMessageText: {
    color: COLORS.white,
    fontSize: 16,
  },
  botMessageText: {
    color: COLORS.accent,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: COLORS.lightGray,
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    color: COLORS.accent,
  },
  sendButton: {
    marginLeft: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
});