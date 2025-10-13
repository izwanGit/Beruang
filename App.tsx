import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- Color Palette ---
const COLORS = {
  primary: '#C8DBBE',
  secondary: '#9F8772',
  accent: '#665A48',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  darkGray: '#A9A9A9',
  success: '#4CAF50',
  danger: '#F44336',
  info: '#2196F3',
};

// --- AI Categorization Function ---
const categorizeTransaction = async (description) => {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: description,
          parameters: {
            candidate_labels: ["essential needs", "wants and lifestyle"]
          }
        })
      }
    );

    const result = await response.json();

    if (result.labels && result.scores) {
      const topLabel = result.labels[0];
      return topLabel.includes("essential") ? "needs" : "wants";
    }

    return simpleCategorizeFallback(description);
  } catch (error) {
    console.log("AI categorization failed, using fallback:", error);
    return simpleCategorizeFallback(description);
  }
};

// --- Simple Fallback Categorization ---
const simpleCategorizeFallback = (description) => {
  const desc = description.toLowerCase();

  const needsKeywords = ['grocery', 'groceries', 'rent', 'utilities', 'bill', 'medication', 'medicine', 'doctor', 'hospital', 'insurance', 'transport', 'fuel', 'gas', 'electricity', 'water', 'internet', 'phone'];
  const wantsKeywords = ['starbucks', 'coffee', 'movie', 'cinema', 'restaurant', 'shopping', 'game', 'entertainment', 'vacation', 'hobby', 'gym', 'subscription', 'netflix', 'spotify'];

  for (let keyword of needsKeywords) {
    if (desc.includes(keyword)) return 'needs';
  }

  for (let keyword of wantsKeywords) {
    if (desc.includes(keyword)) return 'wants';
  }

  return 'wants';
};

// --- Reusable Message Modal Component ---
type MessageModalProps = {
  visible: boolean;
  message: string;
  onDismiss: () => void;
};

const MessageModal: React.FC<MessageModalProps> = ({ visible, message, onDismiss }) => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={visible}
    onRequestClose={onDismiss}
  >
    <View style={sharedStyles.modalOverlay}>
      <View style={sharedStyles.modalContent}>
        <Text style={sharedStyles.modalText}>{message}</Text>
        <TouchableOpacity style={sharedStyles.modalButton} onPress={onDismiss}>
          <Text style={sharedStyles.modalButtonText}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// --- Login Screen Component ---
