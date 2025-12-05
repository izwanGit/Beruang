// src/screens/ChatbotScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Alert,
  Clipboard,
  ScrollView,
  Dimensions,
  Modal, 
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS } from '../constants/colors';

import { RouteProp } from '@react-navigation/native';
import {
  RootStackParamList,
  User,
  Transaction,
  Message,
  ChatSession,
} from '../../App';

type ChatbotScreenRouteProp = RouteProp<RootStackParamList, 'Chatbot'>;

type ChatbotScreenProps = {
  onBack: () => void;
  chatSessions: ChatSession[];
  currentChatMessages: Message[];
  currentChatId: string | null;
  userProfile: User;
  transactions: Transaction[];
  onSetCurrentChatId: (id: string | null) => void;
  onCreateNewChat: (prefillMessage?: string) => Promise<string | undefined>;
  onSendMessage: (text: string, chatId: string | null, isPrefill?: boolean) => Promise<void>;
  onSaveAdvice: (text: string, chatId: string, messageId: string) => void;
  onDeleteChatSession: (chatId: string) => void; 
  onEditMessage: (chatId: string, messageId: string, newText: string) => void; 
  route: ChatbotScreenRouteProp;
  streamingMessage: string; // <--- NEW PROP
};

const ChatHistoryDropdown = ({
  sessions,
  onSetChat,
  onCreateNew,
  onClose,
  onDeleteChat,
}: {
  sessions: ChatSession[];
  onSetChat: (id: string) => void;
  onCreateNew: () => void;
  onClose: () => void;
  onDeleteChat: (id: string) => void;
}) => {
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});

  const handleDeletePress = (id: string, title: string) => {
    swipeableRefs.current[id]?.close();
    
    Alert.alert(
      `Delete "${title}"?`,
      'Are you sure you want to permanently delete this chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            onDeleteChat(id);
          } 
        },
      ],
      { cancelable: true }
    );
  };

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>, id: string, title: string) => {
    const trans = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });
    return (
      <TouchableOpacity 
        style={dropdownStyles.deleteButton} 
        onPress={() => handleDeletePress(id, title)}
      >
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Icon name="trash-2" size={20} color={COLORS.white} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      transparent={true}
      visible={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={dropdownStyles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={dropdownStyles.container} onStartShouldSetResponder={() => true}>
          <Text style={dropdownStyles.dropdownTitle}>Chat History</Text>
          <ScrollView style={dropdownStyles.scroll}>
            {(sessions || []).map((item, index) => (
              <Swipeable
                key={item.id}
                ref={(ref) => (swipeableRefs.current[item.id] = ref)}
                renderRightActions={(progress, dragX) => 
                  renderRightActions(progress, dragX, item.id, item.title)
                }
                overshootRight={false}
              >
                <TouchableOpacity
                  style={[
                    dropdownStyles.chatItem,
                    index === (sessions || []).length - 1 && { borderBottomWidth: 0 } 
                  ]}
                  onPress={() => onSetChat(item.id)}
                >
                  <Icon name="message-square" size={18} color={COLORS.accent} style={{ marginRight: 12 }} />
                  <Text style={dropdownStyles.chatTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              </Swipeable>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={dropdownStyles.newChatButton}
            onPress={onCreateNew}
          >
            <Icon name="plus" size={20} color={COLORS.accent} />
            <Text style={dropdownStyles.newChatText}>New Chat</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export const ChatbotScreen = (props: ChatbotScreenProps) => {
  const {
    route,
    onBack,
    onSetCurrentChatId,
    onCreateNewChat,
    currentChatId,
    chatSessions,
    currentChatMessages,
    onSendMessage,
    onSaveAdvice,
    onDeleteChatSession, 
    onEditMessage,
    streamingMessage, // <--- Destructure new prop
  } = props;

  const [input, setInput] = useState(''); 
  const [isTyping, setIsTyping] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false); 
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null); 
  const [editText, setEditText] = useState(''); 
  const [cursorVisible, setCursorVisible] = useState(true); // NEW: For blinking cursor
  const flatListRef = useRef<FlatList>(null);
  
  const lastMessageCountRef = useRef(currentChatMessages.length);
  const isEditingRef = useRef(false); 

  useEffect(() => {
    const prefillMessage = route.params?.prefillMessage;
    const linkedChatId = route.params?.chatId;
    const linkedMessageId = route.params?.messageId;
    
    const sessions = chatSessions || [];

    if (prefillMessage && !linkedChatId) {
      const createAndNavigate = async () => {
        await onCreateNewChat(prefillMessage);
      };
      createAndNavigate();
    } else if (linkedChatId) {
      onSetCurrentChatId(linkedChatId); 
      if (linkedMessageId) {
        setHighlightMessageId(linkedMessageId); 
      }
    } else if (!currentChatId && sessions.length === 0) {
      onCreateNewChat();
    } else if (!currentChatId && sessions.length > 0) {
      onSetCurrentChatId(sessions[0].id);
    }
  }, [route.params, chatSessions, currentChatId]); 

  useEffect(() => {
    if (editingMessage) {
      setEditText(editingMessage.text); 
    } else {
      setEditText(''); 
    }
  }, [editingMessage]);

  const handleSend = async () => {
    if (input.trim().length === 0 || !currentChatId) return;
    const textToSend = input;
    Keyboard.dismiss();
    setInput('');
    setIsTyping(true);
    await onSendMessage(textToSend, currentChatId);
  };

  const handleConfirmEdit = async () => {
    if (!editingMessage || !currentChatId || editText.trim().length === 0) return;

    const { id, text: oldText } = editingMessage;
    const newText = editText.trim();

    Keyboard.dismiss();
    setEditingMessage(null);
    setEditText('');
    
    if (newText !== oldText) {
      setIsTyping(true);
      isEditingRef.current = true;
      lastMessageCountRef.current = currentChatMessages.length;
      await onEditMessage(currentChatId, id, newText);
    }
  };

  const handleCreateNew = () => {
    onCreateNewChat();
    setIsHistoryVisible(false);
  };

  const handleSetChat = (id: string) => {
    onSetCurrentChatId(id);
    setIsHistoryVisible(false);
  };

  // --- UPDATED TYPING LOGIC FOR STREAMING ---
  useEffect(() => {
    // 1. If we have a streaming message, we are definitely typing
    if (streamingMessage) {
      setIsTyping(true);
      // Auto-scroll to bottom while streaming
      flatListRef.current?.scrollToEnd({ animated: true });
    } 
    // 2. If no streaming message, check if a new REAL message arrived
    else if (currentChatMessages.length > 0) {
      const lastMessage = currentChatMessages[currentChatMessages.length - 1];
      
      // If the last message is from bot and is new (count increased), stop typing
      if (lastMessage.sender === 'bot' && currentChatMessages.length > lastMessageCountRef.current) {
        setIsTyping(false);
        isEditingRef.current = false;
      }
      
      lastMessageCountRef.current = currentChatMessages.length;
    }
  }, [currentChatMessages, streamingMessage]);

  useEffect(() => {
    if (currentChatMessages.length > 0 && !editingMessage) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [currentChatMessages, editingMessage]);

  useEffect(() => {
    if (highlightMessageId && currentChatMessages.length > 0) {
      const index = currentChatMessages.findIndex(m => m.id === highlightMessageId);
      if (index > -1) {
        flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
        const timer = setTimeout(() => {
          setHighlightMessageId(null);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightMessageId, currentChatMessages]);

  // --- NEW: Blinking cursor effect ---
  useEffect(() => {
    if (streamingMessage && isTyping) {
      const interval = setInterval(() => {
        setCursorVisible((prev) => !prev);
      }, 500); // Blink every 500ms
      return () => clearInterval(interval);
    } else {
      setCursorVisible(true); // Reset when not streaming
    }
  }, [streamingMessage, isTyping]);

  const chatTitle =
    (chatSessions || []).find((s) => s.id === currentChatId)?.title || 'New Chat';
  
  const lastUserMessage = [...currentChatMessages].filter(m => m.sender === 'user').pop();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Icon name="arrow-left" size={24} color={COLORS.accent} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {chatTitle}
        </Text>
        <TouchableOpacity 
          onPress={() => setIsHistoryVisible(true)} 
          style={styles.headerButton}
        >
          <Icon name="list" size={24} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 65 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={currentChatMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item, index }) => {
            const isLastUserMessage = item.sender === 'user' && item.id === lastUserMessage?.id;
            const isEditing = editingMessage?.id === item.id;

            return (
              <View style={{ marginBottom: 10 }}>
                {isEditing ? (
                  <View style={[styles.messageBubble, styles.userBubble]}>
                    <TextInput
                      style={[styles.userMessageText, styles.inlineEditInput]}
                      value={editText}
                      onChangeText={setEditText}
                      autoFocus={true}
                      multiline
                    />
                    <View style={styles.inlineEditActions}>
                      <TouchableOpacity
                        style={[styles.inlineEditButton, { backgroundColor: COLORS.darkGray }]}
                        onPress={() => setEditingMessage(null)}
                      >
                        <Icon name="x" size={16} color={COLORS.white} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.inlineEditButton, { backgroundColor: COLORS.success }]}
                        onPress={handleConfirmEdit}
                      >
                        <Icon name="check" size={16} color={COLORS.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.messageBubble,
                      item.sender === 'user' ? styles.userBubble : styles.botBubble,
                      item.id === highlightMessageId && styles.highlightedBubble,
                    ]}
                  >
                    <Text style={item.sender === 'user' ? styles.userMessageText : styles.botMessageText}>
                      {item.text}
                    </Text>
                  </View>
                )}

                {!isEditing && (
                  <View style={[
                    styles.actionBar,
                    item.sender === 'user' ? styles.userActionBar : styles.botActionBar
                  ]}>
                    {item.sender === 'bot' && (
                      <>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => onSaveAdvice(item.text, currentChatId!, item.id)}
                        >
                          <Icon name="bookmark" size={16} color={COLORS.darkGray} />
                          <Text style={styles.actionText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => Clipboard.setString(item.text)}
                        >
                          <Icon name="copy" size={16} color={COLORS.darkGray} />
                          <Text style={styles.actionText}>Copy</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {item.sender === 'user' && (
                      <>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => Clipboard.setString(item.text)}
                        >
                          <Icon name="copy" size={16} color={COLORS.darkGray} />
                          <Text style={styles.actionText}>Copy</Text>
                        </TouchableOpacity>
                        {isLastUserMessage && !isTyping && ( 
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => setEditingMessage(item)}
                          >
                            <Icon name="edit-2" size={16} color={COLORS.darkGray} />
                            <Text style={styles.actionText}>Edit</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          }}
          // --- UPDATED FOOTER TO SHOW STREAMING WITH BLINKING CURSOR ---
          ListFooterComponent={
            isTyping ? (
              <View style={{ marginBottom: 10 }}>
                {streamingMessage ? (
                   // Show streaming text bubble with blinking cursor
                   <View style={[styles.messageBubble, styles.botBubble]}>
                     <Text style={styles.botMessageText}>
                       {streamingMessage}
                       {cursorVisible && <Text style={{color: COLORS.accent}}> |</Text>}
                     </Text>
                   </View>
                ) : (
                   // Show loading spinner (connecting...)
                   <View style={[styles.messageBubble, styles.botBubble]}>
                     <ActivityIndicator size="small" color={COLORS.accent} />
                   </View>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isTyping ? ( 
              <View style={styles.emptyContainer}>
                <Icon name="message-square" size={60} color={COLORS.darkGray} />
                <Text style={styles.emptyText}>Start a conversation</Text>
                <Text style={styles.emptySubtext}>
                  Ask me about your budget, savings, or spending habits.
                </Text>
              </View>
            ) : null
          }
        />

        {!editingMessage && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask a financial question..."
              placeholderTextColor={COLORS.darkGray}
              editable={!isTyping && !!currentChatId}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (isTyping || !currentChatId) && { opacity: 0.5 },
              ]}
              onPress={handleSend}
              disabled={isTyping || !currentChatId}
            >
              <Icon name="send" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {isHistoryVisible && (
        <ChatHistoryDropdown
          sessions={chatSessions} 
          onSetChat={handleSetChat}
          onCreateNew={handleCreateNew}
          onClose={() => setIsHistoryVisible(false)}
          onDeleteChat={onDeleteChatSession} 
        />
      )}
    </SafeAreaView>
  );
};

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
    height: 65,
  },
  headerButton: {
    padding: 5,
    width: 40,
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  messageList: {
    flexGrow: 1, 
    padding: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 15,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent', 
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
  highlightedBubble: {
    borderColor: COLORS.info,
    shadowColor: COLORS.info,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  userMessageText: {
    color: COLORS.white,
    fontSize: 16,
  },
  botMessageText: {
    color: COLORS.accent,
    fontSize: 16,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    opacity: 0.8, 
    maxWidth: '80%',
  },
  botActionBar: {
    alignSelf: 'flex-start',
    paddingLeft: 15,
  },
  userActionBar: {
    alignSelf: 'flex-end',
    paddingRight: 15,
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 15,
    backgroundColor: COLORS.lightGray,
    marginLeft: 8,
  },
  actionText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 5,
    fontWeight: '600',
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
  cancelEditButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: Dimensions.get('window').height * 0.2,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: 5,
  },
  inlineEditInput: {
    padding: 0,
    margin: 0,
    color: COLORS.white,
    fontSize: 16,
  },
  inlineEditActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  inlineEditButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  }
});

const dropdownStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 10,
  },
  container: {
    position: 'absolute',
    top: 65, 
    right: 15,
    width: 300, 
    maxHeight: 400,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 20,
    borderTopWidth: 0,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.accent,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  scroll: {
    maxHeight: 280,
    paddingVertical: 5, 
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 15,
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.lightGray,
    marginHorizontal: 10, 
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 25,
    width: 80,
    flex: 1,
    marginTop: 5,
    marginBottom: 6,
    marginRight: 10,
    borderRadius: 10,
  },
  chatTitle: {
    fontSize: 15,
    color: COLORS.accent,
    fontWeight: '500', 
    flex: 1,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.lightGray,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  newChatText: {
    fontSize: 15,
    fontWeight: 'bold', 
    color: COLORS.accent,
    marginLeft: 10,
  },
});