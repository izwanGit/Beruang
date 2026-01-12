// src/screens/SignUpScreen.tsx
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
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../App'; // Import auth from App.tsx

type SignUpScreenProps = {
  onBack: () => void;
  showMessage: (message: string) => void;
};

export const SignUpScreen = ({ onBack, showMessage }: SignUpScreenProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      showMessage('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      showMessage('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      showMessage('Password must be at least 6 characters long.');
      return;
    }
    if (!email.includes('@')) {
      showMessage('Invalid email');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        showMessage('This email is already in use.');
      } else {
        showMessage('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={loginStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
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
                style={{ width: 200, height: 119 }}
                resizeMode="contain"
              />
              <Text style={loginStyles.title}>BERUANG</Text>
              <Text style={loginStyles.subtitle}>Create Your Account</Text>
            </Animated.View>

            {/* White Card Section */}
            <Animated.View style={[
              loginStyles.formCard,
              {
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}>
              <View style={loginStyles.inputContainer}>
                <View style={[
                  loginStyles.inputView,
                  focusedInput === 'name' && loginStyles.inputViewFocused
                ]}>
                  <Icon
                    name="user"
                    size={20}
                    color={focusedInput === 'name' ? '#6B9766' : COLORS.darkGray}
                    style={loginStyles.inputIcon}
                  />
                  <TextInput
                    placeholder="Full Name"
                    placeholderTextColor="#B0B0B0"
                    style={loginStyles.input}
                    autoCapitalize="words"
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocusedInput('name')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>

                <View style={[
                  loginStyles.inputView,
                  { marginBottom: 12 },
                  focusedInput === 'email' && loginStyles.inputViewFocused
                ]}>
                  <Icon
                    name="mail"
                    size={20}
                    color={focusedInput === 'email' ? '#6B9766' : COLORS.darkGray}
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

                <View style={[
                  loginStyles.inputView,
                  focusedInput === 'confirmPassword' && loginStyles.inputViewFocused
                ]}>
                  <Icon
                    name="lock"
                    size={20}
                    color={focusedInput === 'confirmPassword' ? '#6B9766' : COLORS.darkGray}
                    style={loginStyles.inputIcon}
                  />
                  <TextInput
                    placeholder="Confirm Password"
                    placeholderTextColor="#B0B0B0"
                    style={loginStyles.input}
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setFocusedInput('confirmPassword')}
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
                  onPress={handleSignUp}
                  disabled={isLoading}
                >
                  <Animated.View style={[
                    loginStyles.loginButton,
                    { transform: [{ scale: buttonScale }] }
                  ]}>
                    {isLoading ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={loginStyles.loginButtonText}>Create Account</Text>
                    )}
                  </Animated.View>
                </Pressable>

                <View style={loginStyles.footer}>
                  <TouchableOpacity onPress={onBack}>
                    <Text style={loginStyles.footerText}>
                      Already have an account? <Text style={loginStyles.signUpText}>Sign In</Text>
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