type LoginScreenProps = {
  onLogin: () => void;
};

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  return (
    <SafeAreaView style={loginStyles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={loginStyles.logoContainer}>
        <MaterialCommunityIcon name="bear" size={80} color={COLORS.accent} />
        <Text style={loginStyles.title}>BERUANG</Text>
        <Text style={loginStyles.subtitle}>Your Personal Finance Companion</Text>
      </View>

      <View style={loginStyles.inputContainer}>
        <View style={loginStyles.inputView}>
          <Icon name="mail" size={20} color={COLORS.accent} style={loginStyles.inputIcon} />
          <TextInput
            placeholder="Email"
            placeholderTextColor={COLORS.darkGray}
            style={loginStyles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={loginStyles.inputView}>
          <Icon name="lock" size={20} color={COLORS.accent} style={loginStyles.inputIcon} />
          <TextInput
            placeholder="Password"
            placeholderTextColor={COLORS.darkGray}
            style={loginStyles.input}
            secureTextEntry
          />
        </View>
      </View>

      <TouchableOpacity style={loginStyles.loginButton} onPress={onLogin}>
        <Text style={loginStyles.loginButtonText}>Login</Text>
      </TouchableOpacity>

      <View style={loginStyles.footer}>
        <TouchableOpacity>
          <Text style={loginStyles.footerText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// --- Home Screen Component ---
type HomeScreenProps = {
  onNavigate: (screen: Screen) => void;
  transactions: Array<any>;
}

const HomeScreen = ({ onNavigate, transactions }: HomeScreenProps) => {
  type BudgetCategoryProps = {
    name: string;
    spent: number;
    total: number;
    color: string;
  };

  const BudgetCategory: React.FC<BudgetCategoryProps> = ({ name, spent, total, color }) => (
    <View style={homeStyles.budgetCategory}>
      <View style={homeStyles.budgetCategoryHeader}>
        <Text style={homeStyles.budgetCategoryName}>{name}</Text>
        <Text style={homeStyles.budgetCategoryAmount}>RM {spent.toFixed(2)} / RM {total.toFixed(2)}</Text>
      </View>
      <View style={homeStyles.progressBarBackground}>
        <View style={[homeStyles.progressBar, { width: `${Math.min((spent / total) * 100, 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );

  // Calculate budget breakdown
  const expenses = transactions.filter(t => t.type === 'expense');
  const needsTotal = expenses.filter(t => t.category === 'needs').reduce((sum, t) => sum + t.amount, 0);
  const wantsTotal = expenses.filter(t => t.category === 'wants').reduce((sum, t) => sum + t.amount, 0);
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = needsTotal + wantsTotal;
  const balance = income - totalExpenses;

  return (
    <SafeAreaView
      style={homeStyles.container}
      edges={['right', 'bottom', 'left']}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.accent} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={homeStyles.header}>
          <View>
            <Text style={homeStyles.greeting}>Hello, Izwan!</Text>
            <Text style={homeStyles.headerDate}>Welcome back to Beruang</Text>
          </View>
          <TouchableOpacity>
            <Icon name="bell" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={homeStyles.balanceCard}>
          <Text style={homeStyles.balanceLabel}>Total Balance</Text>
          <Text style={homeStyles.balanceAmount}>RM {balance.toFixed(2)}</Text>
          <View style={homeStyles.incomeExpenseContainer}>
            <View style={homeStyles.incomeExpenseBox}>
              <Icon name="arrow-down" size={20} color={COLORS.success} />
              <View style={{ marginLeft: 8 }}>
                <Text style={homeStyles.incomeExpenseLabel}>Income</Text>
                <Text style={homeStyles.incomeExpenseAmount}>RM {income.toFixed(2)}</Text>
              </View>
            </View>
            <View style={homeStyles.incomeExpenseBox}>
              <Icon name="arrow-up" size={20} color={COLORS.danger} />
              <View style={{ marginLeft: 8 }}>
                <Text style={homeStyles.incomeExpenseLabel}>Expense</Text>
                <Text style={homeStyles.incomeExpenseAmount}>RM {totalExpenses.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={homeStyles.section}>
          <Text style={homeStyles.sectionTitle}>Budget Breakdown (50/30/20)</Text>
          <View style={homeStyles.budgetContainer}>
            <BudgetCategory name="Needs (50%)" spent={needsTotal} total={income * 0.5} color="#42a5f5" />
            <BudgetCategory name="Wants (30%)" spent={wantsTotal} total={income * 0.3} color="#ff7043" />
            <BudgetCategory name="Savings (20%)" spent={0} total={income * 0.2} color="#66bb6a" />
          </View>
        </View>

        <View style={homeStyles.section}>
          <Text style={homeStyles.sectionTitle}>Recent Transactions</Text>
          {transactions.slice().reverse().slice(0, 10).map(item => (
            <View key={item.id} style={homeStyles.transactionItem}>
              <View style={[homeStyles.transactionIcon, { backgroundColor: COLORS.primary }]}>
                <Icon name={item.icon} size={22} color={COLORS.accent} />
              </View>
              <View style={homeStyles.transactionDetails}>
                <Text style={homeStyles.transactionName}>{item.name}</Text>
                <Text style={homeStyles.transactionDate}>{item.date} • {item.category}</Text>
              </View>
              <Text style={[homeStyles.transactionAmount, { color: item.type === 'income' ? COLORS.success : COLORS.accent }]}>
                {item.type === 'income' ? '+' : '-'} RM {item.amount.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Mock Bottom Tab Navigator */}
      <View style={homeStyles.bottomNav}>
        <TouchableOpacity style={homeStyles.navItem} onPress={() => onNavigate('home')}>
          <Icon name="home" size={26} color={COLORS.accent} />
          <Text style={homeStyles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={homeStyles.navItem}>
          <Icon name="list" size={26} color={COLORS.darkGray} />
          <Text style={homeStyles.navText}>Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={homeStyles.fab} onPress={() => onNavigate('addTransaction')}>
          <Icon name="plus" size={30} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={homeStyles.navItem}>
          <Icon name="message-square" size={26} color={COLORS.darkGray} />
          <Text style={homeStyles.navText}>Chatbot</Text>
        </TouchableOpacity>
        <TouchableOpacity style={homeStyles.navItem}>
          <Icon name="user" size={26} color={COLORS.darkGray} />
          <Text style={homeStyles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// --- Add Transaction Screen Component ---
type AddTransactionScreenProps = {
  onBack: () => void;
  showMessage: (message: string) => void;
  onAddTransaction: (transaction: any) => void;
}

const AddTransactionScreen = ({ onBack, showMessage, onAddTransaction }: AddTransactionScreenProps) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveTransaction = async () => {
    if (!amount || !description) {
      showMessage('Please fill in both amount and description');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showMessage('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    showMessage('Analyzing transaction with AI...');

    try {
      // Use AI to categorize
      const category = await categorizeTransaction(description);

      const newTransaction = {
        id: Date.now().toString(),
        icon: 'shopping-cart',
        name: description,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        amount: amountNum,
        type: 'expense',
        category: category
      };

      onAddTransaction(newTransaction);
      setAmount('');
      setDescription('');
      showMessage(`Transaction saved! Categorized as: ${category.toUpperCase()}`);

      // Navigate back after 2 seconds
      setTimeout(() => {
        onBack();
      }, 2000);

    } catch (error) {
      showMessage('Error saving transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraPress = () => {
    showMessage('Camera feature coming soon!');
  };

  const handleUploadPress = () => {
    showMessage('Upload feature coming soon!');
  };

  return (
    <SafeAreaView style={addTransactionStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={addTransactionStyles.header}>
        <TouchableOpacity onPress={onBack} style={addTransactionStyles.backButton}>
          <Icon name="arrow-left" size={24} color={COLORS.accent} />
        </TouchableOpacity>
        <Text style={addTransactionStyles.headerTitle}>Add Transaction</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={addTransactionStyles.scrollContainer}>

        <View style={addTransactionStyles.section}>
          <Text style={addTransactionStyles.sectionTitle}>Enter Manually</Text>
          <View style={addTransactionStyles.inputView}>
            <Text style={addTransactionStyles.currencySymbol}>RM</Text>
            <TextInput
              placeholder="0.00"
              placeholderTextColor={COLORS.darkGray}
              style={addTransactionStyles.amountInput}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              editable={!isLoading}
            />
          </View>
          <TextInput
            placeholder="Description (e.g., Lunch with friends)"
            placeholderTextColor={COLORS.darkGray}
            style={addTransactionStyles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[addTransactionStyles.saveButton, isLoading && { opacity: 0.6 }]}
            onPress={handleSaveTransaction}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={addTransactionStyles.saveButtonText}>Save Transaction</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={addTransactionStyles.dividerContainer}>
          <View style={addTransactionStyles.divider} />
          <Text style={addTransactionStyles.dividerText}>OR</Text>
          <View style={addTransactionStyles.divider} />
        </View>

        <View style={addTransactionStyles.section}>
          <Text style={addTransactionStyles.sectionTitle}>Use a Receipt</Text>
          <View style={addTransactionStyles.receiptOptionsContainer}>
            <TouchableOpacity style={addTransactionStyles.receiptOption} onPress={handleCameraPress}>
              <Icon name="camera" size={30} color={COLORS.accent} />
              <Text style={addTransactionStyles.receiptOptionText}>Scan Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity style={addTransactionStyles.receiptOption} onPress={handleUploadPress}>
              <Icon name="image" size={30} color={COLORS.accent} />
              <Text style={addTransactionStyles.receiptOptionText}>Upload Image</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Main App Component ---
type Screen = 'login' | 'home' | 'addTransaction';

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [transactions, setTransactions] = useState([
    { id: '1', icon: 'shopping-cart', name: 'Groceries', date: 'Oct 12, 2025', amount: 120.50, type: 'expense', category: 'needs' },
    { id: '2', icon: 'briefcase', name: 'Salary', date: 'Oct 01, 2025', amount: 3500.00, type: 'income', category: 'income' },
    { id: '3', icon: 'coffee', name: 'Starbucks', date: 'Oct 11, 2025', amount: 18.00, type: 'expense', category: 'wants' },
    { id: '4', icon: 'film', name: 'Movie Tickets', date: 'Oct 10, 2025', amount: 45.00, type: 'expense', category: 'wants' },
  ]);

  const handleLogin = () => {
    setScreen('home');
  };

  const handleNavigate = (newScreen: Screen) => {
    setScreen(newScreen);
  }

  const showMessage = (message: string) => {
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleAddTransaction = (transaction: any) => {
    setTransactions([...transactions, transaction]);
  };

  const renderScreen = () => {
    switch (screen) {
      case 'login':
        return <LoginScreen onLogin={handleLogin} />;
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} transactions={transactions} />;
      case 'addTransaction':
        return <AddTransactionScreen onBack={() => handleNavigate('home')} showMessage={showMessage} onAddTransaction={handleAddTransaction} />;
      default:
        return <LoginScreen onLogin={handleLogin} />;
    }
  }

  return (
    <>
      {renderScreen()}
      <MessageModal
        visible={modalVisible}
        message={modalMessage}
        onDismiss={() => setModalVisible(false)}
      />
    </>
  );
}

// --- Shared Styles ---
const sharedStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 15,
    width: '80%',
    alignItems: 'center',
    elevation: 10,
  },
  modalText: {
    fontSize: 16,
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// --- Styles for LoginScreen ---
const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginTop: 10,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.accent,
    marginTop: 4,
  },
  inputContainer: {
    width: '100%',
  },
  inputView: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    height: 60,
    marginBottom: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.accent,
    fontSize: 16,
  },
  loginButton: {
    width: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 15,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 3,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.accent,
  },
});

// --- Styles for HomeScreen ---
const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingTop: 75,
    paddingBottom: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerDate: {
    fontSize: 14,
    color: COLORS.primary,
  },
  balanceCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: -40,
    elevation: 5,
  },
  balanceLabel: {
    color: COLORS.primary,
    fontSize: 16,
  },
  balanceAmount: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  incomeExpenseContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  incomeExpenseBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incomeExpenseLabel: {
    color: COLORS.primary,
    fontSize: 14,
  },
  incomeExpenseAmount: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 15,
  },
  budgetContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  budgetCategory: {
    marginBottom: 15,
  },
  budgetCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetCategoryName: {
    fontSize: 14,
    color: COLORS.accent,
  },
  budgetCategoryAmount: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  transactionIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 10,
    height: 65,
  },
  navItem: {
    alignItems: 'center',
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
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 35,
    alignSelf: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

// --- Styles for AddTransactionScreen ---
const addTransactionStyles = StyleSheet.create({
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
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  scrollContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 15,
  },
  inputView: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.accent,
    height: 70,
  },
  descriptionInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    paddingHorizontal: 20,
    height: 60,
    fontSize: 16,
    marginBottom: 20,
    color: COLORS.accent,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.darkGray,
  },
  dividerText: {
    marginHorizontal: 15,
    color: COLORS.darkGray,
    fontWeight: 'bold',
  },
  receiptOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  receiptOption: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    width: '45%',
    elevation: 3,
  },
  receiptOptionText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
  },
});