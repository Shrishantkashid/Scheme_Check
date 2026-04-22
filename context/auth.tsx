import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';
import { API_URL } from '@/constants/config';

interface User {
  id: string;
  fullName: string;
  email: string;
  isOnboarded: boolean;
  lastQuestionId?: string | null;
  profile?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadStorageData();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';
    const inOnboarding = segments[0] === 'onboarding';

    if (!token && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (token && user) {
      // Priority 1: Explicit flag
      // Priority 2: Fallback to profile data check if flag is missing
      const isExplicitlyOnboarded = user.isOnboarded === true;
      const isExplicitlyNotOnboarded = user.isOnboarded === false;
      const hasProfileData = user.profile && Object.keys(user.profile).length > 5;
      
      const shouldBeInDashboard = isExplicitlyOnboarded || (!isExplicitlyNotOnboarded && hasProfileData);

      if (!shouldBeInDashboard && !inOnboarding) {
        router.replace('/onboarding');
      } else if (shouldBeInDashboard && (inAuthGroup || inOnboarding)) {
        router.replace('/(tabs)');
      }
    }
  }, [token, user?.isOnboarded, segments, loading]);

  async function loadStorageData() {
    try {
      const storedToken = await SecureStore.getItemAsync('userToken');
      const storedUser = await SecureStore.getItemAsync('userData');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load auth data', e);
    } finally {
      setLoading(false);
    }
  }

  const signIn = async (newToken: string, newUser: User) => {
    // 1. Save token first so subsequent requests are authorized
    await SecureStore.setItemAsync('userToken', newToken);
    setToken(newToken);
    
    try {
      // 2. Fetch DEFINITIVE user state from backend to ensure we have all fields (isOnboarded, profile, etc.)
      const response = await fetch(`${API_URL}/user/me`, {
        headers: { Authorization: `Bearer ${newToken}` }
      });
      const freshUser = await response.json();
      
      if (freshUser && freshUser._id) {
        // Map _id to id for frontend consistency
        const processedUser = { ...freshUser, id: freshUser._id };
        await SecureStore.setItemAsync('userData', JSON.stringify(processedUser));
        setUser(processedUser);
      } else {
        // Fallback to the user object provided by login/signup if /me fails
        await SecureStore.setItemAsync('userData', JSON.stringify(newUser));
        setUser(newUser);
      }
    } catch (err) {
      console.error('Failed to fetch fresh user during sign in', err);
      // Fallback
      await SecureStore.setItemAsync('userData', JSON.stringify(newUser));
      setUser(newUser);
    }
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      SecureStore.setItemAsync('userData', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
