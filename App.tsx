import 'react-native-gesture-handler'; // MUST BE THE VERY FIRST LINE
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebaseConfig'; 
import {
  initializeAuth,
  getReactNativePersistence,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  collection,
  query,
  writeBatch,
  serverTimestamp, 
  orderBy, 
  deleteDoc, 
  getDocs, 
} from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Import our components and screens
import { MessageModal } from './src/components/MessageModal';
import { BalanceAllocationModal } from './src/components/BalanceAllocationModal';
import { InitialBalanceModal } from './src/components/InitialBalanceModal';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { HomeScreen, Screen } from './src/screens/HomeScreen';
import { AddTransactionScreen } from './src/screens/AddTransactionScreen';
import { AddMoneyScreen } from './src/screens/AddMoneyScreen';
import { SavedAdviceScreen } from './src/screens/SavedAdviceScreen';
import { ChatbotScreen } from './src/screens/ChatbotScreen';
import { ExpensesScreen } from './src/screens/ExpensesScreen';
import { SavingsScreen } from './src/screens/SavingsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

// --- Types for Navigation ---
export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Onboarding: { isRetake?: boolean; initialData?: Partial<User> } | undefined;
  Home: undefined;
  AddTransaction: undefined;
  AddMoney: undefined;
  SavedAdvice: undefined;
  Chatbot: { prefillMessage?: string; chatId?: string; messageId?: string };
  Expenses: undefined;
  Savings: undefined;
  Profile: undefined;
};

type AppNavigationProp = NativeStackNavigationProp<RootStackParamList>;
const Stack = createNativeStackNavigator<RootStackParamList>();

// --- Data Types ---
export type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  createdAt: any; 
};

export type ChatSession = {
  id: string;
  title: string; 
  createdAt: any; 
  lastMessage: string; 
};

export type Advice = {
  id: string; 
  text: string;
  date: string;
  chatId: string; 
  messageId: string; 
};

export type User = {
  name: string;
  avatar: string;
  age: string | number;
  state: string; 
  occupation: string;
  monthlyIncome: number;
  financialSituation: string;
  financialGoals: string;
  riskTolerance: string;
  cashFlow: string;
  lastCheckedMonth?: string;
  allocatedSavingsTarget?: number;
  hasSetInitialBalance?: boolean;
};

export type Transaction = {
  id: string; 
  icon: string;
  name: string;
  date: string; 
  amount: number;
  type: 'income' | 'expense';
  category: 'income' | 'needs' | 'wants' | 'savings';
  subCategory: string;
  isCarriedOver?: boolean;
};

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const db = getFirestore(app);

// --- Loading Screen ---
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#665A48" />
  </View>
);

