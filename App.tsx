// App.tsx
import 'react-native-gesture-handler'; // MUST BE THE VERY FIRST LINE
import React, { useState, useEffect, useRef } from 'react';
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

// Import finance utilities
import { calculateMonthlyStats, formatBudgetForRAG } from './src/utils/financeUtils';
import { XP_REWARDS, calculateLevel, getAvatarForLevel } from './src/utils/gamificationUtils';
import { isBearAvatar } from './src/constants/avatars';

// Import URL config (HARDCODED VERSION)
import { CHAT_STREAM_URL, CHAT_URL } from './src/config/urls';

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
  totalXP?: number;
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

// --- NEW TYPE: Monthly Budget ---
export type MonthlyBudget = {
  id: string;
  monthKey: string;
  userId: string;

  // Budget Allocations
  income: number;
  needsAllocation: number;
  wantsAllocation: number;
  savingsAllocation: number;

  // Actual Spending/Saving
  needsSpent: number;
  wantsSpent: number;
  savings20PercentSaved: number;
  savingsLeftoverSaved: number;

  // Targets
  leftoverTarget: number;
  leftoverRemaining: number;

  // Metadata
  updatedAt: any;
  createdAt: any;
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
  const [streamingResponse, setStreamingResponse] = useState<string>('');

  // --- NEW: Monthly Budgets State ---
  const [monthlyBudgets, setMonthlyBudgets] = useState<{ [key: string]: MonthlyBudget }>({});
  const isRebalancing = useRef(false);

  // --- 1. Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
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

  // --- 2. Data Listeners ---
  useEffect(() => {
    let unsubProfile: () => void = () => { };
    let unsubTransactions: () => void = () => { };
    let unsubAdvices: () => void = () => { };

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
            totalXP: 0,
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
          } else {
            setUserProfile(null);
          }
          setIsAuthReady(true);
        });

        const transRef = collection(db, 'users', userId, 'transactions');
        const transQuery = query(transRef, orderBy('date', 'desc'));
        unsubTransactions = onSnapshot(transQuery, (snapshot) => {
          const transData: Transaction[] = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          })) as Transaction[];
          setTransactions(transData);
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

  // --- 3. Monthly Budget Listener ---
  useEffect(() => {
    if (!firebaseUser) return;

    const budgetsRef = collection(db, 'users', firebaseUser.uid, 'monthlyBudgets');
    const unsubBudgets = onSnapshot(budgetsRef, (snapshot) => {
      const budgetsData: { [key: string]: MonthlyBudget } = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data() as MonthlyBudget;
        budgetsData[data.monthKey] = { ...data, id: doc.id };
      });
      setMonthlyBudgets(budgetsData);
    });

    return () => unsubBudgets();
  }, [firebaseUser]);

  // --- 4. Balance Check Logic ---
  useEffect(() => {
    if (userProfile && transactions.length > 0) {
      checkLeftoverBalance(userProfile, transactions);
    }
  }, [userProfile, transactions]);

  // --- 5. Chat Listeners ---
  useEffect(() => {
    if (!firebaseUser) return;
    const sessionsRef = collection(db, 'users', firebaseUser.uid, 'chatSessions');
    const sessionsQuery = query(sessionsRef, orderBy('createdAt', 'desc'));
    const unsubSessions = onSnapshot(sessionsQuery, (snapshot) => {
      const sessionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatSession[];
      setChatSessions(sessionsData);
    });
    return () => unsubSessions();
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser || !currentChatId) {
      setCurrentChatMessages([]);
      return;
    }
    const messagesRef = collection(db, 'users', firebaseUser.uid, 'chatSessions', currentChatId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));
    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
      setCurrentChatMessages(messagesData);
    });
    return () => unsubMessages();
  }, [firebaseUser, currentChatId]);

  // --- 6. Auto Sync Monthly Budget ---
  useEffect(() => {
    if (transactions.length > 0 && userProfile) {
      syncMonthlyBudget();
    }
  }, [transactions, userProfile]);

  // --- Helper Functions ---

  const getUserId = () => firebaseUser?.uid;

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

  // --- NEW FUNCTION: Sync Monthly Budget to Firebase ---
  const syncMonthlyBudget = async () => {
    const userId = getUserId();
    if (!userId || !userProfile) return;

    try {
      const budgetData = calculateMonthlyStats(transactions, userProfile);

      // 🛑 Check for global overspending rules before syncing
      const rebalanced = await checkAndBalanceBudgets(budgetData);
      if (rebalanced) {
        console.log('🔄 Budget rebalanced, skipping sync until next snapshot.');
        return;
      }

      const currentMonthKey = budgetData.month;
      const budgetRef = doc(db, 'users', userId, 'monthlyBudgets', currentMonthKey);
      const now = serverTimestamp();

      const updateData = {
        userId,
        monthKey: currentMonthKey,
        income: budgetData.income.fresh,
        needsAllocation: budgetData.budget.needs.target,
        wantsAllocation: budgetData.budget.wants.target,
        savingsAllocation: budgetData.budget.savings20.target,
        needsSpent: budgetData.budget.needs.spent,
        wantsSpent: budgetData.budget.wants.spent,
        savings20PercentSaved: budgetData.budget.savings20.saved,
        savingsLeftoverSaved: budgetData.budget.leftover.saved,
        leftoverTarget: userProfile.allocatedSavingsTarget || 0,
        leftoverRemaining: budgetData.budget.leftover.pending,
        updatedAt: now,
      };

      // Check if document exists
      const budgetSnap = await getDoc(budgetRef);
      if (!budgetSnap.exists()) {
        await setDoc(budgetRef, {
          ...updateData,
          createdAt: now,
        });
      } else {
        await updateDoc(budgetRef, updateData);
      }

      console.log('✅ Monthly budget synced:', currentMonthKey);
    } catch (e) {
      console.error('Error syncing monthly budget:', e);
    }
  };

  // --- NEW FUNCTION: Global Budget Rebalancing ---
  const checkAndBalanceBudgets = async (stats: any) => {
    const userId = getUserId();
    if (!userId || !userProfile || transactions.length === 0 || isRebalancing.current) return false;

    const { needs, wants } = stats.budget;
    const currentMonthKey = stats.month;

    // Filter current month expenses
    const currentMonthExpenses = transactions.filter(
      (t) => t.type === 'expense' && getMonthKey(t.date) === currentMonthKey
    );

    // RULE 1: Needs > Budget, Needs exceeded, but Wants has room
    if (needs.spent > (needs.target + 0.01) && wants.remaining > 0.01) {
      const excess = needs.spent - needs.target;
      const amountToMove = Math.min(excess, wants.remaining);

      // Find the latest 'needs' transaction to move/split
      const needsTrans = currentMonthExpenses
        .filter(t => t.category === 'needs')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (needsTrans.length > 0) {
        isRebalancing.current = true;
        try {
          const trans = needsTrans[0];
          const batch = writeBatch(db);

          if (trans.amount > amountToMove + 0.01) {
            // Split
            batch.update(doc(db, 'users', userId, 'transactions', trans.id), {
              amount: trans.amount - amountToMove,
            });
            const newId = `${trans.id}_needs_overflow`;
            batch.set(doc(db, 'users', userId, 'transactions', newId), {
              ...trans,
              id: newId,
              amount: amountToMove,
              category: 'wants',
              name: `${trans.name} (Needs Overflow)`,
              createdAt: serverTimestamp(),
            });
          } else {
            // Move whole
            batch.update(doc(db, 'users', userId, 'transactions', trans.id), {
              category: 'wants',
              name: `${trans.name} (Needs Overflow)`,
            });
          }
          await batch.commit();
          handleAwardXP(XP_REWARDS.OVERSPENDING_PENALTY);
          showMessage("Budget Shield: Your 'Needs' spending exceeded the budget. Excess has been moved to 'Wants' and XP penalized! 🐻");
          return true;
        } catch (e) {
          console.error("Error rebalancing Needs: ", e);
        } finally {
          isRebalancing.current = false;
        }
      }
    }
    // RULE 2: Wants > Budget, Wants exceeded, but Needs has room
    else if (wants.spent > (wants.target + 0.01) && needs.remaining > 0.01) {
      const excess = wants.spent - wants.target;
      const amountToMove = Math.min(excess, needs.remaining);

      const wantsTrans = currentMonthExpenses
        .filter(t => t.category === 'wants')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (wantsTrans.length > 0) {
        isRebalancing.current = true;
        try {
          const trans = wantsTrans[0];
          const batch = writeBatch(db);

          if (trans.amount > amountToMove + 0.01) {
            // Split
            batch.update(doc(db, 'users', userId, 'transactions', trans.id), {
              amount: trans.amount - amountToMove,
            });
            const newId = `${trans.id}_wants_overflow`;
            batch.set(doc(db, 'users', userId, 'transactions', newId), {
              ...trans,
              id: newId,
              amount: amountToMove,
              category: 'needs',
              name: `${trans.name} (Wants Overflow)`,
              createdAt: serverTimestamp(),
            });
          } else {
            // Move whole
            batch.update(doc(db, 'users', userId, 'transactions', trans.id), {
              category: 'needs',
              name: `${trans.name} (Wants Overflow)`,
            });
          }
          await batch.commit();
          handleAwardXP(XP_REWARDS.OVERSPENDING_PENALTY);
          showMessage("Budget Shield: Your 'Wants' spending exceeded the budget. Excess has been moved to 'Needs' and XP penalized! 🐻");
          return true;
        } catch (e) {
          console.error("Error rebalancing Wants: ", e);
        } finally {
          isRebalancing.current = false;
        }
      }
    }
    return false;
  };

  // --- ALLOCATION LOGIC FIXED (50/30/20 vs Save All) ---
  const handleBalanceAllocation = async (option: 'savings' | 'budget') => {
    const userId = getUserId();
    if (!userId) return;
    const currentDate = new Date().toISOString().split('T')[0];
    const currentMonthKey = getMonthKey(currentDate);

    try {
      const batch = writeBatch(db);
      const transRef = collection(db, 'users', userId, 'transactions');
      const profileRef = doc(db, 'users', userId);

      const transactionData = {
        name: 'Carried Over',
        date: currentDate,
        amount: pendingBalance,
        type: 'income',
        category: 'income',
        subCategory: 'Carried Over',
        createdAt: serverTimestamp(),
      };

      if (option === 'budget') {
        batch.set(doc(transRef), {
          ...transactionData,
          icon: 'chevrons-down',
          isCarriedOver: false,
        });

        batch.update(profileRef, {
          lastCheckedMonth: currentMonthKey,
        });

      } else {
        batch.set(doc(transRef), {
          ...transactionData,
          icon: 'piggy-bank',
          isCarriedOver: true,
        });

        batch.update(profileRef, {
          allocatedSavingsTarget: (userProfile?.allocatedSavingsTarget || 0) + pendingBalance,
          lastCheckedMonth: currentMonthKey,
        });
      }

      await batch.commit();

      // Sync budget after allocation
      setTimeout(() => syncMonthlyBudget(), 100);

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

      // --- XP LOGIC ---
      let xpToAdd = 0;
      if (Array.isArray(transaction)) {
        transaction.forEach(t => {
          xpToAdd += XP_REWARDS.TRANSACTION_LOGGED;
          if (t.category === 'savings') {
            xpToAdd += Math.floor(Math.abs(t.amount) * XP_REWARDS.SAVING_RM1);
          }
        });
      } else {
        xpToAdd += XP_REWARDS.TRANSACTION_LOGGED;
        if (transaction.category === 'savings') {
          xpToAdd += Math.floor(Math.abs(transaction.amount) * XP_REWARDS.SAVING_RM1);
        }
      }
      if (xpToAdd > 0) {
        handleAwardXP(xpToAdd);
      }

      // Sync budget after adding transaction
      setTimeout(() => syncMonthlyBudget(), 100);

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

  const handleUpdateTransaction = async (transactionId: string, updatedData: Partial<Transaction>) => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const transRef = doc(db, 'users', userId, 'transactions', transactionId);
      await updateDoc(transRef, updatedData);

      // Sync budget after update
      setTimeout(() => syncMonthlyBudget(), 100);

      showMessage('Transaction updated.');
    } catch (e) {
      console.error('Error updating transaction: ', e);
      showMessage('Error updating transaction.');
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const transRef = doc(db, 'users', userId, 'transactions', transactionId);
      await deleteDoc(transRef);

      // Sync budget after deletion
      setTimeout(() => syncMonthlyBudget(), 100);

      showMessage('Transaction deleted.');
    } catch (e) {
      console.error('Error deleting transaction: ', e);
      showMessage('Error deleting transaction.');
    }
  };

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

  // --- FIXED STREAMING HANDLER WITH BUDGET DATA ---
  const handleSendMessage = async (text: string, chatId: string | null, isPrefill = false) => {
    const userId = getUserId();
    if (!userId || !chatId || !userProfile) return;

    // 1. Add USER message to Firestore immediately
    const messagesRef = collection(db, 'users', userId, 'chatSessions', chatId, 'messages');
    await addDoc(messagesRef, {
      text,
      sender: 'user',
      createdAt: serverTimestamp(),
    });

    // Update session info
    const sessionRef = doc(db, 'users', userId, 'chatSessions', chatId);
    await updateDoc(sessionRef, { lastMessage: text });

    // 2. Prepare context (History)
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    const historyForServer = snap.docs.map(d => {
      const data = d.data();
      return {
        role: data.sender === 'user' ? 'user' : 'model',
        parts: [{ text: data.text }]
      };
    });

    // 3. Calculate budget data for RAG
    const budgetData = calculateMonthlyStats(transactions, userProfile);
    const budgetContext = formatBudgetForRAG(budgetData);

    // 4. START STREAMING VIA XHR
    setStreamingResponse('');
    let fullResponse = '';
    let buffer = '';
    let previousLength = 0;

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', CHAT_STREAM_URL);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
      xhr.responseType = 'text';

      xhr.timeout = 45000;

      // Incremental progress
      xhr.onprogress = () => {
        const responseText = xhr.responseText;
        const newData = responseText.substring(previousLength);
        previousLength = responseText.length;
        buffer += newData;

        // Process complete events incrementally
        while (true) {
          const index = buffer.indexOf('\n\n');
          if (index === -1) break;

          const eventStr = buffer.slice(0, index);
          buffer = buffer.slice(index + 2);

          const lines = eventStr.split('\n');
          let currentEvent = '';
          let dataStr = '';

          lines.forEach(line => {
            line = line.trim();
            if (line.startsWith('event:')) {
              currentEvent = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              dataStr += line.slice(5).trim() + ' ';
            }
          });

          if (currentEvent && dataStr.trim()) {
            try {
              const data = JSON.parse(dataStr.trim());

              if (currentEvent === 'token' && data.content) {
                setStreamingResponse((prev) => prev + data.content);
                fullResponse += data.content;
              } else if (currentEvent === 'thinking') {
                console.log('DEBUG: Thinking:', data.message);
              } else if (currentEvent === 'done') {
                resolve();
              } else if (currentEvent === 'error') {
                reject(new Error(data.error || 'Server error'));
              }
            } catch (e) {
              console.error('DEBUG: Parse error:', e);
            }
          }
        }
      };

      // Complete
      xhr.onload = () => {
        if (xhr.status === 200) {
          // Process remaining buffer
          while (true) {
            const index = buffer.indexOf('\n\n');
            if (index === -1) break;

            const eventStr = buffer.slice(0, index);
            buffer = buffer.slice(index + 2);

            const lines = eventStr.split('\n');
            let currentEvent = '';
            let dataStr = '';

            lines.forEach(line => {
              line = line.trim();
              if (line.startsWith('event:')) {
                currentEvent = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                dataStr += line.slice(5).trim() + ' ';
              }
            });

            if (currentEvent === 'done') {
              resolve();
            }
          }
        } else {
          reject(new Error(`HTTP error: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));
      xhr.ontimeout = () => reject(new Error('Timeout'));

      // Send payload WITH BUDGET CONTEXT
      xhr.send(JSON.stringify({
        message: text,
        history: historyForServer,
        transactions: transactions.slice(0, 20),
        userProfile: userProfile,
        budgetContext: budgetContext,
      }));
    }).then(async () => {
      if (fullResponse.trim()) {
        await addDoc(messagesRef, {
          text: fullResponse.trim(),
          sender: 'bot',
          createdAt: serverTimestamp(),
        });

        if (historyForServer.length <= 1 || isPrefill) {
          const newTitle = text.length > 30 ? text.substring(0, 30) + '...' : text;
          await updateDoc(sessionRef, { title: newTitle });
        }
      } else {
        throw new Error('Empty response');
      }
    }).catch(async (error) => {
      console.error('Stream error:', error);
      // Fallback to non-streaming
      try {
        const fallbackResponse = await fetch(CHAT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({
            message: text,
            history: historyForServer,
            transactions: transactions.slice(0, 20),
            userProfile: userProfile,
            budgetContext: budgetContext,
          }),
        });

        if (!fallbackResponse.ok) throw new Error('Fallback failed');

        const { message: botText } = await fallbackResponse.json();
        fullResponse = botText;

        await addDoc(messagesRef, {
          text: fullResponse,
          sender: 'bot',
          createdAt: serverTimestamp(),
        });
      } catch (fallbackErr) {
        console.error('Fallback error:', fallbackErr);
        await addDoc(messagesRef, {
          text: "Network error. Please check your connection.",
          sender: 'bot',
          createdAt: serverTimestamp(),
        });
      }
    }).finally(() => {
      setStreamingResponse('');
      handleAwardXP(XP_REWARDS.CHAT_SESSION);
    });
  };

  const handleEditMessage = async (chatId: string, messageId: string, newText: string) => {
    const userId = getUserId();
    if (!userId || !userProfile) return;

    // Update the edited message
    const messageRef = doc(db, 'users', userId, 'chatSessions', chatId, 'messages', messageId);
    await updateDoc(messageRef, {
      text: newText,
      editedAt: serverTimestamp()
    });

    // Re-fetch history and remove subsequent bot messages
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

    // Calculate budget data for edit
    const budgetData = calculateMonthlyStats(transactions, userProfile);
    const budgetContext = formatBudgetForRAG(budgetData);

    // Use regular endpoint for edits
    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          message: newText,
          history: historyForServer,
          transactions: transactions.slice(0, 20),
          userProfile: userProfile,
          budgetContext: budgetContext,
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

      // Sync budget after user update
      setTimeout(() => syncMonthlyBudget(), 100);

      showMessage('Profile updated.');
    } catch (e) {
      console.error('Error updating profile: ', e);
      showMessage('Error updating profile.');
    }
  };

  const handleAwardXP = async (xp: number) => {
    const userId = getUserId();
    if (!userId || !userProfile) return;
    const currentXP = userProfile.totalXP || 0;
    const newXP = currentXP + xp;

    // Check if level up
    const oldLevel = calculateLevel(currentXP);
    const newLevel = calculateLevel(newXP);

    await updateDoc(doc(db, 'users', userId), { totalXP: newXP });

    if (newLevel > oldLevel) {
      showMessage(`🎉 Level Up! You reached Level ${newLevel}!`);
      // Auto-evolve ONLY if they are using the generic 'bear' string
      if (userProfile.avatar === 'bear') {
        await updateDoc(doc(db, 'users', userId), {
          avatar: getAvatarForLevel(newLevel)
        });
      }
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
        const docRef = doc(transRef);
        batch.set(docRef, {
          id: docRef.id,
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

      // Sync budget after setting initial balance
      setTimeout(() => syncMonthlyBudget(), 100);

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
                    key="login-screen-v1"
                    onSignUp={() => navigation.navigate('SignUp')}
                    showMessage={showMessage}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="SignUp">
                {({ navigation }) => (
                  <SignUpScreen
                    key="signup-screen-v1"
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
                    userAvatar={userProfile?.avatar || 'bear'}
                    userXP={userProfile?.totalXP || 0}
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
                    streamingMessage={streamingResponse}
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
                    transactions={transactions}
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
        key={pendingBalance}
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
    backgroundColor: '#C8DBBE',
  },
});