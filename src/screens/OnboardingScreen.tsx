// src/screens/OnboardingScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/colors';
import { User } from '../../App';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type OnboardingScreenProps = {
  onComplete: (data: Partial<User>, isRetake: boolean) => Promise<void>;
  showMessage: (message: string) => void;
  initialData?: Partial<User>;
  isRetake?: boolean;
  navigation?: NativeStackNavigationProp<RootStackParamList>;
};

// --- ★★★ ADDED THIS LIST ★★★ ---
const malaysianStates = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Pulau Pinang',
  'Perak',
  'Perlis',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
  'W.P. Kuala Lumpur',
  'W.P. Labuan',
  'W.P. Putrajaya',
];

export const OnboardingScreen = ({
  onComplete,
  showMessage,
  initialData,
  isRetake,
  navigation,
}: OnboardingScreenProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState(initialData?.name || '');
  const [age, setAge] = useState(initialData?.age?.toString() || '');
  const [state, setState] = useState(initialData?.state || ''); // <-- ★★★ ADDED ★★★
  const [occupation, setOccupation] = useState(initialData?.occupation || '');
  const [monthlyIncome, setMonthlyIncome] = useState(
    initialData?.monthlyIncome?.toString() || ''
  );
  const [mainGoal, setMainGoal] = useState(
    initialData?.financialGoals || ''
  );
  const [biggestChallenge, setBiggestChallenge] = useState(
    initialData?.financialSituation || ''
  );
  const [spendingStyle, setSpendingStyle] = useState(
    initialData?.riskTolerance || ''
  );
  const [trackingMethod, setTrackingMethod] = useState(
    initialData?.cashFlow || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [otherText, setOtherText] = useState('');

  const questions = [
    {
      id: 'age',
      icon: 'calendar',
      question: 'How old are you?',
      placeholder: 'Enter your age',
      value: age,
      setValue: setAge,
      keyboardType: 'numeric' as const,
      hint: 'We use this to give you age-appropriate advice',
      validation: (val: string) => {
        const num = parseInt(val);
        return !isNaN(num) && num >= 18 && num <= 30;
      },
      error: 'Age must be between 18 and 30',
    },
    // --- ★★★ ADDED THIS NEW QUESTION OBJECT ★★★ ---
    {
      id: 'state',
      icon: 'map-pin',
      question: 'Which state are you in?',
      placeholder: 'Select your state',
      value: state,
      setValue: setState,
      keyboardType: 'default' as const,
      hint: 'This helps us personalize advice based on your cost of living',
      type: 'radio',
      options: malaysianStates,
    },
    // --- END OF NEW QUESTION ---
    {
      id: 'occupation',
      icon: 'briefcase',
      question: 'What do you do?',
      placeholder: 'e.g., Student, Engineer, Teacher',
      value: occupation,
      setValue: setOccupation,
      keyboardType: 'default' as const,
      hint: 'Your job or current activity',
      suggestions: [
        'Student',
        'Engineer',
        'Teacher',
        'Business Owner',
        'Freelancer',
        'Other',
      ],
    },
    {
      id: 'monthlyIncome',
      icon: 'trending-up',
      question: 'Monthly income (if any)',
      placeholder: 'Enter amount or 0',
      value: monthlyIncome,
      setValue: setMonthlyIncome,
      keyboardType: 'numeric' as const,
      hint: 'How much do you earn per month? Enter 0 if none',
      prefix: 'RM ',
      validation: (val: string) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
      },
      error: 'Please enter a valid amount (0 or more)',
    },
    {
      id: 'mainGoal',
      icon: 'target',
      question: 'What is your main financial goal right now?',
      placeholder: 'Pick one that matters most to you',
      value: mainGoal,
      setValue: setMainGoal,
      keyboardType: 'default' as const,
      hint: 'Choose your top priority',
      type: 'radio',
      options: [
        'Save for emergency fund',
        'Pay off debt',
        'Save for a big purchase (car, phone, etc.)',
        'Build savings habit',
        'Invest for the future',
        'Other',
      ],
    },
    {
      id: 'biggestChallenge',
      icon: 'alert-circle',
      question: 'What is your biggest money challenge?',
      placeholder: 'Pick what you struggle with most',
      value: biggestChallenge,
      setValue: setBiggestChallenge,
      keyboardType: 'default' as const,
      hint: 'Be honest - this helps us help you better',
      type: 'radio',
      options: [
        'I spend too much on wants',
        'Unexpected expenses keep coming up',
        'Hard to stick to a budget',
        'Not earning enough',
        "Don't know where my money goes",
        'Other',
      ],
    },
    {
      id: 'spendingStyle',
      icon: 'shopping-bag',
      question: 'How would you describe your spending?',
      placeholder: 'Pick what sounds like you',
      value: spendingStyle,
      setValue: setSpendingStyle,
      keyboardType: 'default' as const,
      hint: 'Choose the one that fits you best',
      type: 'radio',
      options: [
        'Very careful - I rarely spend on wants',
        'Balanced - I save but also treat myself',
        'Spontaneous - I buy what I want',
        'Other',
      ],
    },
    {
      id: 'trackingMethod',
      icon: 'clipboard',
      question: 'How do you track your money now?',
      placeholder: 'Pick your current method',
      value: trackingMethod,
      setValue: setTrackingMethod,
      keyboardType: 'default' as const,
      hint: "Or tell us if you don't track at all",
      type: 'radio',
      options: [
        "I don't track it",
        'Mental notes only',
        'Notebook or notes app',
        'Bank app statements',
        'Excel or budgeting app',
        'Other',
      ],
    },
  ];

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleNext = async () => {
    let value = currentQuestion.value.trim();
    if (currentQuestion.type === 'radio' && value === 'Other') {
      value = otherText.trim();
      if (!value) {
        showMessage('Please tell us your answer');
        return;
      }
      currentQuestion.setValue(value);
    } else if (!value) {
      showMessage('Please provide an answer');
      return;
    }
    if (currentQuestion.validation && !currentQuestion.validation(value)) {
      showMessage(currentQuestion.error || 'Invalid input');
      return;
    }
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
      if (currentQuestion.type !== 'radio') {
        setOtherText('');
      }
    } else {
      setIsLoading(true);
      try {
        const data: Partial<User> = {
          age: parseInt(age) || 0,
          state: state, // <-- ★★★ ADDED ★★★
          occupation,
          monthlyIncome: parseFloat(monthlyIncome) || 0,
          financialSituation: biggestChallenge,
          financialGoals: mainGoal,
          riskTolerance: spendingStyle,
          cashFlow: trackingMethod,
        };
        
        await onComplete(data, !!isRetake);
        if (navigation) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }
      } catch (error) {
        console.error('Onboarding onComplete failed:', error);
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (isRetake && navigation) {
      navigation.goBack();
    }
  };

  const isValid =
    !!currentQuestion.value.trim() &&
    !(
      currentQuestion.type === 'radio' &&
      currentQuestion.value === 'Other' &&
      !otherText.trim()
    );

  const renderInput = () => {
    if (currentQuestion.type === 'radio') {
      return (
        <View style={styles.suggestionsGrid}>
          {currentQuestion.options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.suggestionChip,
                currentQuestion.value === option &&
                  styles.suggestionChipSelected,
              ]}
              onPress={() => {
                currentQuestion.setValue(option);
                if (option !== 'Other') {
                  setOtherText('');
                }
              }}
            >
              <Text
                style={[
                  styles.suggestionText,
                  currentQuestion.value === option &&
                    styles.suggestionTextSelected,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
          {currentQuestion.value === 'Other' && (
            <TextInput
              style={styles.otherInput}
              placeholder="Type your answer here..."
              placeholderTextColor={COLORS.darkGray}
              value={otherText}
              onChangeText={setOtherText}
              autoFocus
            />
          )}
        </View>
      );
    }
    return (
      <View style={styles.inputContainer}>
        {currentQuestion.prefix && (
          <Text style={styles.prefixText}>{currentQuestion.prefix}</Text>
        )}
        <TextInput
          style={[
            styles.input,
            currentQuestion.prefix && styles.inputWithPrefix,
            currentQuestion.multiline && styles.multilineInput,
          ]}
          placeholder={currentQuestion.placeholder}
          placeholderTextColor={COLORS.darkGray}
          value={currentQuestion.value}
          onChangeText={currentQuestion.setValue}
          keyboardType={currentQuestion.keyboardType}
          autoFocus
          multiline={!!currentQuestion.multiline}
          numberOfLines={currentQuestion.multiline ? 4 : 1}
          textAlignVertical={currentQuestion.multiline ? 'top' : 'center'}
        />
      </View>
    );
  };

  const renderSuggestions = () => {
    if (currentQuestion.suggestions && !currentQuestion.value) {
      return (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Quick select:</Text>
          <View style={styles.suggestionsGrid}>
            {currentQuestion.suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionChip}
                onPress={() => currentQuestion.setValue(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={COLORS.accent} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <Text style={styles.stepText}>
              {currentStep + 1} of {questions.length}
            </Text>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcon
                name={currentQuestion.icon}
                size={40}
                color={COLORS.accent}
              />
            </View>
          </View>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          <Text style={styles.hintText}>{currentQuestion.hint}</Text>
          {renderInput()}
          {renderSuggestions()}
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !isValid && styles.continueButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.continueButtonText}>
                  {currentStep === questions.length - 1
                    ? isRetake
                      ? 'Update'
                      : 'Complete'
                    : 'Continue'}
                </Text>
                <Icon
                  name={
                    currentStep === questions.length - 1 ? 'check' : 'arrow-right'
                  }
                  size={20}
                  color={COLORS.white}
                  style={styles.buttonIcon}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  questionText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 12,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 15,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  prefixText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.accent,
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    padding: 18,
    fontSize: 18,
    color: COLORS.accent,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  inputWithPrefix: {
    flex: 1,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  suggestionsContainer: {
    marginTop: 10,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 12,
    fontWeight: '600',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionChip: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  suggestionChipSelected: {
    backgroundColor: COLORS.accent,
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
  },
  suggestionTextSelected: {
    color: COLORS.white,
  },
  otherInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    padding: 18,
    fontSize: 18,
    color: COLORS.accent,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginTop: 10,
    width: '100%',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  continueButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 15,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.darkGray,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});