// src/screens/LoginScreen.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/colors';
import { loginStyles } from '../styles/loginStyles'; // <-- IMPORT SHARED STYLES

type LoginScreenProps = {
  onLogin: () => void;
  onSignUp: () => void;
};

export const LoginScreen = ({ onLogin, onSignUp }: LoginScreenProps) => {
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
          />
        </View>
      </View>
      <TouchableOpacity style={loginStyles.loginButton} onPress={onLogin}>
        <Text style={loginStyles.loginButtonText}>Login</Text>
      </TouchableOpacity>
      <View style={loginStyles.footer}>
        <TouchableOpacity onPress={onSignUp}>
          <Text style={loginStyles.footerText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};