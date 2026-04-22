import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Dimensions, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AmbientBackground } from '@/components/ambient-background';
import { Colors } from '@/constants/theme';
import { API_URL } from '@/constants/config';

import { useAuth } from '@/context/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data;
      
      // Use signIn from AuthContext
      await signIn(token, user);
      
      // router.replace is handled by AuthContext useEffect
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Invalid credentials or server error.';
      Alert.alert('Sign In Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <AmbientBackground />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <BlurView intensity={20} tint="light" style={styles.backButtonBlur}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </BlurView>
          </TouchableOpacity>

          <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.header}>
            <ThemedText style={styles.headline}>Welcome Back</ThemedText>
            <ThemedText style={styles.subheadline}>Access your intelligence suite and personalized recommendations.</ThemedText>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.form}>
            <GlassInput 
              placeholder="Email Address" 
              icon="mail-outline" 
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <GlassInput 
              placeholder="Password" 
              icon="lock-closed-outline" 
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <ThemedText style={styles.forgotPasswordText}>Forgot Password?</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.signInButtonWrapper} 
              activeOpacity={0.8}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[Colors.premium.gradientStart, Colors.premium.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.signInButton}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.signInButtonText}>Sign In</ThemedText>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <ThemedText style={styles.dividerText}>OR SIGN IN WITH</ThemedText>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialContainer}>
              <SocialButton icon="logo-google" />
              <SocialButton icon="logo-apple" />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.footer}>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <ThemedText style={styles.footerText}>
                Don't have an account? <ThemedText style={styles.footerLink}>Sign Up</ThemedText>
              </ThemedText>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function GlassInput({ placeholder, icon, ...props }: any) {
  return (
    <View style={styles.inputWrapper}>
      <BlurView intensity={15} tint="light" style={styles.inputBlur}>
        <Ionicons name={icon} size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.3)"
          style={styles.input}
          {...props}
        />
      </BlurView>
    </View>
  );
}

function SocialButton({ icon }: { icon: any }) {
  return (
    <TouchableOpacity style={styles.socialButtonWrapper}>
      <BlurView intensity={20} tint="light" style={styles.socialButtonBlur}>
        <Ionicons name={icon} size={24} color="#FFFFFF" />
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 40, // Increased from 10 to balance the shorter content
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 20,
  },
  backButtonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center', // Centered
  },
  headline: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -1,
    textAlign: 'center', // Centered
  },
  subheadline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 22,
    textAlign: 'center', // Centered
  },
  form: {
    gap: 16, // Reduced from 20
  },
  inputWrapper: {
    height: 56, // Reduced from 64
    borderRadius: 16, // Reduced from 20
    overflow: 'hidden',
  },
  inputBlur: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8, // Reduced from -10
  },
  forgotPasswordText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  signInButtonWrapper: {
    height: 56, // Reduced from 64
    borderRadius: 28, // Reduced from 32
    overflow: 'hidden',
    marginTop: 4, // Reduced from 10
    shadowColor: Colors.premium.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  signInButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20, // Reduced from 30
    gap: 15,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontSize: 11, // Reduced from 12
    fontWeight: '700',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButtonWrapper: {
    width: 56, // Reduced from 64
    height: 56, // Reduced from 64
    borderRadius: 28, // Reduced from 32
    overflow: 'hidden',
  },
  socialButtonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  footer: {
    marginTop: 24, // Reduced from 40
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  footerLink: {
    color: Colors.premium.primary,
    fontWeight: '700',
  },
});
