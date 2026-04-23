import Constants from 'expo-constants';
import { Platform } from 'react-native';

// For local development, use your computer's local IP address
// You can find your IP by running 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)
// CURRENT IP: 10.219.114.148

// Use EXPO_PUBLIC_ prefix for environment variables to be accessible in the app
// Production URL should be set in EAS secrets or a .env file
const EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL;

export const API_URL = EXPO_PUBLIC_API_URL || 'http://ec2-34-230-0-208.compute-1.amazonaws.com:5000/api';
