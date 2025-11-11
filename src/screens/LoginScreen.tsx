// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
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
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      showMessage('Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    try {
      // --- NEW: Call Firebase Auth ---
      await signInWithEmailAndPassword(auth, email, password);
      // No need to navigate, onAuthStateChanged in App.tsx will handle it
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
      <StatusBar barStyle="dark-content" />
      <View style={loginStyles.logoContainer}>
        <MaterialCommunityIcon name="bear" size={80} color={COLORS.accent} />
        <Text style={loginStyles.title}>BERUANG</Text>
        <Text style={loginStyles.subtitle}>Your Personal Finance Companion</Text>
      </View>
      <View style={loginStyles.inputContainer}>
        <View style={loginStyles.inputView}>
          <Icon
            name="mail"
            size={20}
            color={COLORS.accent}
            style={loginStyles.inputIcon}
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor={COLORS.darkGray}
            style={loginStyles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email} // <-- Bind value
            onChangeText={setEmail} // <-- Bind handler
          />
        </View>
        <View style={loginStyles.inputView}>
          <Icon
            name="lock"
            size={20}
            color={COLORS.accent}
            style={loginStyles.inputIcon}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={COLORS.darkGray}
            style={loginStyles.input}
            secureTextEntry
            value={password} // <-- Bind value
            onChangeText={setPassword} // <-- Bind handler
          />
        </View>
      </View>
      <TouchableOpacity
        style={loginStyles.loginButton}
        onPress={handleLogin} // <-- Use new handler
        disabled={isLoading} // <-- Disable on load
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={loginStyles.loginButtonText}>Login</Text>
        )}
      </TouchableOpacity>
      <View style={loginStyles.footer}>
        <TouchableOpacity onPress={onSignUp}>
          <Text style={loginStyles.footerText}>
            Don't have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};