// --- Helper function to get month key ---
const getMonthKey = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// --- Main App Component (The CONTROLLER) ---
export default function App() {
  // --- STATE ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showInitialBalanceModal, setShowInitialBalanceModal] = useState(false);
  const [pendingBalance, setPendingBalance] = useState(0);

  // --- Auth & Data State ---
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savedAdvices, setSavedAdvices] = useState<Advice[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // --- Chat State ---
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentChatMessages, setCurrentChatMessages] = useState<Message[]>([]);


  // --- 1. Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        // User is logged out
        setUserProfile(null);
        setTransactions([]);
        setSavedAdvices([]);
        setChatSessions([]); 
        setCurrentChatId(null); 
        setCurrentChatMessages([]); 
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- 2. Data Listeners (Profile, Transactions, Advice) ---
  useEffect(() => {
    let unsubProfile: () => void = () => {};
    let unsubTransactions: () => void = () => {};
    let unsubAdvices: () => void = () => {};

    const setupListeners = async () => {
      if (firebaseUser) {
        const userId = firebaseUser.uid;
        const profileRef = doc(db, 'users', userId);
        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists()) {
          console.log('New user detected, creating profile stub...');
          await setDoc(profileRef, {
            name: firebaseUser.displayName || '',
            email: firebaseUser.email,
            avatar: 'bear',
            age: '',
            state: '', 
            occupation: '',
            monthlyIncome: 0,
            financialSituation: '',
            financialGoals: '', 
            riskTolerance: '',
            cashFlow: '',
            lastCheckedMonth: getMonthKey(new Date().toISOString()),
            allocatedSavingsTarget: 0,
            hasSetInitialBalance: false, 
          });
        }

        unsubProfile = onSnapshot(doc(db, 'users', userId), (profileDoc) => {
          if (profileDoc.exists()) {
            const profileData = profileDoc.data() as User;
            if (!profileData.name && firebaseUser.displayName) {
              updateDoc(doc(db, 'users', userId), { name: firebaseUser.displayName });
              profileData.name = firebaseUser.displayName; 
            }
            setUserProfile(profileData);
            if (profileData.financialGoals && !profileData.hasSetInitialBalance) {
              setShowInitialBalanceModal(true);
            } else {
              setShowInitialBalanceModal(false);
            }
            checkLeftoverBalance(profileData, transactions);
          } else {
            setUserProfile(null);
          }
          setIsAuthReady(true);
        });

        const transRef = collection(db, 'users', userId, 'transactions');
        const transQuery = query(transRef, orderBy('date', 'desc')); 
        unsubTransactions = onSnapshot(transQuery, (snapshot) => {
          // --- FIX: Correctly map ID to ensure doc.id is the source of truth ---
          const transData: Transaction[] = snapshot.docs.map((doc) => ({
            ...doc.data(), // Spread data first
            id: doc.id,    // Overwrite with real Firestore Document ID
          })) as Transaction[];
          setTransactions(transData);
          if (userProfile) {
            checkLeftoverBalance(userProfile, transData);
          }
        });

        const adviceRef = collection(db, 'users', userId, 'savedAdvices');
        const adviceQuery = query(adviceRef);
        unsubAdvices = onSnapshot(adviceQuery, (snapshot) => {
          const adviceData: Advice[] = snapshot.docs.map((doc) => ({
            id: doc.id, ...doc.data(),
          })) as Advice[];
          setSavedAdvices(adviceData);
        });

      }
    };
    
    setupListeners();
  
    return () => {
      unsubProfile();
      unsubTransactions();
      unsubAdvices();
    };
  
  }, [firebaseUser]); 

  // --- 3. Chat Listeners ---
  useEffect(() => {
    if (!firebaseUser) return;

    // Listen to the list of chat sessions
    const sessionsRef = collection(db, 'users', firebaseUser.uid, 'chatSessions');
    const sessionsQuery = query(sessionsRef, orderBy('createdAt', 'desc'));
    
    const unsubSessions = onSnapshot(sessionsQuery, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatSession[];
      setChatSessions(sessionsData);
    });

    return () => unsubSessions();
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser || !currentChatId) {
      setCurrentChatMessages([]); // Clear messages if no chat is selected
      return;
    }

    // Listen to the messages of the *currently active* chat
    const messagesRef = collection(db, 'users', firebaseUser.uid, 'chatSessions', currentChatId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setCurrentChatMessages(messagesData);
    });

    return () => unsubMessages();
  }, [firebaseUser, currentChatId]);


  // --- Helper Functions ---

  const getUserId = () => {
    return firebaseUser?.uid;
  };

  const showMessage = (message: string) => {
    setModalMessage(message);
    setModalVisible(true);
  };

  const checkLeftoverBalance = (profile: User, trans: Transaction[]) => {
    const currentMonthKey = getMonthKey(new Date().toISOString());
    if (
      profile.lastCheckedMonth !== currentMonthKey &&
      profile.hasSetInitialBalance
    ) {
      const lastMonthKey = getMonthKey(
        new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString()
      );
      const lastMonthTransactions = trans.filter(
        (t) => getMonthKey(t.date) === lastMonthKey
      );
      const lastMonthIncome = lastMonthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const lastMonthExpenses = lastMonthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const leftover = lastMonthIncome - lastMonthExpenses;
      if (leftover > 0) {
        setPendingBalance(leftover);
        setShowBalanceModal(true);
      } else {
        updateLastCheckedMonth(currentMonthKey);
      }
    }
  };

  const updateLastCheckedMonth = async (monthKey: string) => {
    const userId = getUserId();
    if (!userId || !userProfile) return;
    try {
      await updateDoc(doc(db, 'users', userId), { lastCheckedMonth: monthKey });
    } catch (e) {
      console.error('Error updating lastCheckedMonth: ', e);
    }
  };

  const handleBalanceAllocation = async (option: 'savings' | 'budget') => {
    const userId = getUserId();
    if (!userId) return;
    const currentDate = new Date().toISOString().split('T')[0];
    const currentMonthKey = getMonthKey(currentDate);

    try {
      const batch = writeBatch(db);
      const transRef = collection(db, 'users', userId, 'transactions');
      const profileRef = doc(db, 'users', userId);

      if (option === 'budget') {
        const needsAmount = pendingBalance * 0.5;
        const wantsAmount = pendingBalance * 0.3;
        const savingsAmount = pendingBalance * 0.2;

        if (needsAmount > 0) {
          batch.set(doc(transRef), {
            icon: 'chevrons-down',
            name: 'Leftover to Needs',
            date: currentDate,
            amount: needsAmount,
            type: 'income',
            category: 'income',
            subCategory: 'Carried Over',
            isCarriedOver: true,
          });
        }
        if (wantsAmount > 0) {
          batch.set(doc(transRef), {
            icon: 'chevrons-down',
            name: 'Leftover to Wants',
            date: currentDate,
            amount: wantsAmount,
            type: 'income',
            category: 'income',
            subCategory: 'Carried Over',
            isCarriedOver: true,
          });
        }
        if (savingsAmount > 0) {
          batch.set(doc(transRef), {
            icon: 'piggy-bank',
            name: 'Saving Leftover Balance',
            date: currentDate,
            amount: savingsAmount,
            type: 'expense',
            category: 'savings',
            subCategory: 'Savings',
            isCarriedOver: true,
          });
        }
        
        batch.update(profileRef, {
          allocatedSavingsTarget: (userProfile?.allocatedSavingsTarget || 0),
          lastCheckedMonth: currentMonthKey,
        });

      } else {
        // 'savings' option
        batch.set(doc(transRef), {
            icon: 'chevrons-down',
            name: 'Leftover to Budget',
            date: currentDate,
            amount: pendingBalance,
            type: 'income',
            category: 'income',
            subCategory: 'Carried Over',
            isCarriedOver: true,
        });
        batch.update(profileRef, {
          allocatedSavingsTarget: (userProfile?.allocatedSavingsTarget || 0) + pendingBalance,
          lastCheckedMonth: currentMonthKey,
        });
      }

      await batch.commit();
      showMessage('Balance allocated successfully.');
      setShowBalanceModal(false);
      setPendingBalance(0);
    } catch (e) {
      console.error('Error allocating balance: ', e);
      showMessage('Error allocating balance.');
    }
  };


  const handleAddTransaction = async (
    transaction: Transaction | Transaction[],
    showMsg = true
  ) => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const batch = writeBatch(db);
      
      // --- FIX: Ensure ID exists (Fallback to random if missing to prevent crash) ---
      if (Array.isArray(transaction)) {
        transaction.forEach((t) => {
          const safeId = t.id || String(Date.now() + Math.random()); 
          const docRef = doc(db, 'users', userId, 'transactions', safeId); 
          batch.set(docRef, { ...t, id: safeId, createdAt: serverTimestamp() }); 
        });
      } else {
        const safeId = transaction.id || String(Date.now());
        const docRef = doc(db, 'users', userId, 'transactions', safeId); 
        batch.set(docRef, { ...transaction, id: safeId, createdAt: serverTimestamp() }); 
      }

      await batch.commit();
      if (showMsg) {
        showMessage('Transaction added.');
      }
    } catch (e) {
      console.error('Error adding transaction: ', e);
      if (showMsg) {
        showMessage('Error adding transaction.');
      }
    }
  };

  // --- Update Transaction Handler ---
  const handleUpdateTransaction = async (transactionId: string, updatedData: Partial<Transaction>) => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const transRef = doc(db, 'users', userId, 'transactions', transactionId);
      await updateDoc(transRef, updatedData);
      showMessage('Transaction updated.');
    } catch (e) {
      console.error('Error updating transaction: ', e);
      showMessage('Error updating transaction.');
    }
  };

  // --- Delete Transaction Handler ---
  const handleDeleteTransaction = async (transactionId: string) => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const transRef = doc(db, 'users', userId, 'transactions', transactionId);
      await deleteDoc(transRef);
      showMessage('Transaction deleted.');
    } catch (e) {
      console.error('Error deleting transaction: ', e);
      showMessage('Error deleting transaction.');
    }
  };

  // --- Chat Handlers ---
  const handleCreateNewChat = async (prefillMessage?: string) => {
    const userId = getUserId();
    if (!userId) return;

    const sessionsRef = collection(db, 'users', userId, 'chatSessions');
    const newSessionDoc = await addDoc(sessionsRef, {
      title: 'New Chat', 
      createdAt: serverTimestamp(),
      lastMessage: '...',
    });

    setCurrentChatId(newSessionDoc.id);

    if (prefillMessage) {
      await handleSendMessage(prefillMessage, newSessionDoc.id, true);
    }
    
    return newSessionDoc.id; 
  };

  const handleSendMessage = async (text: string, chatId: string | null, isPrefill = false) => {
    const userId = getUserId();
    if (!userId || !chatId || !userProfile) {
      console.error("Missing data for sending message:", { userId, chatId, userProfile });
      return;
    }

    const messagesRef = collection(db, 'users', userId, 'chatSessions', chatId, 'messages');
    const userMessage: Omit<Message, 'id'> = {
      text,
      sender: 'user',
      createdAt: serverTimestamp(),
    };

    if (!isPrefill) { 
        await addDoc(messagesRef, userMessage);
    } else {
        await addDoc(messagesRef, userMessage);
    }

    const sessionRef = doc(db, 'users', userId, 'chatSessions', chatId);
    await updateDoc(sessionRef, { lastMessage: text });

    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));
    const messagesSnap = await getDocs(messagesQuery);
    const fullHistory = messagesSnap.docs.map(doc => doc.data());

    const historyForServer = fullHistory.map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    try {
      const response = await fetch('http://192.168.0.8:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyForServer, 
          transactions: transactions,
          userProfile: userProfile,
        }),
      });

      if (!response.ok) throw new Error('Server error');

      const { message: botResponseText } = await response.json();

      const botMessage: Omit<Message, 'id'> = {
        text: botResponseText,
        sender: 'bot',
        createdAt: serverTimestamp(),
      };
      await addDoc(messagesRef, botMessage);
      
      if (fullHistory.length === 1 || (isPrefill && fullHistory.length === 0)) { 
        const newTitle = text.length > 30 ? text.substring(0, 30) + '...' : text;
        await updateDoc(sessionRef, { title: newTitle });
      }

    } catch (error: any) {
      console.error('Failed to get bot response:', error);
      // --- FIX: Better error message for Network Errors ---
      let errorText = 'Sorry, I ran into an error. Please try again.';
      if (error.message && error.message.includes('Network request failed')) {
        errorText = 'Error: Network request failed. Please check Info.plist for App Transport Security (ATS) settings or your server IP.';
      }
      
      await addDoc(messagesRef, {
        text: errorText,
        sender: 'bot',
        createdAt: serverTimestamp(),
      });
    }
  };

  const handleEditMessage = async (chatId: string, messageId: string, newText: string) => {
    const userId = getUserId();
    if (!userId || !userProfile) return;

    const messageRef = doc(db, 'users', userId, 'chatSessions', chatId, 'messages', messageId);
    await updateDoc(messageRef, {
      text: newText,
      editedAt: serverTimestamp()
    });

    const messagesRef = collection(db, 'users', userId, 'chatSessions', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    const messagesSnap = await getDocs(q);
    
    let foundMessage = false;
    const batch = writeBatch(db);
    const historyForServer = []; 

    for (const docSnap of messagesSnap.docs) {
      const messageData = docSnap.data();
      
      if (foundMessage && messageData.sender === 'bot') {
        batch.delete(docSnap.ref); 
      } else if (docSnap.id === messageId) {
        foundMessage = true;
        historyForServer.push({
          role: 'user',
          parts: [{ text: newText }]
        });
      } else if (!foundMessage) {
        historyForServer.push({
          role: messageData.sender === 'user' ? 'user' : 'model',
          parts: [{ text: messageData.text }]
        });
      }
    }
    await batch.commit(); 

    const sessionRef = doc(db, 'users', userId, 'chatSessions', chatId);
    await updateDoc(sessionRef, { lastMessage: newText });

    try {
      const response = await fetch('http://192.168.0.8:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newText, 
          history: historyForServer, 
          transactions: transactions,
          userProfile: userProfile,
        }),
      });

      if (!response.ok) throw new Error('Server error');

      const { message: botResponseText } = await response.json();

      const botMessage: Omit<Message, 'id'> = {
        text: botResponseText,
        sender: 'bot',
        createdAt: serverTimestamp(),
      };
      await addDoc(messagesRef, botMessage);

    } catch (error) {
      console.error('Failed to get bot response after edit:', error);
      await addDoc(messagesRef, {
        text: 'Sorry, I ran into an error after editing. Please try again.',
        sender: 'bot',
        createdAt: serverTimestamp(),
      });
    }
  };

  const handleDeleteChatSession = async (chatId: string) => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const messagesRef = collection(db, 'users', userId, 'chatSessions', chatId, 'messages');
      const messagesSnap = await getDocs(messagesRef);
      const batch = writeBatch(db);
      messagesSnap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      const sessionRef = doc(db, 'users', userId, 'chatSessions', chatId);
      await deleteDoc(sessionRef);

      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }
      showMessage('Chat deleted.');
    } catch (error) {
      console.error("Error deleting chat session: ", error);
      showMessage('Error deleting chat.');
    }
  };

  const handleDeleteSavedAdvice = async (adviceId: string) => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const adviceRef = doc(db, 'users', userId, 'savedAdvices', adviceId);
      await deleteDoc(adviceRef);
      showMessage('Advice deleted.');
    } catch (e) {
      console.error('Error deleting advice: ', e);
      showMessage('Error deleting advice.');
    }
  };

  const handleSaveAdvice = async (text: string, chatId: string, messageId: string) => {
    const userId = getUserId();
    if (!userId || !chatId || !messageId) {
       console.error("Missing IDs for saving advice:", { userId, chatId, messageId });
       showMessage('Error: Could not save advice. Missing context.');
       return;
    }
    try {
      await addDoc(collection(db, 'users', userId, 'savedAdvices'), {
        text: text,
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        chatId: chatId,
        messageId: messageId,
      });
      showMessage('Advice saved.');
    } catch (e) {
      console.error('Error saving advice: ', e);
      showMessage('Error saving advice.');
    }
  };

  const handleUpdateUser = async (updatedData: Partial<User>) => {
    const userId = getUserId();
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'users', userId), updatedData);
      showMessage('Profile updated.');
    } catch (e) {
      console.error('Error updating profile: ', e);
      showMessage('Error updating profile.');
    }
  };

  const handleOnboardingComplete = async (data: Partial<User>, isRetake: boolean) => {
    const userId = getUserId();
    if (!userId) {
      showMessage('No user ID found.');
      return;
    }
    try {
      const updateData: Partial<User> = { ...data };
      if (firebaseUser?.displayName) {
        updateData.name = firebaseUser.displayName;
      }
      if (!isRetake) {
        updateData.hasSetInitialBalance = false;
      }
      await updateDoc(doc(db, 'users', userId), updateData);
    } catch (e) {
      console.error('Error completing onboarding: ', e);
      showMessage('Error saving profile.');
      throw e; 
    }
  };

  const handleSetInitialBalance = async (amount: number) => {
    const userId = getUserId();
    if (!userId) {
      showMessage('No user ID found.');
      return;
    }
    try {
      const batch = writeBatch(db);
      const profileRef = doc(db, 'users', userId);
      if (amount > 0) {
        const transRef = collection(db, 'users', userId, 'transactions');
        const docRef = doc(transRef); // For initial balance, auto-ID is fine, or specify one
        batch.set(docRef, {
          id: docRef.id, // Ensure consistent ID
          icon: 'wallet',
          name: 'Initial Balance',
          date: new Date().toISOString().split('T')[0],
          amount: amount,
          type: 'income',
          category: 'income',
          subCategory: 'Initial',
          isCarriedOver: false,
          createdAt: serverTimestamp() 
        });
      }
      batch.update(profileRef, { hasSetInitialBalance: true });
      await batch.commit();
      setShowInitialBalanceModal(false);
      showMessage('Your starting balance is set!');
    } catch (e) {
      console.error('Error setting initial balance: ', e);
      showMessage('Error saving your balance.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (!isAuthReady) {
    return <LoadingScreen />;
  }

  let initialRoute: keyof RootStackParamList = 'Login';
  if (firebaseUser) {
    if (!userProfile) {
      return <LoadingScreen />;
    } else if (!userProfile.financialGoals) {
      initialRoute = 'Onboarding';
    } else {
      initialRoute = 'Home';
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false, animation: 'none' }}
        >
          {!firebaseUser ? (
            <>
              <Stack.Screen name="Login">
                {({ navigation }) => (
                  <LoginScreen
                    onSignUp={() => navigation.navigate('SignUp')}
                    showMessage={showMessage}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="SignUp">
                {({ navigation }) => (
                  <SignUpScreen
                    onBack={() => navigation.goBack()}
                    showMessage={showMessage}
                  />
                )}
              </Stack.Screen>
            </>
          ) : (
            <>
              <Stack.Screen
                name="Onboarding"
                options={{ gestureEnabled: false }}
              >
                {({ navigation, route }) => (
                  <OnboardingScreen
                    onComplete={(data, isRetake) =>
                      handleOnboardingComplete(data, isRetake)
                    }
                    showMessage={showMessage}
                    initialData={
                      route.params?.initialData ||
                      (userProfile
                        ? userProfile
                        : { name: firebaseUser?.displayName || '' })
                    }
                    isRetake={route.params?.isRetake}
                    navigation={navigation}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Home">
                {({ navigation }) => (
                  <HomeScreen
                    onNavigate={(screen: Screen) => {
                      if (screen === 'Chatbot') {
                        navigation.navigate('Chatbot', {});
                      } else {
                        navigation.navigate(screen as keyof RootStackParamList)
                      }
                    }}
                    transactions={transactions}
                    userName={userProfile?.name || 'User'}
                    allocatedSavingsTarget={
                      userProfile?.allocatedSavingsTarget || 0
                    }
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="AddMoney">
                {({ navigation }) => (
                  <AddMoneyScreen
                    onBack={() => navigation.goBack()}
                    showMessage={showMessage}
                    onAddTransaction={handleAddTransaction}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="SavedAdvice">
                {({ navigation }) => (
                  <SavedAdviceScreen
                    onBack={() => navigation.goBack()}
                    savedAdvices={savedAdvices}
                    onGoToChat={(chatId, messageId) => {
                      setCurrentChatId(chatId);
                      navigation.navigate('Chatbot', { chatId, messageId });
                    }}
                    onDeleteAdvice={handleDeleteSavedAdvice}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="AddTransaction">
                {({ navigation }) => (
                  <AddTransactionScreen
                    onBack={() => navigation.goBack()}
                    showMessage={showMessage}
                    onAddTransaction={(tx) => handleAddTransaction(tx)}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="Chatbot"
                options={{ animation: 'slide_from_bottom' }}
              >
                {({ navigation, route }) => (
                  <ChatbotScreen
                    onBack={() => {
                      navigation.goBack();
                      setCurrentChatId(null); 
                    }}
                    chatSessions={chatSessions}
                    currentChatMessages={currentChatMessages}
                    currentChatId={currentChatId}
                    userProfile={userProfile!}
                    transactions={transactions}
                    onSetCurrentChatId={setCurrentChatId}
                    onCreateNewChat={handleCreateNewChat}
                    onSendMessage={handleSendMessage}
                    onSaveAdvice={handleSaveAdvice}
                    onDeleteChatSession={handleDeleteChatSession} 
                    onEditMessage={handleEditMessage} 
                    route={route}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Expenses">
                {({ navigation }) => (
                  <ExpensesScreen
                    onBack={() => navigation.goBack()}
                    transactions={transactions}
                    onNavigate={(screen: Screen) => {
                      if (screen === 'Chatbot') {
                        navigation.navigate('Chatbot', {});
                      } else {
                        navigation.navigate(screen as keyof RootStackParamList)
                      }
                    }}
                    onAskAI={async (message) => {
                      const newChatId = await handleCreateNewChat(message);
                      navigation.navigate('Chatbot', { chatId: newChatId });
                    }}
                    onUpdateTransaction={handleUpdateTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Savings">
                {({ navigation }) => (
                  <SavingsScreen
                    onBack={() => navigation.goBack()}
                    transactions={transactions}
                    onAddTransaction={(tx) => handleAddTransaction(tx)}
                    allocatedSavingsTarget={
                      userProfile?.allocatedSavingsTarget || 0
                    }
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Profile">
                {({ navigation }) => (
                  <ProfileScreen
                    onNavigate={(screen: Screen) => {
                      if (screen === 'Chatbot') {
                        navigation.navigate('Chatbot', {});
                      } else {
                        navigation.navigate(screen as keyof RootStackParamList)
                      }
                    }}
                    user={userProfile!}
                    onUpdateUser={handleUpdateUser}
                    onLogout={handleLogout}
                    navigation={navigation}
                  />
                )}
              </Stack.Screen>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>

      {/* --- MODALS --- */}
      <BalanceAllocationModal
        visible={showBalanceModal}
        balance={pendingBalance}
        onAllocate={handleBalanceAllocation}
      />
      <InitialBalanceModal
        visible={showInitialBalanceModal}
        onSubmit={handleSetInitialBalance}
      />
      <MessageModal
        visible={modalVisible}
        message={modalMessage}
        onDismiss={() => setModalVisible(false)}
      />
    </GestureHandlerRootView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#C8DBBE', // Primary color
  },
});