import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AmbientBackground } from '@/components/ambient-background';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';

export default function OnboardingSelection() {
  const { user } = useAuth();

  const methods = [
    {
      id: 'manual',
      title: 'Manual Entry',
      description: 'Fill out the form step-by-step with dynamic questions.',
      icon: 'list-outline',
      color: ['#6366f1', '#a855f7'],
      route: '/onboarding/manual',
    },
    {
      id: 'voice',
      title: 'Voice Interaction',
      description: 'Answer questions in Kannada using your voice naturally.',
      icon: 'mic-outline',
      color: ['#ec4899', '#f43f5e'],
      route: '/onboarding/voice',
    },
    {
      id: 'aadhar',
      title: 'Aadhaar Pre-fill',
      description: 'Fast-track onboarding using your Aadhaar details.',
      icon: 'card-outline',
      color: ['#10b981', '#3b82f6'],
      route: '/onboarding/aadhar',
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <AmbientBackground />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.header}>
            <ThemedText style={styles.headline}>Personalize Your Experience</ThemedText>
            <ThemedText style={styles.subheadline}>
              Hi {user?.fullName.split(' ')[0]}, choose how you'd like to provide your details for better scheme recommendations.
            </ThemedText>
          </Animated.View>

          <View style={styles.methodsGrid}>
            {methods.map((method, index) => (
              <Animated.View 
                key={method.id} 
                entering={FadeInDown.delay(400 + index * 100).duration(800)}
              >
                <TouchableOpacity 
                  activeOpacity={0.9} 
                  onPress={() => router.push(method.route as any)}
                  style={styles.methodCard}
                >
                  <BlurView intensity={20} tint="light" style={styles.methodBlur}>
                    <LinearGradient
                      colors={method.color as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.iconContainer}
                    >
                      <Ionicons name={method.icon as any} size={28} color="#FFFFFF" />
                    </LinearGradient>
                    
                    <View style={styles.methodInfo}>
                      <ThemedText style={styles.methodTitle}>{method.title}</ThemedText>
                      <ThemedText style={styles.methodDescription}>{method.description}</ThemedText>
                    </View>
                    
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
                  </BlurView>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          <Animated.View entering={FadeInDown.delay(800).duration(800)} style={styles.infoBox}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.premium.primary} />
            <ThemedText style={styles.infoText}>
              Your data is encrypted and used only for recommendation purposes.
            </ThemedText>
          </Animated.View>
        </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subheadline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 24,
  },
  methodsGrid: {
    gap: 16,
  },
  methodCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  methodBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    padding: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 16,
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    flex: 1,
  },
});
