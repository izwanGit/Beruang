// src/styles/loginStyles.ts
import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DCE6CF', // Subtle green contrast
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30, // Tightened spacing
  },
  title: {
    fontSize: 42, // Slightly adjusted
    fontWeight: 'bold',
    color: COLORS.accent,
    marginTop: 5, // Reduced space to logo
    letterSpacing: 3, // Increased letter spacing
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.accent,
    marginTop: 2,
    opacity: 0.7, // Lighter opacity
  },
  inputContainer: {
    width: '100%',
    marginTop: 30,
  },
  inputView: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12, // Standard radius
    height: 56,
    marginBottom: 14, // Tightened spacing (12-16px)
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: 'transparent', // Default border
  },
  inputViewFocused: {
    borderColor: '#6F8455', // Brand green on focus
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
    backgroundColor: '#4E4336', // Darker shade of brown
    borderRadius: 28, // Rounder than inputs
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28, // Increased space above button
    // Shadow for elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.accent,
  },
  signUpText: {
    color: '#6F8455', // Brand color
    fontWeight: '600',
  },
});