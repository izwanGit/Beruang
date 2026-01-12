// src/screens/LoginScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Image,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS } from '../constants/colors';
import { loginStyles } from '../styles/loginStyles';

// --- NEW: Import Firebase ---
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../App'; // Import auth from App.tsx

type LoginScreenProps = {
  onSignUp: () => void;
  showMessage: (message: string) => void;
};

export const LoginScreen = ({
  onSignUp,
  showMessage,
}: LoginScreenProps) => {
  // --- NEW: State for login form ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Focus States
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showMessage('Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error(error);
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        showMessage('Invalid email or password. Please try again.');
      } else {
        showMessage('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={loginStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1, width: '100%' }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, width: '100%', justifyContent: 'center' }}
          >
            {/* Logo Section */}
            <Animated.View style={[loginStyles.logoContainer, { opacity: fadeAnim }]}>
              <Image
                source={require('../../assets/beruang_homescreen_optimized.png')}
                style={{ width: 240, height: 143 }}
                resizeMode="contain"
              />
              <Text style={loginStyles.title}>BERUANG</Text>
              <Text style={loginStyles.subtitle}>Your Personal Finance Companion</Text>
            </Animated.View>

            {/* White Card Section */}
            <Animated.View style={[
              loginStyles.formCard,
              {
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0] // Slide up effect
                  })
                }]
              }
            ]}>
              <View style={loginStyles.inputContainer}>
                <View style={[
                  loginStyles.inputView,
                  focusedInput === 'email' && loginStyles.inputViewFocused
                ]}>
                  <Icon
                    name="mail"
                    size={20}
                    color={focusedInput === 'email' ? '#9CB982' : COLORS.darkGray}
                    style={loginStyles.inputIcon}
                  />
                  <TextInput
                    placeholder="Email Address"
                    placeholderTextColor="#B0B0B0"
                    style={loginStyles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>

                <View style={[
                  loginStyles.inputView,
                  focusedInput === 'password' && loginStyles.inputViewFocused
                ]}>
                  <Icon
                    name="lock"
                    size={20}
                    color={focusedInput === 'password' ? '#6B9766' : COLORS.darkGray}
                    style={loginStyles.inputIcon}
                  />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#B0B0B0"
                    style={loginStyles.input}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Icon
                      name={showPassword ? 'eye' : 'eye-off'}
                      size={20}
                      color={COLORS.darkGray}
                    />
                  </TouchableOpacity>
                </View>

                <Pressable
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <Animated.View style={[
                    loginStyles.loginButton,
                    { transform: [{ scale: buttonScale }] }
                  ]}>
                    {isLoading ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={loginStyles.loginButtonText}>Sign In</Text>
                    )}
                  </Animated.View>
                </Pressable>

                <View style={loginStyles.footer}>
                  <TouchableOpacity onPress={onSignUp}>
                    <Text style={loginStyles.footerText}>
                      New here? <Text style={loginStyles.signUpText}>Create Account</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};