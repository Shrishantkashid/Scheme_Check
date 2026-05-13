import Constants from 'expo-constants';
import { Platform } from 'react-native';

const LOCAL_BACKEND_PORT = '5000';

// Use EXPO_PUBLIC_API_URL when you need to override the local backend URL.
const EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL;

const getLocalBackendHost = () => {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];

  if (host) {
    return host;
  }

  if (Platform.OS === 'android') {
    // Android emulators cannot reach the host machine through localhost.
    return '10.0.2.2';
  }

  return 'localhost';
};

const LOCAL_API_URL = `http://${getLocalBackendHost()}:${LOCAL_BACKEND_PORT}/api`;

export const API_URL = EXPO_PUBLIC_API_URL || LOCAL_API_URL;
