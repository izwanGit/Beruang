import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Text,
  AppState,
} from 'react-native';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS } from './src/constants/colors';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebaseConfig';
import {
  initializeAuth,
  // @ts-ignore
  getReactNativePersistence,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
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
  where,
} from 'firebase/firestore';

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
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { PrivacySecurityScreen } from './src/screens/PrivacySecurityScreen';
import { BudgetExceededModal } from './src/components/BudgetExceededModal';

// Import finance utilities
import {
  calculateMonthlyStats,
  formatBudgetForRAG,
  calculateAllMonthlyStats,
  formatHistoricalRAG
} from './src/utils/financeUtils';
import { XP_REWARDS, calculateLevel, getAvatarForLevel } from './src/utils/gamificationUtils';
import { isBearAvatar } from './src/constants/avatars';

// Import URL config (HARDCODED VERSION)
import { CHAT_STREAM_URL, CHAT_URL } from './src/config/urls';
import NotificationService from './src/services/NotificationService';

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
  Notifications: undefined;
  PrivacySecurity: undefined;
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
  createdAt: any;
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
  allocationId?: string;
  allocationIndex?: number;
  allocationTotalMonths?: number;
  isAllocated?: boolean;
  createdAt?: any;
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
  const navigationRef = useNavigationContainerRef();
  const [currentRoute, setCurrentRoute] = useState<string>('');

  // --- STATE ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');


  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showInitialBalanceModal, setShowInitialBalanceModal] = useState(false);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [showBudgetExceededModal, setShowBudgetExceededModal] = useState(false);
  const [budgetExceededInfo, setBudgetExceededInfo] = useState({
    needsRemaining: 0,
    wantsRemaining: 0,
    savingsUnsaved: 0,
    transactionAmount: 0,
  });

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
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // --- NEW: Monthly Budgets State ---
  const [monthlyBudgets, setMonthlyBudgets] = useState<{ [key: string]: MonthlyBudget }>({});
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const isRebalancing = useRef(false);
  const lastSyncTimeRef = useRef(0);
  const hasScheduledNotification = useRef(false);

  // --- Notification Setup (runs ONCE) ---
  useEffect(() => {
    const initNotifications = async () => {
      try {
        await NotificationService.requestUserPermission();
        await NotificationService.getFCMToken();
        NotificationService.setupListeners();
      } catch (e) {
        console.log('Notification init skipped:', e);
      }
    };
    initNotifications();
  }, []); // Empty dependency - runs only once

  // --- AppState Listener for Smart Notifications ---
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background' && !hasScheduledNotification.current) {
        hasScheduledNotification.current = true;
        const budgetData = userProfile && transactions.length > 0
          ? calculateMonthlyStats(transactions, userProfile)
          : null;
        NotificationService.scheduleSmartReminder(budgetData);
      } else if (nextAppState === 'active') {
        hasScheduledNotification.current = false;
        NotificationService.cancelAll();
        // Refresh unread count when app becomes active
        NotificationService.getUnreadCount().then(setUnreadNotificationCount);
      }
    });

    return () => subscription.remove();
  }, [userProfile, transactions]);

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
            // --- FIX NEGATIVE XP USERS (Level Floor) ---
            if ((profileData.totalXP || 0) < 0) {
              updateDoc(doc(db, 'users', userId), { totalXP: 0 });
              profileData.totalXP = 0;
            }
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
        const userId = getUserId();
        if (userId) {
          // If no leftover, we still just update the last checked month
          updateDoc(doc(db, 'users', userId), {
            lastCheckedMonth: currentMonthKey
          });
        }
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

    // Debounce: Skip if synced within 500ms
    const now = Date.now();
    if (now - lastSyncTimeRef.current < 500) return;
    lastSyncTimeRef.current = now;

    try {
      const budgetData = calculateMonthlyStats(transactions, userProfile);

      const currentMonthKey = budgetData.month;
      const budgetRef = doc(db, 'users', userId, 'monthlyBudgets', currentMonthKey);
      const nowTs = serverTimestamp();

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
        updatedAt: nowTs,
      };

      // Check if document exists
      const budgetSnap = await getDoc(budgetRef);
      if (!budgetSnap.exists()) {
        await setDoc(budgetRef, {
          ...updateData,
          createdAt: nowTs,
        });
      } else {
        await updateDoc(budgetRef, updateData);
      }

      console.log('✅ Monthly budget synced:', currentMonthKey);
    } catch (e) {
      console.error('Error syncing monthly budget:', e);
    }
  };

  // --- NEW FUNCTION: Check if budget can accommodate transaction ---
  const canAccommodateTransaction = (amount: number, category: 'needs' | 'wants'): boolean => {
    const stats = calculateMonthlyStats(transactions, userProfile);
    const { needs, wants, savings20 } = stats.budget;

    // Calculate total available budget
    const needsAvailable = Math.max(0, needs.remaining);
    const wantsAvailable = Math.max(0, wants.remaining);
    const savingsBuffer = Math.max(0, savings20.pending); // Unsaved savings can be used as emergency buffer

    const totalAvailable = needsAvailable + wantsAvailable + savingsBuffer;

    if (amount > totalAvailable) {
      // Show budget exceeded modal
      setBudgetExceededInfo({
        needsRemaining: needsAvailable,
        wantsRemaining: wantsAvailable,
        savingsUnsaved: savingsBuffer,
        transactionAmount: amount,
      });
      setShowBudgetExceededModal(true);
      return false;
    }
    return true;
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

  const handleRefresh = async () => {
    setRefreshing(true);
    if (userProfile && transactions.length > 0) {
      checkLeftoverBalance(userProfile, transactions);
      await syncMonthlyBudget();
    }
    // Refresh notification count
    const count = await NotificationService.getUnreadCount();
    setUnreadNotificationCount(count);
    // UX feedback delay
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleResetMonth = async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const currentMonthKey = getMonthKey(new Date().toISOString());
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      const lastMonthKey = getMonthKey(lastMonthDate.toISOString());

      // 1. Revert lastCheckedMonth
      await updateDoc(doc(db, 'users', userId), {
        lastCheckedMonth: lastMonthKey
      });

      // 2. Find and Delete Carried Over transaction for Jan 2026
      const transRef = collection(db, 'users', userId, 'transactions');
      const q = query(
        transRef,
        where('subCategory', '==', 'Carried Over')
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      const today = new Date();
      const currentMonthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.date >= currentMonthStart) {
          batch.delete(doc.ref);
        }
      });
      await batch.commit();

      showMessage('State reset. Restart the app or refresh to see the modal!');
      // Force local state update if needed, but Firebase listeners usually handle it.
    } catch (e) {
      console.error('Error resetting month: ', e);
      showMessage('Error resetting month.');
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

      // --- AGGRESSIVE GAMIFICATION LOGIC (INCREMENTAL DETECTION) ---
      // Calculate state BEFORE this transaction
      const beforeStats = calculateMonthlyStats(transactions, userProfile);
      const beforeSavingsUsed = beforeStats.budget.savings20.usedByOverflow;
      const beforeNeedsOverflow = beforeStats.budget.needs.overflow;
      const beforeWantsOverflow = beforeStats.budget.wants.overflow;

      // Calculate state AFTER this transaction
      const tempTransactions = [...transactions, ...(Array.isArray(transaction) ? transaction : [transaction])];
      const afterStats = calculateMonthlyStats(tempTransactions, userProfile);
      const afterSavingsUsed = afterStats.budget.savings20.usedByOverflow;
      const afterNeedsOverflow = afterStats.budget.needs.overflow;
      const afterWantsOverflow = afterStats.budget.wants.overflow;

      // Calculate the DELTA (change caused by THIS transaction)
      const deltaSavingsUsed = afterSavingsUsed - beforeSavingsUsed;
      const deltaNeedsOverflow = afterNeedsOverflow - beforeNeedsOverflow;
      const deltaWantsOverflow = afterWantsOverflow - beforeWantsOverflow;

      let xpChange = 0;
      let penaltyType: 'savings' | 'overflow' | null = null;

      // 1. CRITICAL: Did THIS transaction cause a NEW savings dip?
      if (deltaSavingsUsed > 0) {
        xpChange = XP_REWARDS.SAVINGS_DIP_PENALTY; // -500 XP
        penaltyType = 'savings';
      }
      // 2. WARNING: Did THIS transaction cause a NEW category overflow?
      else if (deltaNeedsOverflow > 0 || deltaWantsOverflow > 0) {
        xpChange = XP_REWARDS.CATEGORY_OVERFLOW_PENALTY; // -250 XP
        penaltyType = 'overflow';
      }
      // 3. REWARD: Good behavior - no new overflows
      else {
        // Standard reward calculation
        if (Array.isArray(transaction)) {
          transaction.forEach(t => {
            xpChange += XP_REWARDS.TRANSACTION_LOGGED;
            if (t.category === 'savings') {
              xpChange += Math.floor(Math.abs(t.amount) * XP_REWARDS.SAVING_RM1);
            }
          });
        } else {
          xpChange += XP_REWARDS.TRANSACTION_LOGGED;
          if (transaction.category === 'savings') {
            xpChange += Math.floor(Math.abs(transaction.amount) * XP_REWARDS.SAVING_RM1);
          }
        }
      }

      // Apply XP Change (Positive or Negative)
      handleAwardXP(xpChange);

      // --- FEEDBACK & NOTIFICATIONS ---
      if (showMsg) {
        if (penaltyType === 'savings') {
          // Trigger CRITICAL Modal
          setBudgetExceededInfo({
            needsRemaining: afterStats.budget.needs.remaining,
            wantsRemaining: afterStats.budget.wants.remaining,
            savingsUnsaved: afterStats.budget.savings20.pending,
            transactionAmount: Array.isArray(transaction) ? transaction.reduce((sum, t) => sum + t.amount, 0) : transaction.amount,
          });
          setShowBudgetExceededModal(true);
        } else if (penaltyType === 'overflow') {
          // Trigger WARNING Modal
          setBudgetExceededInfo({
            needsRemaining: afterStats.budget.needs.remaining,
            wantsRemaining: afterStats.budget.wants.remaining,
            savingsUnsaved: afterStats.budget.savings20.pending,
            transactionAmount: Array.isArray(transaction) ? transaction.reduce((sum, t) => sum + t.amount, 0) : transaction.amount,
          });
          setShowBudgetExceededModal(true);
        } else {
          // Success
          showMessage('Transaction added. +XP Gained!');
        }
      }

      // Sync budget after adding transaction
      setTimeout(() => syncMonthlyBudget(), 100);
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

  const handleDeleteTransactions = async (transactionIds: string[]) => {
    const userId = getUserId();
    if (!userId || transactionIds.length === 0) return;
    try {
      const batch = writeBatch(db);
      transactionIds.forEach((tid) => {
        batch.delete(doc(db, 'users', userId, 'transactions', tid));
      });
      await batch.commit();

      // Sync budget after deletion
      setTimeout(() => syncMonthlyBudget(), 100);
    } catch (e) {
      console.error('Error deleting transactions: ', e);
      showMessage('Error deleting transactions.');
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
    const historicalStats = calculateAllMonthlyStats(transactions, userProfile);
    const budgetContext = formatBudgetForRAG(budgetData) + formatHistoricalRAG(historicalStats);

    // 4. START STREAMING VIA XHR
    setStreamingResponse('');
    setIsBotThinking(true);
    setThinkingMessage('Processing your request...');
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
                if (data.message) setThinkingMessage(data.message);
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

      // Send payload WITH BUDGET CONTEXT AND TRANSACTIONS
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
      } catch (fallbackError) {
        await addDoc(messagesRef, {
          text: 'Sorry, I am having trouble connecting. Please try again later.',
          sender: 'bot',
          createdAt: serverTimestamp(),
        });
      }
    }).finally(() => {
      setStreamingResponse('');
      setIsBotThinking(false);
      setThinkingMessage('');
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
    } finally {
      setIsBotThinking(false);
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
        createdAt: serverTimestamp(),
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
    // --- 1. PREVENT NEGATIVE XP (Level Floor at 1) ---
    const newXP = Math.max(0, currentXP + xp);

    const oldLevel = calculateLevel(currentXP);
    const newLevel = calculateLevel(newXP);

    // Prepare update object
    const updateData: any = { totalXP: newXP };

    if (newLevel > oldLevel) {
      showMessage(`🎉 Level Up! You reached Level ${newLevel}!`);
      // Auto-evolve ONLY if they are using the generic 'bear' string
      if (userProfile.avatar === 'bear') {
        updateData.avatar = getAvatarForLevel(newLevel);
      }
    } else if (newLevel < oldLevel) {
      // --- 2. AUTOMATIC DOWNGRADE ---
      // If user's level drops, check if their current bear avatar is now "too high"
      if (userProfile.avatar && userProfile.avatar.startsWith('bear_level_')) {
        const avatarLevel = parseInt(userProfile.avatar.replace('bear_level_', ''), 10);
        // If current avatar requirement is higher than new level, force downgrade
        if (avatarLevel > newLevel) {
          updateData.avatar = getAvatarForLevel(newLevel);
        }
      }
    }

    await updateDoc(doc(db, 'users', userId), updateData);
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

  const handleGlobalNavigate = (screen: string) => {
    if (navigationRef.isReady()) {
      // @ts-ignore
      navigationRef.navigate(screen as any, screen === 'Chatbot' ? {} : undefined);
    }
  };

  // Show bottom nav on screens that should have it
  const showBottomNav = ['Home', 'Expenses', 'Profile'].includes(currentRoute);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer
          ref={navigationRef}
          onStateChange={(state) => {
            // Get the current route from the state
            const routes = state?.routes;
            if (routes && routes.length > 0) {
              const currentRouteName = routes[routes.length - 1].name;
              setCurrentRoute(currentRouteName);
            }
          }}
          onReady={() => {
            const routeName = navigationRef.getCurrentRoute()?.name;
            if (routeName) setCurrentRoute(routeName);
          }}
        >
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{
              headerShown: false,
              animation: 'none',
            }}
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
                        } else if (screen === 'Notifications') {
                          navigation.navigate('Notifications');
                          // Refresh count after viewing notifications
                          setTimeout(() => {
                            NotificationService.getUnreadCount().then(setUnreadNotificationCount);
                          }, 500);
                        } else {
                          navigation.navigate(screen as keyof RootStackParamList)
                        }
                      }}
                      transactions={transactions}
                      userName={userProfile?.name || 'User'}
                      userAvatar={userProfile?.avatar || 'bear'}
                      userXP={userProfile?.totalXP || 0}
                      onResetMonth={handleResetMonth}
                      refreshing={refreshing}
                      onRefresh={handleRefresh}
                      unreadNotificationCount={unreadNotificationCount}
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
                  {({ navigation }) => {
                    const stats = calculateMonthlyStats(transactions, userProfile);
                    const monthlyBalance = stats.budget.needs.remaining + stats.budget.wants.remaining + stats.budget.savings20.pending;
                    return (
                      <AddTransactionScreen
                        onBack={() => navigation.goBack()}
                        showMessage={showMessage}
                        onAddTransaction={(tx, showMsg = true) => handleAddTransaction(tx, showMsg)}
                        canAccommodateBudget={canAccommodateTransaction}
                        monthlyBalance={Math.max(0, monthlyBalance)}
                        onNavigateToAddMoney={() => navigation.navigate('AddMoney')}
                      />
                    );
                  }}
                </Stack.Screen>
                <Stack.Screen
                  name="Chatbot"
                  options={{
                    animation: 'slide_from_bottom',
                  }}
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
                      isBotThinking={isBotThinking}
                      thinkingMessage={thinkingMessage}
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
                      onAskAI={(message) => {
                        // Navigate immediately, let ChatbotScreen handle the creation & sending
                        navigation.navigate('Chatbot', { prefillMessage: message });
                      }}
                      onUpdateTransaction={handleUpdateTransaction}
                      onDeleteTransaction={handleDeleteTransaction}
                      onDeleteTransactions={handleDeleteTransactions}
                      onAddTransaction={handleAddTransaction}
                      refreshing={refreshing}
                      onRefresh={handleRefresh}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name="Savings">
                  {({ navigation }) => (
                    <SavingsScreen
                      onBack={() => navigation.goBack()}
                      transactions={transactions}
                      onAddTransaction={(tx) => handleAddTransaction(tx)}
                      refreshing={refreshing}
                      onRefresh={handleRefresh}
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
                <Stack.Screen name="Notifications">
                  {({ navigation }) => (
                    <NotificationsScreen
                      onBack={() => navigation.goBack()}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name="PrivacySecurity">
                  {({ navigation }) => (
                    <PrivacySecurityScreen
                      onBack={() => navigation.goBack()}
                    />
                  )}
                </Stack.Screen>
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>

        {/* Global Bottom Nav */}
        {showBottomNav && (
          <SafeAreaView style={styles.bottomNavSafeArea} edges={['bottom']}>
            <View style={styles.bottomNav}>
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => handleGlobalNavigate('Home')}
              >
                <Icon name="home" size={26} color={currentRoute === 'Home' ? COLORS.accent : COLORS.darkGray} />
                <Text style={currentRoute === 'Home' ? styles.navTextActive : styles.navText}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => handleGlobalNavigate('Expenses')}
              >
                <Icon name="pie-chart" size={26} color={currentRoute === 'Expenses' ? COLORS.accent : COLORS.darkGray} />
                <Text style={currentRoute === 'Expenses' ? styles.navTextActive : styles.navText}>Expenses</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => handleGlobalNavigate('Chatbot')}
              >
                <Icon name="message-square" size={26} color={currentRoute === 'Chatbot' ? COLORS.accent : COLORS.darkGray} />
                <Text style={currentRoute === 'Chatbot' ? styles.navTextActive : styles.navText}>Chatbot</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => handleGlobalNavigate('Profile')}
              >
                <Icon name="user" size={26} color={currentRoute === 'Profile' ? COLORS.accent : COLORS.darkGray} />
                <Text style={currentRoute === 'Profile' ? styles.navTextActive : styles.navText}>Profile</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}

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
        <BudgetExceededModal
          visible={showBudgetExceededModal}
          onClose={() => setShowBudgetExceededModal(false)}
          budgetStatus={budgetExceededInfo}
        />
        <MessageModal
          visible={modalVisible}
          message={modalMessage}
          onDismiss={() => setModalVisible(false)}
        />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  bottomNavSafeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 20,
    zIndex: 1000,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4, // Minimal padding, let SafeAreaView handle the rest
    backgroundColor: COLORS.white,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 2,
  },
  navTextActive: {
    fontSize: 12,
    color: COLORS.accent,
    marginTop: 2,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#C8DBBE',
  },
});