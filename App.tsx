// App.tsx (in your project root)
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Import our new components and screens
import { MessageModal } from './src/components/MessageModal';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { HomeScreen, Screen } from './src/screens/HomeScreen'; // Import Screen type
import { AddTransactionScreen } from './src/screens/AddTransactionScreen';
import { ChatbotScreen } from './src/screens/ChatbotScreen';
import { ExpensesScreen } from './src/screens/ExpensesScreen';
import { SavingsScreen } from './src/screens/SavingsScreen';

// --- Types for Navigation ---
// This defines what parameters each screen can accept
// We export this type so other screens (like ChatbotScreen) can use it
export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Onboarding: undefined;
  Home: undefined;
  AddTransaction: undefined;
  Chatbot: { prefillMessage?: string }; // <-- MODIFIED to accept params
  Expenses: undefined;
  Savings: undefined;
};

// Helper type for our navigation prop
type AppNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Stack = createNativeStackNavigator<RootStackParamList>();

// --- Main App Component (The CONTROLLER) ---
export default function App() {
  // --- MODEL (State) ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [transactions, setTransactions] = useState([
{
      id: '1',
      icon: 'shopping-cart',
      name: 'Groceries',
      date: '2025-10-12',
      amount: 120.5,
      type: 'expense',
      category: 'needs',
      subCategory: 'Food & Beverage',
    },
    {
      id: '2',
      icon: 'briefcase',
      name: 'Salary',
      date: '2025-10-01',
      amount: 3500.0,
      type: 'income',
      category: 'income',
      subCategory: 'Income',
    },
    {
      id: '3',
      icon: 'coffee',
      name: 'Starbucks',
      date: '2025-10-11',
      amount: 18.0,
      type: 'expense',
      category: 'wants',
      subCategory: 'Food & Beverage',
    },
    {
      id: '4',
      icon: 'film',
      name: 'Movie Tickets',
      date: '2025-10-10',
      amount: 45.0,
      type: 'expense',
      category: 'wants',
      subCategory: 'Entertainment',
    },
    {
      id: '5',
      icon: 'train',
      name: 'Bus Fare',
      date: '2025-09-30',
      amount: 50.0,
      type: 'expense',
      category: 'needs',
      subCategory: 'Transportation',
    },
    {
      id: '6',
      icon: 'phone',
      name: 'Phone Bill',
      date: '2025-09-25',
      amount: 80.0,
      type: 'expense',
      category: 'needs',
      subCategory: 'Telecommunication',
    },
    {
      id: '7',
      icon: 'calculator',
      name: 'Loan Payment',
      date: '2025-09-15',
      amount: 200.0,
      type: 'expense',
      category: 'needs',
      subCategory: 'Financial Services',
    },
    {
      id: '8',
      icon: 'shopping-cart',
      name: 'Online Shopping',
      date: '2025-08-20',
      amount: 150.0,
      type: 'expense',
      category: 'wants',
      subCategory: 'Shopping',
    },
    {
      id: '9',
      icon: 'utensils',
      name: 'Dinner Out',
      date: '2025-08-10',
      amount: 60.0,
      type: 'expense',
      category: 'wants',
      subCategory: 'Food & Beverage',
    },
    {
      id: '10',
      icon: 'calculator',
      name: 'Insurance',
      date: '2025-07-05',
      amount: 100.0,
      type: 'expense',
      category: 'needs',
      subCategory: 'Financial Services',
    },
    {
      id: '11',
      icon: 'train',
      name: 'Fuel',
      date: '2025-06-15',
      amount: 70.0,
      type: 'expense',
      category: 'needs',
      subCategory: 'Transportation',
    },
    {
      id: '12',
      icon: 'film',
      name: 'Netflix',
      date: '2025-10-01',
      amount: 40.0,
      type: 'expense',
      category: 'wants',
      subCategory: 'Entertainment',
    },
    {
      id: '13',
      icon: 'calculator',
      name: 'Rent',
      date: '2025-10-01',
      amount: 800.0,
      type: 'expense',
      category: 'needs',
      subCategory: 'Financial Services',
    },
    {
      id: '14',
      icon: 'phone',
      name: 'Internet Bill',
      date: '2025-10-05',
      amount: 100.0,
      type: 'expense',
      category: 'needs',
      subCategory: 'Telecommunication',
    },
    {
      id: '15',
      icon: 'train',
      name: 'Petrol',
      date: '2025-10-15',
      amount: 50.0,
      type: 'expense',
      category: 'needs',
      subCategory: 'Transportation',
    },
    {
      id: '16',
      icon: 'shopping-cart',
      name: 'Shopee Purchase',
      date: '2025-10-18',
      amount: 200.0,
      type: 'expense',
      category: 'wants',
      subCategory: 'Shopping',
    },
    {
      id: '17',
      icon: 'utensils',
      name: 'GrabFood Delivery',
      date: '2025-10-19',
      amount: 35.0,
      type: 'expense',
      category: 'wants',
      subCategory: 'Food & Beverage',
    },
    {
      id: '18',
      icon: 'more-horizontal',
      name: 'Gym Membership',
      date: '2025-10-20',
      amount: 50.0,
      type: 'expense',
      category: 'wants',
      subCategory: 'Others',
    },
    // Added more dummy data for October to populate the chart
    {
      id: '19',
      icon: 'calculator',
      name: 'Tax Payment',
      date: '2025-10-03',
      amount: 150.0,
      type: 'expense',
      category: 'needs',
      subCategory: 'Financial Services',
    },
    {
      id: '20',
      icon: 'phone',
      name: 'Mobile Data',
      date: '2025-10-07',
      amount: 30.0,
      type: 'expense',
      category: 'needs',
      subCategory: 'Telecommunication',
    },
    {
      id: '21',
      icon: 'shopping-cart',
      name: 'Clothing',
      date: '2025-10-16',
      amount: 100.0,
      type: 'expense',
      category: 'wants',
      subCategory: 'Shopping',
    },
    {
      id: '22',
      icon: 'film',
      name: 'Concert Ticket',
      date: '2025-10-17',
      amount: 80.0,
      type: 'expense',
      category: 'wants',
      subCategory: 'Entertainment',
    },
  ]);
  const [user, setUser] = useState({
    name: 'Izwan',
    age: '',
    occupation: '',
    monthlyIncome: 0,
    financialSituation: '',
    financialGoals: '',
    riskTolerance: '',
    cashFlow: '',
  });

  // --- CONTROLLER (Handlers) ---
  const showMessage = (message: string) => {
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleAddTransaction = (transaction: any) => {
    setTransactions([...transactions, transaction]);
  };

  const handleSignUpSuccess = (name: string, navigation: AppNavigationProp) => {
    setUser({ ...user, name });
    navigation.navigate('Onboarding');
  };

  const handleOnboardingComplete = (data: any, navigation: AppNavigationProp) => {
    setUser({ ...user, ...data });
    // Add a dummy income transaction based on onboarding
    const incomeTransaction = {
      id: Date.now().toString(),
      icon: 'briefcase',
      name: 'Monthly Income',
      date: new Date().toISOString().split('T')[0],
      amount: data.monthlyIncome,
      type: 'income',
      category: 'income',
      subCategory: 'Income',
    };
    setTransactions([...transactions, incomeTransaction]);
    navigation.navigate('Home');
  };

  // --- VIEW (Rendering) ---
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          {/* We use the render function {} to pass props to our screens */}
          
          <Stack.Screen name="Login">
            {({ navigation }) => (
              <LoginScreen
                onLogin={() => navigation.navigate('Home')}
                onSignUp={() => navigation.navigate('SignUp')}
              />
            )}
          </Stack.Screen>
          
          <Stack.Screen name="SignUp">
            {({ navigation }) => (
              <SignUpScreen
                onBack={() => navigation.goBack()}
                onSignUpSuccess={(name) => handleSignUpSuccess(name, navigation)}
                showMessage={showMessage}
              />
            )}
          </Stack.Screen>
          
          <Stack.Screen name="Onboarding">
            {({ navigation }) => (
              <OnboardingScreen
                onComplete={(data) => handleOnboardingComplete(data, navigation)}
                showMessage={showMessage}
              />
            )}
          </Stack.Screen>
          
          <Stack.Screen name="Home">
            {({ navigation }) => (
              <HomeScreen
                onNavigate={(screen: Screen) => navigation.navigate(screen as keyof RootStackParamList)}
                transactions={transactions}
                userName={user.name}
              />
            )}
          </Stack.Screen>
          
          <Stack.Screen name="AddTransaction">
            {({ navigation }) => (
              <AddTransactionScreen
                onBack={() => navigation.goBack()}
                showMessage={showMessage}
                onAddTransaction={handleAddTransaction}
              />
            )}
          </Stack.Screen>
          
          <Stack.Screen name="Chatbot">
            {/* Pass the route prop so it can read params */}
            {({ navigation, route }) => (
              <ChatbotScreen
                onBack={() => navigation.goBack()}
                transactions={transactions}
                route={route} // <-- MODIFIED
              />
            )}
          </Stack.Screen>
          
          <Stack.Screen name="Expenses">
            {/* Pass the onNavigate and new onAskAI props */}
            {({ navigation }) => (
              <ExpensesScreen
                onBack={() => navigation.goBack()}
                transactions={transactions}
                onNavigate={(screen: Screen) => navigation.navigate(screen as keyof RootStackParamList)}
// --- ADDED THIS LINE ---
                onAskAI={(message) => navigation.navigate('Chatbot', { prefillMessage: message })}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Savings">
            {({ navigation }) => (
              <SavingsScreen
                onBack={() => navigation.goBack()}
                transactions={transactions}
                onAddTransaction={handleAddTransaction}
              />
            )}
          </Stack.Screen>
          
        </Stack.Navigator>
      </NavigationContainer>
      
      {/* The MessageModal stays outside the navigator to overlay everything */}
      <MessageModal
        visible={modalVisible}
        message={modalMessage}
        onDismiss={() => setModalVisible(false)}
      />
    </>
  );
}