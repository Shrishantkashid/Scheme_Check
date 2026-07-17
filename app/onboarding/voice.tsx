import React, { useState } from 'react';
import { StyleSheet, View, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import VoiceOnboardingWizard from '@/components/VoiceOnboardingWizard';
import { useAuth } from '@/context/auth';
import { apiFetch, getApiErrorMessage, parseApiResponse } from '@/constants/api';
import { Colors } from '@/constants/theme';

export default function VoiceOnboarding() {
  const { token, updateUser, user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const handleComplete = async (answers: Record<string, string>) => {
    setIsSaving(true);
    try {
      const res = await apiFetch('/user/profile', {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          profile: { ...user?.profile, ...answers },
          lastQuestionId: null,
          isOnboarded: true
        })
      });

      await parseApiResponse(res);

      updateUser({
        profile: { ...user?.profile, ...answers },
        lastQuestionId: null,
        isOnboarded: true
      });

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving answers:', error);
      Alert.alert('Error', getApiErrorMessage(error, 'Failed to save your progress. Please try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFallbackToManual = () => {
    router.replace('/onboarding/manual');
  };

  return (
    <View style={styles.container}>
      <VoiceOnboardingWizard 
        onComplete={handleComplete} 
        onFallbackToManual={handleFallbackToManual} 
      />
      {isSaving && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.premium.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  }
});

