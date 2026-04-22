import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AmbientBackground } from '@/components/ambient-background';
import { Colors } from '@/constants/theme';
import { QuestionEngine } from '@/components/onboarding/QuestionEngine';

export default function ManualOnboarding() {
  const handleComplete = () => {
    router.replace('/(tabs)');
  };

  return (
    <ThemedView style={styles.container}>
      <AmbientBackground />
      
      <SafeAreaView style={styles.safeArea}>
        <Animated.View entering={FadeIn.duration(800)} style={styles.content}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          <ThemedText style={styles.stepIndicator}>MANUAL ENTRY</ThemedText>
          
          <QuestionEngine mode="manual" onComplete={handleComplete} />
        </Animated.View>
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
  stepIndicator: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.premium.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
});
