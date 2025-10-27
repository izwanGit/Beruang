// src/styles/loginStyles.ts
import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginTop: 10,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.accent,
    marginTop: 4,
  },
  inputContainer: {
    width: '100%',
  },
  inputView: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    height: 60,
    marginBottom: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.secondary,
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
    backgroundColor: COLORS.accent,
    borderRadius: 15,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 3,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.accent,
  },
});