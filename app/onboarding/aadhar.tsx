import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import axios from 'axios';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AmbientBackground } from '@/components/ambient-background';
import { Colors } from '@/constants/theme';
import { API_URL } from '@/constants/config';
import { useAuth } from '@/context/auth';

export default function AadharOnboarding() {
  const { token, updateUser } = useAuth();
  const [aadharNumber, setAadharNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleSimulateAadhar = async (prePassNumber?: string) => {
    const targetNumber = prePassNumber || aadharNumber;
    
    if (targetNumber.length !== 12) {
      Alert.alert('Error', 'Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setIsLoading(true);
    try {
      // MOCK Aadhaar Data - More detailed
      const mockData = {
        gender: 'female',
        age: '28',
        location: 'rural',
        fullName: 'Laxmi Devi',
        state: 'Karnataka',
        district: 'Mysuru',
        occupation: 'Farmer',
        income: 'low'
      };

      // Save pre-filled data to backend
      const response = await axios.put(
        `${API_URL}/user/profile`,
        {
          profile: mockData,
          lastQuestionId: 'category', // Resume from category
          isOnboarded: false
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local auth context
      updateUser({
        profile: mockData,
        lastQuestionId: 'category',
        fullName: mockData.fullName,
        isOnboarded: false
      });

      Alert.alert('Identity Verified', 'Aadhaar details fetched successfully: Laxmi Devi, Karnataka. Your profile has been pre-filled.', [
        { text: 'Continue setup', onPress: () => router.push('/onboarding/manual') }
      ]);
    } catch (error) {
      console.error('Error with Aadhaar simulation:', error);
      Alert.alert('Error', 'Failed to connect to Aadhaar services.');
    } finally {
      setIsLoading(false);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    // Real simulation logic: find number first, then act
    setTimeout(() => {
      const scannedNum = '123456789012';
      setAadharNumber(scannedNum);
      setIsScanning(false);
      handleSimulateAadhar(scannedNum);
    }, 2500);
  };

  return (
    <ThemedView style={styles.container}>
      <AmbientBackground />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          <Animated.View entering={FadeInUp.delay(200)} style={styles.header}>
            <ThemedText style={styles.headline}>Aadhaar Verification</ThemedText>
            <ThemedText style={styles.subheadline}>
              Pre-fill your basic identity details directly from your Aadhaar card for a faster experience.
            </ThemedText>
          </Animated.View>

          {!isScanning ? (
            <Animated.View entering={FadeInDown.delay(400)} style={styles.form}>
              <View style={styles.inputWrapper}>
                <BlurView intensity={20} tint="light" style={styles.inputBlur}>
                  <Ionicons name="card-outline" size={20} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 12-digit Aadhaar Number"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    maxLength={12}
                    value={aadharNumber}
                    onChangeText={setAadharNumber}
                  />
                </BlurView>
              </View>

              <TouchableOpacity 
                style={[styles.verifyButton, aadharNumber.length !== 12 && styles.disabledButton]} 
                onPress={handleSimulateAadhar}
                disabled={aadharNumber.length !== 12 || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <ThemedText style={styles.verifyButtonText}>Verify Aadhaar</ThemedText>
                )}
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <ThemedText style={styles.dividerText}>OR</ThemedText>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity style={styles.scanButton} onPress={startScanning}>
                <BlurView intensity={20} tint="light" style={styles.scanBlur}>
                  <Ionicons name="qr-code-outline" size={24} color={Colors.premium.primary} />
                  <ThemedText style={styles.scanButtonText}>Scan QR Code on Card</ThemedText>
                </BlurView>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View style={styles.scanningView}>
              <View style={styles.scannerLine} />
              <ActivityIndicator size="large" color={Colors.premium.primary} style={{ marginTop: 20 }} />
              <ThemedText style={styles.scanningText}>Scanning Aadhaar QR...</ThemedText>
            </View>
          )}

          <View style={styles.securityBox}>
            <Ionicons name="lock-closed-outline" size={16} color="rgba(255,255,255,0.4)" />
            <ThemedText style={styles.securityText}>
              UIDAI encryption ensures your data remains private and secure.
            </ThemedText>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subheadline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 24,
  },
  form: {
    gap: 20,
  },
  inputWrapper: {
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
  },
  inputBlur: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    marginLeft: 12,
    letterSpacing: 2,
  },
  verifyButton: {
    height: 60,
    backgroundColor: Colors.premium.primary,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginVertical: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '700',
  },
  scanButton: {
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  scanBlur: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scanningView: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  scannerLine: {
    width: '80%',
    height: 2,
    backgroundColor: Colors.premium.primary,
    shadowColor: Colors.premium.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  scanningText: {
    marginTop: 20,
    fontSize: 14,
    color: Colors.premium.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    gap: 10,
    justifyContent: 'center',
  },
  securityText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
});
