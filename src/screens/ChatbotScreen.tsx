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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS } from '../constants/colors';

// --- NEW: Import navigation types ---
import { RouteProp } from '@react-navigation/native';
// Adjust this path if your App.tsx is in a different location
import { RootStackParamList } from '../../App'; 

// --- NEW: Define the route prop type ---
type ChatbotScreenRouteProp = RouteProp<RootStackParamList, 'Chatbot'>;

// --- MODIFIED: Update props type ---
type ChatbotScreenProps = {
  onBack: () => void;
  transactions: Array<any>;
  route: ChatbotScreenRouteProp; // <-- ADDED
};

export const ChatbotScreen = ({ onBack, transactions, route }: ChatbotScreenProps) => { // <-- Add route
  // --- NEW: Get the prefill message from route params ---
  const prefillMessage = route.params?.prefillMessage;

  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello! I'm the Beruang Assistant. Ask me about budgeting, savings, or your spending habits.",
      sender: 'bot',
    },
  ]);
  
  // --- MODIFIED: Set initial input state from prefillMessage ---
  const [input, setInput] = useState(prefillMessage || '');
  
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);

  const handleSend = async () => {
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
      const response = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          history: chatHistory,
          transactions: transactions,
        }),
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
          value={input} // <-- This will now show the pre-filled message
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