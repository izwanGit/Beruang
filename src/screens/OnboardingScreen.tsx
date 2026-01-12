// src/screens/OnboardingScreen.tsx
import React, { useState, useEffect } from 'react';
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
  Dimensions,
  LayoutAnimation,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/colors';
import { User } from '../../App';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

const { width, height } = Dimensions.get('window');

type OnboardingScreenProps = {
  onComplete: (data: Partial<User>, isRetake: boolean) => Promise<void>;
  showMessage: (message: string) => void;
  initialData?: Partial<User>;
  isRetake?: boolean;
  navigation?: NativeStackNavigationProp<RootStackParamList>;
};

const malaysianStates = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan',
  'Pahang', 'Pulau Pinang', 'Perak', 'Perlis', 'Sabah',
  'Sarawak', 'Selangor', 'Terengganu', 'Kuala Lumpur',
  'Labuan', 'Putrajaya',
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
  const [state, setState] = useState(initialData?.state || '');
  const [occupation, setOccupation] = useState(initialData?.occupation || '');
  const [monthlyIncome, setMonthlyIncome] = useState(initialData?.monthlyIncome?.toString() || '');
  const [mainGoal, setMainGoal] = useState(initialData?.financialGoals || '');
  const [biggestChallenge, setBiggestChallenge] = useState(initialData?.financialSituation || '');
  const [spendingStyle, setSpendingStyle] = useState(initialData?.riskTolerance || '');
  const [trackingMethod, setTrackingMethod] = useState(initialData?.cashFlow || '');
  const [isLoading, setIsLoading] = useState(false);

  // Group steps for logical flow
  const stepGroups = [
    { title: 'Identity', range: [0, 1] },
    { title: 'Lifestyle', range: [2, 4] },
    { title: 'Goals', range: [5, 8] },
  ];

  const getCurrentGroup = () => {
    return stepGroups.find(g => currentStep >= g.range[0] && currentStep <= g.range[1])?.title || 'Profile';
  };

  const questions = [
    {
      id: 'name',
      icon: 'account-tag-outline',
      question: "Full Name?",
      placeholder: 'E.g. Izwan Hakim',
      value: name,
      setValue: setName,
      keyboardType: 'default' as const,
      hint: 'Your identity in our financial ecosystem.',
    },
    {
      id: 'age',
      icon: 'star-shooting-outline',
      question: 'Your Age?',
      placeholder: 'Age (18-30)',
      value: age,
      setValue: setAge,
      keyboardType: 'numeric' as const,
      hint: 'This program is tailored for young Malaysians.',
      validation: (val: string) => {
        const num = parseInt(val);
        return !isNaN(num) && num >= 18 && num <= 30;
      },
      error: 'Access limited to age 18-30.',
    },
    {
      id: 'state',
      icon: 'castle',
      question: 'Residencing State?',
      placeholder: 'Select state',
      value: state,
      setValue: setState,
      keyboardType: 'default' as const,
      hint: 'Localizing cost-of-living metrics.',
      type: 'grid',
      options: malaysianStates,
    },
    {
      id: 'occupation',
      icon: 'notebook-outline',
      question: 'Occupation?',
      placeholder: 'E.g. Final Year Student',
      value: occupation,
      setValue: setOccupation,
      keyboardType: 'default' as const,
      hint: 'Your career stage affects your budget.',
      suggestions: ['Student', 'Engineer', 'Government', 'Freelancer', 'Others'],
    },
    {
      id: 'monthlyIncome',
      icon: 'currency-usd',
      question: 'Monthly Income?',
      placeholder: 'Enter amount',
      value: monthlyIncome,
      setValue: setMonthlyIncome,
      keyboardType: 'numeric' as const,
      hint: 'Includes allowance & salary.',
      prefix: 'RM',
      validation: (val: string) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
      },
      error: 'Enter a valid numeric value.',
    },
    {
      id: 'mainGoal',
      icon: 'trophy-outline',
      question: 'Primary Aim?',
      placeholder: 'Select focus',
      value: mainGoal,
      setValue: setMainGoal,
      keyboardType: 'default' as const,
      hint: 'What do you want to master first?',
      type: 'radio',
      options: [
        'Build Emergency Fund',
        'Settle All Debts',
        'Save for Marriage/House',
        'Start Investing',
        'Break Paycheck Cycle',
      ],
    },
    {
      id: 'biggestChallenge',
      icon: 'lightning-bolt-outline',
      question: 'Money Obstacle?',
      placeholder: 'Be honest',
      value: biggestChallenge,
      setValue: setBiggestChallenge,
      keyboardType: 'default' as const,
      hint: 'Where do you struggle most?',
      type: 'radio',
      options: [
        'Impulse Online Shopping',
        'High Living Cost',
        'Social Pressure Spending',
        'Lack of Knowledge',
        'Poor Tracking Discipline',
      ],
    },
    {
      id: 'spendingStyle',
      icon: 'credit-card-outline',
      question: 'Spending Persona?',
      placeholder: 'Which bear are you?',
      value: spendingStyle,
      setValue: setSpendingStyle,
      keyboardType: 'default' as const,
      hint: 'Your risk and reward balance.',
      type: 'radio',
      options: [
        'The Thrifty Bear (Frugal)',
        'The Balanced Cub (Responsible)',
        'The Spender Grizzly (High Risk)',
      ],
    },
    {
      id: 'trackingMethod',
      icon: 'magnify-expand',
      question: 'Tracking Status?',
      placeholder: 'How do you monitor?',
      value: trackingMethod,
      setValue: setTrackingMethod,
      keyboardType: 'default' as const,
      hint: 'Past habits inform success.',
      type: 'radio',
      options: [
        'Complete Darkness (None)',
        'Vague Mental Estimates',
        'Manual Spreadsheet/App',
        'Automatic Bank Tracking',
      ],
    },
  ];

  const currentQuestion = questions[currentStep];

  const animateNext = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const handleNext = async () => {
    let value = currentQuestion.value.trim();
    if (!value) {
      showMessage('Requirement missing');
      return;
    }

    if (currentQuestion.validation && !currentQuestion.validation(value)) {
      showMessage(currentQuestion.error || 'Invalid format');
      return;
    }

    if (currentStep < questions.length - 1) {
      animateNext();
      setCurrentStep(currentStep + 1);
    } else {
      setIsLoading(true);
      try {
        const data: Partial<User> = {
          name,
          age: parseInt(age) || 0,
          state,
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
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      animateNext();
      setCurrentStep(currentStep - 1);
    } else if (isRetake && navigation) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1 }}>
            <View style={styles.content}>
              <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                  <Icon name="chevron-left" size={24} color={COLORS.accent} />
                </TouchableOpacity>
                <View style={styles.progressSection}>
                  <Text style={styles.groupTitle}>{getCurrentGroup()}</Text>
                  <View style={styles.progressDots}>
                    {questions.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          i <= currentStep && styles.dotActive,
                          i === currentStep && styles.dotCurrent
                        ]}
                      />
                    ))}
                  </View>
                </View>
                <View style={{ width: 40 }} />
              </View>

              <View style={styles.questionCard}>
                <View style={styles.qHeader}>
                  <MaterialCommunityIcon name={currentQuestion.icon} size={28} color={COLORS.accent} />
                  <Text style={styles.qIndicator}>STEP {currentStep + 1} OF 9</Text>
                </View>
                <Text style={styles.questionText}>{currentQuestion.question}</Text>
                <Text style={styles.hintText}>{currentQuestion.hint}</Text>
              </View>

              <View style={styles.inputArea}>
                {currentQuestion.type === 'radio' ? (
                  <View style={styles.radioList}>
                    {currentQuestion.options.map((option) => {
                      const isSelected = currentQuestion.value === option;
                      return (
                        <TouchableOpacity
                          key={option}
                          activeOpacity={0.7}
                          onPress={() => currentQuestion.setValue(option)}
                          style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                        >
                          <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option}</Text>
                          <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                            {isSelected && <Icon name="check" size={12} color="#FFF" />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : currentQuestion.type === 'grid' ? (
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridContainer}>
                    {currentQuestion.options.map((option) => {
                      const isSelected = currentQuestion.value === option;
                      return (
                        <TouchableOpacity
                          key={option}
                          activeOpacity={0.7}
                          onPress={() => currentQuestion.setValue(option)}
                          style={[styles.gridItem, isSelected && styles.gridItemSelected]}
                        >
                          <Text style={[styles.gridText, isSelected && styles.gridTextSelected]}>{option}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <View>
                    <View style={[styles.field, currentQuestion.value && styles.fieldActive]}>
                      {currentQuestion.prefix && <Text style={styles.fieldPrefix}>{currentQuestion.prefix}</Text>}
                      <TextInput
                        style={styles.textInput}
                        value={currentQuestion.value}
                        onChangeText={currentQuestion.setValue}
                        placeholder={currentQuestion.placeholder}
                        placeholderTextColor="#BBB"
                        keyboardType={currentQuestion.keyboardType}
                        autoFocus
                        selectionColor={COLORS.accent}
                      />
                    </View>
                    {currentQuestion.suggestions && (
                      <View style={styles.suggestionBox}>
                        <Text style={styles.suggestLabel}>QUICK SELECT</Text>
                        <View style={styles.chipRow}>
                          {currentQuestion.suggestions.map((s) => (
                            <TouchableOpacity
                              key={s}
                              onPress={() => currentQuestion.setValue(s)}
                              style={[styles.chip, currentQuestion.value === s && styles.chipActive]}
                            >
                              <Text style={[styles.chipText, currentQuestion.value === s && styles.chipTextActive]}>{s}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleNext}
                style={[styles.nextBtn, !currentQuestion.value && styles.nextBtnDisabled]}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.nextText}>{currentStep === 8 ? 'FINISH' : 'CONTINUE'}</Text>
                    <Icon name="arrow-right" size={20} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSection: {
    alignItems: 'center',
  },
  groupTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.darkGray,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EEE',
  },
  dotActive: {
    backgroundColor: COLORS.primary,
  },
  dotCurrent: {
    backgroundColor: COLORS.accent,
    width: 20,
  },
  questionCard: {
    marginBottom: 30,
  },
  qHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  qIndicator: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  questionText: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.accent,
    lineHeight: 36,
  },
  hintText: {
    fontSize: 15,
    color: '#888',
    marginTop: 8,
    fontWeight: '500',
  },
  inputArea: {
    flex: 1,
  },
  radioList: {
    gap: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  optionItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  optionTextSelected: {
    color: COLORS.accent,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 20,
  },
  gridItem: {
    width: (width - 48 - 16) / 3,
    backgroundColor: '#F9F9F9',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  gridItemSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  gridText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  gridTextSelected: {
    color: '#FFF',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EEE',
    paddingHorizontal: 20,
    height: 60,
  },
  fieldActive: {
    borderColor: COLORS.primary,
  },
  fieldPrefix: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.accent,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.accent,
  },
  suggestionBox: {
    marginTop: 20,
  },
  suggestLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#BBB',
    marginBottom: 10,
    letterSpacing: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  chipActive: {
    backgroundColor: COLORS.accent,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#777',
  },
  chipTextActive: {
    color: '#FFF',
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  nextBtn: {
    backgroundColor: COLORS.accent,
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  nextBtnDisabled: {
    backgroundColor: '#DDD',
  },
  nextText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});