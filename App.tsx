// App.tsx
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebaseConfig'; // Your config file
import {
  initializeAuth,
  getReactNativePersistence,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc, // <-- This is the function
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  where,
  writeBatch,
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
  Chatbot: { prefillMessage?: string };
  Expenses: undefined;
  Savings: undefined;
  Profile: undefined;
};

type AppNavigationProp = NativeStackNavigationProp<RootStackParamList>;
const Stack = createNativeStackNavigator<RootStackParamList>();

// --- Data Types ---
export type Advice = {
  id: string; // Firestore document ID
  text: string;
  date: string;
};

export type User = {
  name: string;
  avatar: string;
  age: string | number;
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
  id: string; // Firestore document ID
  icon: string;
  name: string;
  date: string; // ISO string
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

  // --- 1. Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        // User is logged out
        setUserProfile(null);
        setTransactions([]);
        setSavedAdvices([]);
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- 2. Data Listeners ---
  useEffect(() => {
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
            occupation: '',
            monthlyIncome: 0,
            financialSituation: '',
            financialGoals: '', // This empty string triggers Onboarding
            riskTolerance: '',
            cashFlow: '',
            lastCheckedMonth: getMonthKey(new Date().toISOString()),
            allocatedSavingsTarget: 0,
            hasSetInitialBalance: false, // Default to false
          });
        }

        // --- ★★★ THIS IS THE FIX ★★★ ---
        // I renamed the snapshot variable from 'doc' to 'profileDoc'
        // to prevent the variable shadowing bug.
        const unsubProfile = onSnapshot(doc(db, 'users', userId), (profileDoc) => {
          if (profileDoc.exists()) {
            const profileData = profileDoc.data() as User;
            // --- ★★★ END OF FIX ★★★ ---

            // --- Fix for race condition where name isn't set yet ---
            if (!profileData.name && firebaseUser.displayName) {
              // Now 'doc' here correctly refers to the IMPORTED FUNCTION
              updateDoc(doc(db, 'users', userId), { name: firebaseUser.displayName });
              profileData.name = firebaseUser.displayName; // Update locally for this render
            }
            
            setUserProfile(profileData);

            // Logic to show InitialBalanceModal
            if (
              profileData.financialGoals && // Onboarding is done
              !profileData.hasSetInitialBalance // Flag is not set
            ) {
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

        // Transactions Listener
        const transRef = collection(db, 'users', userId, 'transactions');
        const transQuery = query(transRef);
        const unsubTransactions = onSnapshot(transQuery, (snapshot) => {
          const transData: Transaction[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Transaction[];
          setTransactions(transData);
          if (userProfile) {
            checkLeftoverBalance(userProfile, transData);
          }
        });

        // Saved Advice Listener
        const adviceRef = collection(db, 'users', userId, 'savedAdvices');
        const adviceQuery = query(adviceRef);
        const unsubAdvices = onSnapshot(adviceQuery, (snapshot) => {
          const adviceData: Advice[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Advice[];
          setSavedAdvices(adviceData);
        });

        return () => {
          unsubProfile();
          unsubTransactions();
          unsubAdvices();
        };
      }
    };
    
    setupListeners();
  
  }, [firebaseUser]); 

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
      const transRef = collection(db, 'users', userId, 'transactions');

      if (Array.isArray(transaction)) {
        transaction.forEach((t) => {
          const docRef = doc(transRef);
          batch.set(docRef, t);
        });
      } else {
        const docRef = doc(transRef);
        batch.set(docRef, transaction);
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

  const handleSaveAdvice = async (adviceText: string) => {
    const userId = getUserId();
    if (!userId) return;
    try {
      await addDoc(collection(db, 'users', userId, 'savedAdvices'), {
        text: adviceText,
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
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
      throw e; // Re-throw error so OnboardingScreen can catch it
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
        batch.set(doc(transRef), {
          icon: 'wallet',
          name: 'Initial Balance',
          date: new Date().toISOString().split('T')[0],
          amount: amount,
          type: 'income',
          category: 'income',
          subCategory: 'Initial',
          isCarriedOver: false,
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

  // --- VIEW (Rendering) ---

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
    <>
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
                    onNavigate={(screen: Screen) =>
                      navigation.navigate(screen as keyof RootStackParamList)
                    }
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
                    onBack={() => navigation.goBack()}
                    transactions={transactions}
                    // --- ★★★ THIS IS THE CHANGE ★★★ ---
                    userProfile={userProfile!} 
                    // --- ★★★ END OF CHANGE ★★★ ---
                    route={route}
                    onSaveAdvice={handleSaveAdvice}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Expenses">
                {({ navigation }) => (
                  <ExpensesScreen
                    onBack={() => navigation.goBack()}
                    transactions={transactions}
                    onNavigate={(screen: Screen) =>
                      navigation.navigate(screen as keyof RootStackParamList)
                    }
                    onAskAI={(message) =>
                      navigation.navigate('Chatbot', { prefillMessage: message })
                    }
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
                    onNavigate={(screen: Screen) =>
                      navigation.navigate(screen as keyof RootStackParamList)
                    }
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
    </>
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