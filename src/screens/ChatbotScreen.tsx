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
  Image,
  ImageBackground,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS } from '../constants/colors';

import { RouteProp } from '@react-navigation/native';
import { Screen } from './HomeScreen';
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

  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.spring(animation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, []);

  const handleClose = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const containerStyle = {
    opacity: animation,
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, 0],
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
    <Modal
      transparent={true}
      visible={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={dropdownStyles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <Animated.View style={[dropdownStyles.container, containerStyle]} onStartShouldSetResponder={() => true}>
          <View style={dropdownStyles.header}>
            <Text style={dropdownStyles.dropdownTitle}>History</Text>
            <TouchableOpacity onPress={handleClose}>
              <Icon name="x" size={20} color={COLORS.darkGray} />
            </TouchableOpacity>
          </View>

          <ScrollView style={dropdownStyles.scroll} showsVerticalScrollIndicator={false}>
            {(sessions || []).length === 0 ? (
              <View style={dropdownStyles.emptyHistory}>
                <Text style={dropdownStyles.emptyHistoryText}>No past conversations</Text>
              </View>
            ) : (
              (sessions || []).map((item, index) => (
                <Swipeable
                  key={item.id}
                  ref={(ref) => { swipeableRefs.current[item.id] = ref; }}
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
                    <View style={dropdownStyles.chatIconCircle}>
                      <Icon name="message-circle" size={14} color={COLORS.accent} />
                    </View>
                    <Text style={dropdownStyles.chatTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Icon name="chevron-right" size={16} color="#DDD" />
                  </TouchableOpacity>
                </Swipeable>
              ))
            )}
          </ScrollView>

          <View style={dropdownStyles.footer}>
            <TouchableOpacity
              style={dropdownStyles.newChatButton}
              onPress={onCreateNew}
            >
              <Icon name="plus-circle" size={18} color={COLORS.white} />
              <Text style={dropdownStyles.newChatText}>Start New Chat</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
  const [cursorVisible, setCursorVisible] = useState(true);
  const quickSuggestions = [
    "Check my balance",
    "Any saving tips?",
    "Recent expenses?",
    "Am I overspending?",
    "Budget advice"
  ];
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
    <View style={styles.container}>
      <SafeAreaView style={styles.safeAreaContent} edges={['top', 'left', 'right', 'bottom']}>
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
            <Icon name="clock" size={22} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ImageBackground
            source={require('../../assets/wallpaper.png')}
            style={styles.chatBackground}
            imageStyle={styles.chatWallpaperStyle}
            resizeMode="repeat"
          >
            <FlatList
              ref={flatListRef}
              data={currentChatMessages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isLastUserMessage = item.sender === 'user' && item.id === lastUserMessage?.id;
                const isEditing = editingMessage?.id === item.id;

                return (
                  <View style={styles.messageWrapper}>
                    {isEditing ? (
                      <View style={[styles.messageBubble, styles.userBubble, styles.editingBubble]}>
                        <TextInput
                          style={[styles.userMessageText, styles.inlineEditInput]}
                          value={editText}
                          onChangeText={setEditText}
                          autoFocus={true}
                          multiline
                        />
                        <View style={styles.inlineEditActions}>
                          <TouchableOpacity
                            style={[styles.inlineEditButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                            onPress={() => setEditingMessage(null)}
                          >
                            <Icon name="x" size={16} color={COLORS.white} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.inlineEditButton, { backgroundColor: COLORS.white }]}
                            onPress={handleConfirmEdit}
                          >
                            <Icon name="check" size={16} color={COLORS.accent} />
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
                          <View style={styles.actionGroup}>
                            <TouchableOpacity
                              style={styles.miniActionButton}
                              onPress={() => onSaveAdvice(item.text, currentChatId!, item.id)}
                            >
                              <Icon name="bookmark" size={14} color={COLORS.darkGray} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.miniActionButton}
                              onPress={() => Clipboard.setString(item.text)}
                            >
                              <Icon name="copy" size={14} color={COLORS.darkGray} />
                            </TouchableOpacity>
                          </View>
                        )}

                        {item.sender === 'user' && (
                          <View style={styles.actionGroup}>
                            <TouchableOpacity
                              style={styles.miniActionButton}
                              onPress={() => Clipboard.setString(item.text)}
                            >
                              <Icon name="copy" size={14} color={COLORS.darkGray} />
                            </TouchableOpacity>
                            {isLastUserMessage && !isTyping && (
                              <TouchableOpacity
                                style={styles.miniActionButton}
                                onPress={() => setEditingMessage(item)}
                              >
                                <Icon name="edit-3" size={14} color={COLORS.darkGray} />
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              }}
              ListFooterComponent={
                isTyping ? (
                  <View style={styles.messageWrapper}>
                    {streamingMessage ? (
                      <View style={[styles.messageBubble, styles.botBubble, styles.streamingBubble]}>
                        <Text style={styles.botMessageText}>
                          {streamingMessage}
                          {cursorVisible && <Text style={{ color: COLORS.accent, fontWeight: 'bold' }}>|</Text>}
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
                        <ActivityIndicator size="small" color={COLORS.accent} />
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={{ height: 20 }} />
                )
              }
              ListEmptyComponent={
                !isTyping ? (
                  <View style={styles.emptyContainer}>
                    <Image
                      source={require('../../assets/chatbot_mascot.png')}
                      style={styles.emptyMascot}
                      resizeMode="contain"
                    />
                    <Text style={styles.emptyText}>Beruang AI Assistant</Text>
                    <Text style={styles.emptySubtext}>
                      Ask me anything about your finances. I'm here to help you save and manage your money better.
                    </Text>
                  </View>
                ) : null
              }
            />

            {!editingMessage && (
              <View style={styles.inputWrapper}>
                {!input.trim() && !isTyping && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.suggestionsScroll}
                    contentContainerStyle={styles.suggestionsContent}
                  >
                    {quickSuggestions.map((text, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.suggestionBubble}
                        onPress={() => setInput(text)}
                      >
                        <Text style={styles.suggestionText}>{text}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Type your message..."
                    placeholderTextColor={COLORS.darkGray}
                    editable={!isTyping && !!currentChatId}
                    multiline
                  />
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      (!input.trim() || isTyping || !currentChatId) && styles.sendButtonDisabled,
                    ]}
                    onPress={handleSend}
                    disabled={!input.trim() || isTyping || !currentChatId}
                  >
                    <Icon name="send" size={20} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ImageBackground>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  safeAreaContent: {
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    zIndex: 10,
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
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.accent,
    marginHorizontal: 10,
    letterSpacing: 0.5,
  },
  chatBackground: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  chatWallpaperStyle: {
    opacity: 0.08, // Super low opacity for subtle doodle effect
  },
  messageList: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 20,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  userBubble: {
    backgroundColor: COLORS.accent,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  editingBubble: {
    width: '85%',
  },
  typingBubble: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamingBubble: {
    maxWidth: '85%',
  },
  highlightedBubble: {
    borderWidth: 2,
    borderColor: COLORS.info,
  },
  userMessageText: {
    color: COLORS.white,
    fontSize: 15,
    lineHeight: 22,
  },
  botMessageText: {
    color: COLORS.accent,
    fontSize: 15,
    lineHeight: 22,
  },
  actionBar: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  botActionBar: {
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
  userActionBar: {
    alignSelf: 'flex-end',
    marginRight: 4,
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  miniActionButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  inputWrapper: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent to show wallpaper
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F5F7F8',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E8EDF0',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 15,
    color: COLORS.accent,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  emptyMascot: {
    width: 200,
    height: 200,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 15,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  inlineEditInput: {
    minHeight: 40,
    textAlignVertical: 'top',
  },
  inlineEditActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 10,
  },
  inlineEditButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsScroll: {
    marginBottom: 12,
  },
  suggestionsContent: {
    paddingHorizontal: 5,
    gap: 8,
  },
  suggestionBubble: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    borderWidth: 1,
    borderColor: '#E1E4E8',
  },
  suggestionText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
  },
});

const dropdownStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 10,
  },
  container: {
    position: 'absolute',
    top: 85,
    right: 15,
    width: 280,
    maxHeight: 450,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.accent,
  },
  scroll: {
    maxHeight: 300,
  },
  emptyHistory: {
    padding: 30,
    alignItems: 'center',
  },
  emptyHistoryText: {
    color: COLORS.darkGray,
    fontSize: 14,
    fontWeight: '500',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9F9F9',
  },
  chatIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '30', // 30% opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatTitle: {
    fontSize: 15,
    color: COLORS.accent,
    fontWeight: '600',
    flex: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    gap: 10,
    elevation: 2,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  newChatText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    marginVertical: 4,
    marginRight: 8,
    borderRadius: 12,
  },
});