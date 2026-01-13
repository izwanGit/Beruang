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
  TouchableWithoutFeedback,
  Linking,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Markdown from 'react-native-markdown-display';
import { COLORS } from '../constants/colors';
import { SmartWidget } from '../components/SmartWidget';

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
  streamingMessage: string;
  isBotThinking?: boolean; // New prop for loading state
  thinkingMessage?: string; // Specific message for thinking state
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

          <ScrollView style={dropdownStyles.scroll} showsVerticalScrollIndicator={true}>
            {(sessions || [])
              .filter(s => s.title !== 'New Chat')
              .length === 0 ? (
              <View style={dropdownStyles.emptyHistory}>
                <Text style={dropdownStyles.emptyHistoryText}>No past conversations</Text>
              </View>
            ) : (
              (sessions || [])
                .filter(s => s.title !== 'New Chat')
                .map((item, index) => (
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
    streamingMessage,
    isBotThinking,
    thinkingMessage,
  } = props;

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
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
  const hasInitializedRef = useRef(false);
  const lastConsumedPrefillRef = useRef<string | undefined>(undefined);
  const lastConsumedLinkedChatIdRef = useRef<string | undefined>(undefined);
  const titleTapCountRef = useRef(0);
  const titleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Secret feature: Triple-tap chat title to copy entire conversation
  const handleTitleTripleTap = () => {
    titleTapCountRef.current += 1;

    if (titleTapTimeoutRef.current) {
      clearTimeout(titleTapTimeoutRef.current);
    }

    if (titleTapCountRef.current >= 3) {
      // Export conversation
      titleTapCountRef.current = 0;

      if (currentChatMessages.length === 0) {
        Alert.alert('No Messages', 'This chat is empty.');
        return;
      }

      const exportData = currentChatMessages.map((msg, index) => {
        return `[${msg.sender.toUpperCase()}] ${msg.text}`;
      }).join('\n\n---\n\n');

      const fullExport = `=== CHAT EXPORT: ${chatTitle} ===\nDate: ${new Date().toISOString()}\nMessages: ${currentChatMessages.length}\n\n${exportData}\n\n=== END EXPORT ===`;

      Clipboard.setString(fullExport);
      Alert.alert('Copied!', `${currentChatMessages.length} messages copied to clipboard.`);
    } else {
      titleTapTimeoutRef.current = setTimeout(() => {
        titleTapCountRef.current = 0;
      }, 500);
    }
  };

  useEffect(() => {
    const prefillMessage = route.params?.prefillMessage;
    const linkedChatId = route.params?.chatId;
    const linkedMessageId = route.params?.messageId;

    const sessions = chatSessions || [];

    // 1. Handle Prefill
    if (prefillMessage && !linkedChatId && lastConsumedPrefillRef.current !== prefillMessage) {
      lastConsumedPrefillRef.current = prefillMessage;
      const createAndNavigate = async () => {
        await onCreateNewChat(prefillMessage);
        hasInitializedRef.current = true;
      };
      createAndNavigate();
      return;
    }

    // 2. Handle Linked Chat
    if (linkedChatId && lastConsumedLinkedChatIdRef.current !== linkedChatId) {
      const exists = sessions.find(s => s.id === linkedChatId);

      // If we are just initializing, we might not have sessions yet, so we trust the ID.
      // But if we are already initialized and it's missing, we skip.
      if (exists || !hasInitializedRef.current || sessions.length === 0) {
        lastConsumedLinkedChatIdRef.current = linkedChatId;

        if (currentChatId !== linkedChatId) {
          lastConsumedPrefillRef.current = undefined;
          onSetCurrentChatId(linkedChatId);
        }
        if (linkedMessageId) {
          setHighlightMessageId(linkedMessageId);
        }
        hasInitializedRef.current = true;
        return;
      }
    }

    // 3. Restoration / Default Selection (Only if current is invalid/null)
    if ((!currentChatId || !sessions.find(s => s.id === currentChatId)) && sessions.length > 0) {
      const targetId = sessions[0].id;
      if (currentChatId !== targetId) {
        onSetCurrentChatId(targetId);
      }
      hasInitializedRef.current = true;
    } else if (!currentChatId && sessions.length === 0 && !hasInitializedRef.current) {
      // Only auto-create on FIRST load if empty. 
      onCreateNewChat();
      hasInitializedRef.current = true;
    }

    // Mark initialized if we have data or sessions are effectively empty
    if (chatSessions !== undefined) {
      hasInitializedRef.current = true;
    }
  }, [route.params?.prefillMessage, route.params?.chatId, route.params?.messageId, chatSessions?.length, currentChatId]);

  useEffect(() => {
    if (editingMessage) {
      setEditText(editingMessage.text);
      // Scroll to the editing message so keyboard doesn't cover it
      const index = currentChatMessages.findIndex(m => m.id === editingMessage.id);
      if (index > -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.3 // Position it in upper third of screen
          });
        }, 150); // Small delay to let keyboard animation start
      }
    } else {
      setEditText('');
    }
  }, [editingMessage, currentChatMessages]);

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
    setIsHistoryVisible(false);
    // Use setTimeout instead of InteractionManager to bypass deprecation warnings
    setTimeout(() => {
      onCreateNewChat();
    }, 0);
  };

  const handleSetChat = (id: string) => {
    setIsHistoryVisible(false);
    setTimeout(() => {
      onSetCurrentChatId(id);
    }, 0);
  };

  // --- STATE RESET ON CHAT SWITCH ---
  useEffect(() => {
    setIsTyping(false);
    setEditText('');
    setEditingMessage(null);
    setIsHistoryVisible(false);
    isEditingRef.current = false;
    initialScrollDoneRef.current = false; // Reset for new chat
  }, [currentChatId]);

  // --- UPDATED TYPING LOGIC FOR STREAMING ---
  useEffect(() => {
    // 1. If we have a streaming message or bot is thinking (edit/start), we are typing
    if (streamingMessage || isBotThinking) {
      setIsTyping(true);
      // Wait, if it is just "thinking" (no stream yet), we want isTyping true to show dots.
      // And scroll to bottom
      if (flatListRef.current && currentChatMessages.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }
    // 2. If no streaming message, check if a new REAL message arrived
    else if (currentChatMessages.length > 0) {
      const lastMessage = currentChatMessages[currentChatMessages.length - 1];

      // If the last message is from bot, we assume response is done.
      // FIX: Only turn off typing if:
      // 1. We are NOT editing (normal flow)
      // 2. OR We ARE editing, but this is a NEW message (length increased), implying the new response arrived.
      const isNewMessage = currentChatMessages.length > lastMessageCountRef.current;

      if (lastMessage.sender === 'bot') {
        if (!isEditingRef.current || isNewMessage) {
          setIsTyping(false);
          isEditingRef.current = false;
        }
      }

      lastMessageCountRef.current = currentChatMessages.length;
    }
  }, [currentChatMessages, streamingMessage, isBotThinking]);

  const initialScrollDoneRef = useRef(false);

  useEffect(() => {
    // Only auto-scroll for NEW messages (after the initial load is done)
    if (initialScrollDoneRef.current && currentChatMessages.length > 0 && !editingMessage) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [currentChatMessages.length, editingMessage]);

  useEffect(() => {
    if (highlightMessageId && currentChatMessages.length > 0) {
      const index = currentChatMessages.findIndex(m => m.id === highlightMessageId);
      if (index > -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
        }, 100);
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

  // Fix for React 19 "key" spread error AND iOS citation badge styling
  const markdownRules = {
    image: (node: any, children: any, parent: any, styles: any) => {
      return (
        <Image
          key={node.key}
          source={{ uri: node.attributes.src }}
          style={styles.image}
        />
      );
    },
    link: (node: any, children: any, parent: any, styles: any) => {
      // Safely extract text content from the AST node
      let content = node.children && node.children.length > 0
        ? node.children[0].content
        : '';

      // Remove ALL non-digit characters to handle "web:10", "[1]", etc.
      // This ensures we only show the number inside the small badge.
      content = content.replace(/\D/g, '');

      return (
        <Text
          key={node.key}
          onPress={() => Linking.openURL(node.attributes.href)}
          style={{
            backgroundColor: '#8FBC8F',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: '900',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 8,
            overflow: 'hidden',
            marginHorizontal: 2,
          }}
        >
          {content}
        </Text>
      );
    },
  };

  const lastUserMessage = [...currentChatMessages].filter(m => m.sender === 'user').pop();

  const renderMessageContent = (text: string, isBot: boolean) => {
    // Helper function to extract balanced JSON object
    const extractBalancedJson = (str: string): string | null => {
      let depth = 0;
      let start = -1;
      for (let i = 0; i < str.length; i++) {
        if (str[i] === '{') {
          if (depth === 0) start = i;
          depth++;
        } else if (str[i] === '}') {
          depth--;
          if (depth === 0 && start !== -1) {
            return str.substring(start, i + 1);
          }
        }
      }
      return null; // Unbalanced or no JSON found
    };

    // 1. Handle partial widget blocks during streaming
    const openTag = '[WIDGET_DATA]';
    const closeTag = '[/WIDGET_DATA]';
    let textToProcess = text;
    let widgetIsStreaming = false;

    // Check if widget is still streaming (has open tag but no close tag)
    if (isBot && text.includes(openTag) && !text.includes(closeTag)) {
      const afterOpenTag = text.split(openTag)[1] || '';
      const extractedJson = extractBalancedJson(afterOpenTag);

      if (extractedJson) {
        // JSON is complete, treat as if we have a closing tag
        const jsonEndIndex = afterOpenTag.indexOf(extractedJson) + extractedJson.length;
        const remainingText = afterOpenTag.substring(jsonEndIndex);
        textToProcess = text.split(openTag)[0] + openTag + extractedJson + closeTag + remainingText;
      } else {
        // Still streaming or incomplete JSON
        widgetIsStreaming = true;
        textToProcess = text.split(openTag)[0];
      }
    }

    // 2. Regex to find complete [WIDGET_DATA]...[/WIDGET_DATA] blocks
    const widgetRegex = /\[WIDGET_DATA\]([\s\S]*?)\[\/WIDGET_DATA\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = widgetRegex.exec(textToProcess)) !== null) {
      // Add text before the widget
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: textToProcess.substring(lastIndex, match.index) });
      }
      // Add the widget data
      parts.push({ type: 'widget', content: match[1].trim() });
      lastIndex = widgetRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < textToProcess.length) {
      parts.push({ type: 'text', content: textToProcess.substring(lastIndex) });
    }

    // Default to markdown if no parts or user message
    if (parts.length === 0 || !isBot) {
      return (
        <View>
          {isBot ? <Markdown rules={markdownRules} style={markdownStyles}>{textToProcess}</Markdown> : <Text style={styles.userMessageText}>{textToProcess}</Text>}
          {widgetIsStreaming && (
            <View style={styles.streamingWidgetPlaceholder}>
              <ActivityIndicator size="small" color={COLORS.accent} style={{ marginRight: 8 }} />
              <Text style={styles.streamingWidgetText}>Generating visual...</Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <View>
        {parts.map((part, index) => (
          part.type === 'widget' ? (
            <SmartWidget key={`widget - ${index} `} dataString={part.content} />
          ) : (
            part.content.trim() !== '' && (
              <Markdown key={`text - ${index} `} rules={markdownRules} style={markdownStyles}>
                {part.content}
              </Markdown>
            )
          )
        ))}
        {widgetIsStreaming && (
          <View style={styles.streamingWidgetPlaceholder}>
            <ActivityIndicator size="small" color={COLORS.accent} style={{ marginRight: 8 }} />
            <Text style={styles.streamingWidgetText}>Generating visual...</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeAreaContent} edges={Platform.OS === 'ios' ? ['top', 'left', 'right', 'bottom'] : ['left', 'right', 'bottom']}>
        <View style={{ flex: 1 }}>

          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.headerButton}>
              <Icon name="arrow-left" size={24} color={COLORS.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleTitleTripleTap}
              activeOpacity={0.7}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 }}
            >
              <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                {chatTitle}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsHistoryVisible(true)}
              style={styles.headerButton}
            >
              <Icon name="clock" size={22} color={COLORS.accent} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 45 : 0}
          >
            <ImageBackground
              source={require('../../assets/wallpaper.png')}
              style={styles.chatBackground}
              imageStyle={styles.chatWallpaperStyle}
              resizeMode="repeat"
            >
              <FlatList
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                ref={flatListRef}
                data={currentChatMessages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() => {
                  // Ensure chat starts at bottom on first load or when switching chats
                  if (!initialScrollDoneRef.current && currentChatMessages.length > 0) {
                    flatListRef.current?.scrollToEnd({ animated: false });
                    initialScrollDoneRef.current = true;
                  }
                }}
                onScroll={(event) => {
                  const offset = event.nativeEvent.contentOffset.y;
                  const contentHeight = event.nativeEvent.contentSize.height;
                  const layoutHeight = event.nativeEvent.layoutMeasurement.height;

                  // Show button if we are more than 200px from the bottom
                  if (contentHeight - layoutHeight - offset > 200) {
                    setShowScrollToBottom(true);
                  } else {
                    setShowScrollToBottom(false);
                  }
                }}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={true}
                indicatorStyle="black"
                scrollIndicatorInsets={{ right: 2 }}
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
                          {item.sender === 'user' ? (
                            renderMessageContent(item.text, false)
                          ) : (
                            renderMessageContent(item.text, true)
                          )}
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
                          {/* Render plain text during streaming to avoid Markdown flicker */}
                          <Text style={styles.streamingText}>
                            {streamingMessage}{cursorVisible ? ' |' : ''}
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
                          <ActivityIndicator size="small" color={COLORS.accent} style={{ marginRight: 8 }} />
                          <Text style={styles.thinkingText}>{thinkingMessage || 'Thinking...'}</Text>
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
                onScrollToIndexFailed={(info) => {
                  setTimeout(() => {
                    flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
                  }, 200);
                }}
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
              {showScrollToBottom && (
                <TouchableOpacity
                  style={styles.scrollToBottomButton}
                  onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
                >
                  <Icon name="chevron-down" size={20} color={COLORS.white} />
                </TouchableOpacity>
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
        </View>
      </SafeAreaView>
    </View>
  );
};

const markdownStyles = StyleSheet.create({
  body: {
    color: COLORS.accent,
    fontSize: 15,
    lineHeight: 24,
    marginVertical: 0,
    paddingVertical: 0,
  },
  paragraph: {
    marginTop: 4,
    marginBottom: 8,
  },
  strong: {
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  em: {
    fontStyle: 'italic',
  },
  text: {
    color: COLORS.accent,
    fontSize: 15,
    lineHeight: 24,
  },
  bullet_list: {
    marginBottom: 0,
  },
  ordered_list: {
    marginBottom: 0,
  },
  code_inline: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  bullet_list_icon: {
    marginLeft: 10,
    marginRight: 10,
    color: COLORS.accent,
  },
  bullet_list_content: {
    flex: 1,
  },
  link: {
    color: COLORS.white,
    textDecorationLine: 'none',
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 0,
    fontSize: 10,
    fontWeight: '900',
    marginHorizontal: 2,
    textAlign: 'center',
    overflow: 'hidden',
  },
});

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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 50 : 16, // Refined for translucent status bar
    paddingBottom: 12,
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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent,
    textAlign: 'center',
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
    flexShrink: 1, // Ensure bubble shrinks to fit content
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
    paddingVertical: 12,
    paddingLeft: 20,
    paddingRight: 16,
    minWidth: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 125, // Moved up to clear suggestions
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(74, 65, 52, 0.85)', // Added transparency for subtlety
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 1000,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)', // Subtle glass border
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
  streamingWidgetPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  streamingText: {
    color: COLORS.darkGray,
    fontSize: 14,
    lineHeight: 22,
  },
  streamingWidgetText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  thinkingText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.8,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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