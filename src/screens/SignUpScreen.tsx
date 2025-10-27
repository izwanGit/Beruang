// src/screens/SignUpScreen.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
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
import { loginStyles } from '../styles/loginStyles'; // <-- IMPORT SHARED STYLES (FIX)

type SignUpScreenProps = {
  onBack: () => void;
  onSignUpSuccess: (name: string) => void;
  showMessage: (message: string) => void;
};

export const SignUpScreen = ({
  onBack,
  onSignUpSuccess,
  showMessage,
}: SignUpScreenProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = () => {
    if (!name || !email || !password || !confirmPassword) {
      showMessage('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      showMessage('Passwords do not match');
      return;
    }
    if (!email.includes('@')) {
      showMessage('Invalid email');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showMessage('Sign up successful! Setting up profile...');
      onSignUpSuccess(name);
    }, 1000);
  };

  return (
    <SafeAreaView style={loginStyles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={loginStyles.logoContainer}>
        <MaterialCommunityIcon name="bear" size={80} color={COLORS.accent} />
        <Text style={loginStyles.title}>BERUANG</Text>
        <Text style={loginStyles.subtitle}>Create Your Account</Text>
      </View>
      <View style={loginStyles.inputContainer}>
        <View style={loginStyles.inputView}>
          <Icon
            name="user"
            size={20}
            color={COLORS.accent}
            style={loginStyles.inputIcon}
          />
          <TextInput
            placeholder="Full Name"
            placeholderTextColor={COLORS.darkGray}
            style={loginStyles.input}
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
          />
        </View>
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
            value={email}
            onChangeText={setEmail}
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
            value={password}
            onChangeText={setPassword}
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
            placeholder="Confirm Password"
            placeholderTextColor={COLORS.darkGray}
            style={loginStyles.input}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>
      </View>
      <TouchableOpacity
        style={loginStyles.loginButton}
        onPress={handleSignUp}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={loginStyles.loginButtonText}>Sign Up</Text>
        )}
      </TouchableOpacity>
      <View style={loginStyles.footer}>
        <TouchableOpacity onPress={onBack}>
          <Text style={loginStyles.footerText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};