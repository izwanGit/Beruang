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
    fontSize: 38,
    fontWeight: '900',
    color: '#FFF',
    marginTop: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 15,
    color: '#E8F5E9',
    marginTop: 5,
    fontWeight: '600',
    opacity: 0.9,
  },
  formCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 20,
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
    borderRadius: 14,
    height: 52,
    marginBottom: 14,
    paddingHorizontal: 18,
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
    borderRadius: 18,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 18,
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