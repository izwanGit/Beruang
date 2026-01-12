// src/styles/loginStyles.ts
import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../constants/colors';

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6B9766', // User specified green
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
    marginTop: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 16,
    color: '#E8F5E9', // Off-white for subtitle
    marginTop: 5,
    fontWeight: '600',
    opacity: 0.9,
  },
  // Card Container
  formCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 30,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
  },
  inputContainer: {
    width: '100%',
  },
  inputView: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    height: 58,
    marginBottom: 16,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputViewFocused: {
    backgroundColor: COLORS.white,
    borderColor: '#6B9766',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    width: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  signUpText: {
    color: '#6B9766',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});