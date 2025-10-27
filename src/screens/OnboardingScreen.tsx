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
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/colors';

type OnboardingScreenProps = {
  onComplete: (data: any) => void;
  showMessage: (message: string) => void;
};

export const OnboardingScreen = ({
  onComplete,
  showMessage,
}: OnboardingScreenProps) => {
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [otherText, setOtherText] = useState(''); // For 'Other' options

  const questions = [
    {
      id: 'age',
      question: "What's your age? (We're focused on young adults 18-30)",
      type: 'numeric',
      validation: (val) => {
        const num = parseInt(val);
        return !isNaN(num) && num >= 18 && num <= 30;
      },
      error: 'Age must be between 18 and 30',
    },
    {
      id: 'occupation',
      question: 'What do you do?',
      type: 'radio',
      options: ['Student', 'Entry-level Professional', 'Freelancer', 'Unemployed', 'Other'],
      placeholder: 'Please specify your occupation',
    },
    {
      id: 'monthlyIncome',
      question: "What's your approximate monthly income? (RM)",
      type: 'numeric',
      validation: (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      error: 'Please enter a valid positive amount',
    },
    {
      id: 'financialSituation',
      question: 'Tell me about your current financial situation—what are the key factors shaping your financial decisions today?',
      type: 'text',
      placeholder: "e.g., I'm a student with a part-time job, main expenses are rent and food, and I have some student loans",
    },
    {
      id: 'financialGoals',
      question: 'What financial goals are most important to you right now, and why?',
      type: 'text',
      placeholder: 'e.g., Save for a car because I need reliable transportation, or pay off student loans to reduce stress',
    },
    {
      id: 'riskTolerance',
      question: 'When making financial decisions, do you prioritize stability, growth, or a balance of both?',
      type: 'radio',
      options: ['Stability (low risk)', 'Growth (high risk)', 'Balance', 'Other'],
      placeholder: 'Please specify your preference',
    },
    {
      id: 'cashFlow',
      question: 'What does your current cash flow look like, and do you have a system for tracking it?',
      type: 'text',
      placeholder: 'e.g., My income is steady from salary, expenses are tracked in a notebook, or I use an app but struggle with consistency',
    },
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [step]);

  const handleSelectOption = (option) => {
    setResponses({ ...responses, [questions[step].id]: option });
    if (option !== 'Other') {
      setOtherText('');
    }
  };

  const handleNext = () => {
    const currentQuestion = questions[step];
    let value = responses[currentQuestion.id] || '';

    if (value === 'Other') {
      value = otherText;
      if (value.trim() === '') {
        showMessage('Please provide details for "Other"');
        return;
      }
    } else if (value.trim() === '') {
      showMessage('Please select or provide an answer');
      return;
    }

    if (currentQuestion.validation && !currentQuestion.validation(value)) {
      showMessage(currentQuestion.error || 'Invalid input');
      return;
    }

    if (step < questions.length - 1) {
      fadeAnim.setValue(0);
      setStep(step + 1);
      setOtherText(''); // Reset other text for next question
    } else {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        showMessage('Profile setup complete!');
        const data = {
          ...responses,
          age: parseInt(responses.age || '0'),
          monthlyIncome: parseFloat(responses.monthlyIncome || '0'),
        };
        onComplete(data);
      }, 1000);
    }
  };

  const handleChange = (text) => {
    if (questions[step].type === 'text' || questions[step].type === 'numeric') {
      setResponses({ ...responses, [questions[step].id]: text });
    } else if (responses[questions[step].id] === 'Other') {
      setOtherText(text);
    }
  };

  const progress = ((step + 1) / questions.length) * 100;

  const renderInput = () => {
    const q = questions[step];
    if (q.type === 'numeric' || q.type === 'text') {
      return (
        <TextInput
          style={onboardingStyles.input}
          value={responses[q.id] || ''}
          onChangeText={handleChange}
          keyboardType={q.type === 'numeric' ? 'numeric' : 'default'}
          multiline={q.type === 'text' && step > 2}
          numberOfLines={q.type === 'text' && step > 2 ? 4 : 1}
          placeholder={q.placeholder}
          placeholderTextColor={COLORS.darkGray}
        />
      );
    } else if (q.type === 'radio') {
      return (
        <View style={onboardingStyles.radioContainer}>
          {q.options.map((option) => (
            <TouchableOpacity
              key={option}
              style={onboardingStyles.radioItem}
              onPress={() => handleSelectOption(option)}
            >
              <Icon
                name={responses[q.id] === option ? 'check-circle' : 'circle'}
                size={20}
                color={COLORS.accent}
              />
              <Text style={onboardingStyles.radioText}>{option}</Text>
            </TouchableOpacity>
          ))}
          {responses[q.id] === 'Other' && (
            <TextInput
              style={onboardingStyles.otherInput}
              value={otherText}
              onChangeText={handleChange}
              placeholder={q.placeholder}
              placeholderTextColor={COLORS.darkGray}
            />
          )}
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={onboardingStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={onboardingStyles.header}>
        <Text style={onboardingStyles.headerTitle}>Let's Get to Know You</Text>
      </View>
      <View style={onboardingStyles.progressContainer}>
        <View style={[onboardingStyles.progressBar, { width: `${progress}%` }]} />
      </View>
      <ScrollView contentContainerStyle={onboardingStyles.scrollContainer}>
        <Animated.View style={[onboardingStyles.questionContainer, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }]}>
          <MaterialCommunityIcon name="bear" size={60} color={COLORS.accent} style={onboardingStyles.bearIcon} />
          <Text style={onboardingStyles.questionText}>{questions[step].question}</Text>
          {renderInput()}
        </Animated.View>
        <TouchableOpacity
          style={onboardingStyles.nextButton}
          onPress={handleNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={onboardingStyles.nextButtonText}>
              {step < questions.length - 1 ? 'Next' : 'Complete Setup'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles for OnboardingScreen ---
const onboardingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  progressContainer: {
    height: 4,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.accent,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  questionContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  bearIcon: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    color: COLORS.accent,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  radioContainer: {
    width: '100%',
    marginTop: 10,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioText: {
    fontSize: 16,
    color: COLORS.accent,
    marginLeft: 10,
  },
  otherInput: {
    width: '100%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    color: COLORS.accent,
    marginTop: 10,
  },
  nextButton: {
    backgroundColor: COLORS.accent,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});