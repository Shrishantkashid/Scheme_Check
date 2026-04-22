import Constants from 'expo-constants';
import { Platform } from 'react-native';

// For local development, use your computer's local IP address
// You can find your IP by running 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)
// CURRENT IP: 10.219.114.148

// Use EXPO_PUBLIC_ prefix for environment variables to be accessible in the app
// Production URL should be set in EAS secrets or a .env file
const PRODUCTION_API_URL = process.env.EXPO_PUBLIC_API_URL;

export const API_URL = PRODUCTION_API_URL || (Platform.OS === 'android' 
  ? 'http://10.219.114.164:5000/api' // Use local IP for Android dev
  : 'http://localhost:5000/api');     // Localhost works for iOS Simulator


