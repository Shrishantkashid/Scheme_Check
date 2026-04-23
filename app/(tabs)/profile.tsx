import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AmbientBackground } from '@/components/ambient-background';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { API_URL } from '@/constants/config';

export default function ProfileScreen() {
  const { user, token, signOut, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isReseting, setIsReseting] = useState(false);
  
  // Simulated success states for linking
  const [linked, setLinked] = useState({
    phone: !!user?.phoneNumber,
    google: !!user?.linkedAccounts?.google,
    apple: !!user?.linkedAccounts?.apple
  });

  const [editValues, setEditValues] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || ''
  });

  const handleUpdateInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/user/update-info`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editValues)
      });
      const data = await res.json();
      
      if (res.ok) {
        updateUser(data.user);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Profile',
      'Would you like to edit your existing answers or start the onboarding process from scratch?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Edit Existing', 
          onPress: async () => {
            // Keep status quo, just redirect to first question without clearing
            setIsReseting(true);
            try {
              // We just set isOnboarded to false but keep profile data
              const res = await fetch(`${API_URL}/user/profile`, {
                method: "PUT",
                headers: {
                  "Authorization": `Bearer ${token}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ isOnboarded: false })
              });
              
              if (res.ok) {
                updateUser({ isOnboarded: false });
                
                // Small delay for AuthContext state propagation
                setTimeout(() => {
                  router.replace('/onboarding/manual');
                }, 100);
              } else {
                throw new Error('Failed to update status');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to update status');
            } finally {
              setIsReseting(false);
            }
          }
        },
        { 
          text: 'Start Fresh', 
          style: 'destructive',
          onPress: async () => {
            setIsReseting(true);
            try {
              // We use the stabilized PUT profile route with a reset flag
              const res = await fetch(`${API_URL}/user/profile`, {
                method: "PUT",
                headers: {
                  "Authorization": `Bearer ${token}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ reset: true })
              });
              
              if (res.ok) {
                // CRITICAL: Wipe local state BEFORE redirecting
                updateUser({ 
                  isOnboarded: false, 
                  lastQuestionId: null, 
                  profile: {} 
                });
                
                // Small delay for AuthContext state propagation
                setTimeout(() => {
                  router.replace('/onboarding');
                }, 100);
              } else {
                throw new Error('Failed to perform a fresh reset');
              }
            } catch (error: any) {
              console.error('Reset Error Details:', error.message);
              Alert.alert('Error', 'Failed to perform a fresh reset. Please check your connection.');
            } finally {
              setIsReseting(false);
            }
          }
        }
      ]
    );
  };

  const simulateLinking = (type: keyof typeof linked) => {
    Alert.alert('Simulating...', `Connecting to ${type}...`);
    setTimeout(() => {
      setLinked(prev => ({ ...prev, [type]: true }));
      Alert.alert('Success', `${type.charAt(0).toUpperCase() + type.slice(1)} linked successfully!`);
    }, 1500);
  };

  return (
    <ThemedView style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Profile Header */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.header}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <ThemedText style={styles.avatarText}>{user?.fullName?.[0]}</ThemedText>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ThemedText style={styles.name}>{user?.fullName}</ThemedText>
            <ThemedText style={styles.email}>{user?.email}</ThemedText>
          </Animated.View>

          {/* Account Linking Simulation */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Linked Accounts</ThemedText>
            <View style={styles.linkingGrid}>
              <LinkItem 
                icon="call-outline" 
                label="Phone" 
                isConnected={linked.phone} 
                onPress={() => simulateLinking('phone')}
              />
              <LinkItem 
                icon="logo-google" 
                label="Google" 
                isConnected={linked.google} 
                onPress={() => simulateLinking('google')}
              />
              <LinkItem 
                icon="logo-apple" 
                label="Apple" 
                isConnected={linked.apple} 
                onPress={() => simulateLinking('apple')}
              />
            </View>
          </Animated.View>

          {/* Settings Actions */}
          <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Application Settings</ThemedText>
            <View style={styles.actionList}>
              <ActionItem 
                icon="refresh-outline" 
                label="Retake Onboarding Steps" 
                onPress={handleResetOnboarding}
                loading={isReseting}
              />
              <ActionItem 
                icon="key-outline" 
                label="Forgot / Change Password" 
                onPress={() => Alert.alert('Forgot Password', 'Password reset instructions sent to your email.')} 
              />
              <ActionItem 
                icon="star-outline" 
                label="Rate the App" 
                onPress={() => Alert.alert('Rate Us', 'Thank you for your interest! Rating popup would appear here.')} 
              />
              <ActionItem 
                icon="log-out-outline" 
                label="Sign Out" 
                color="#ef4444"
                onPress={signOut} 
              />
            </View>
          </Animated.View>

          <ThemedText style={styles.version}>Version 1.2.4 (Premium Tier)</ThemedText>

        </ScrollView>
      </SafeAreaView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditing} animationType="slide" transparent>
        <BlurView intensity={90} style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Edit Profile</ThemedText>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Full Name</ThemedText>
              <TextInput 
                style={styles.modalInput} 
                value={editValues.fullName} 
                onChangeText={(v) => setEditValues(p => ({ ...p, fullName: v }))}
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
              <ThemedText style={styles.inputLabel}>Email</ThemedText>
              <TextInput 
                style={styles.modalInput} 
                value={editValues.email} 
                onChangeText={(v) => setEditValues(p => ({ ...p, email: v }))}
                keyboardType="email-address"
              />
              <ThemedText style={styles.inputLabel}>Phone Number</ThemedText>
              <TextInput 
                style={styles.modalInput} 
                value={editValues.phoneNumber} 
                onChangeText={(v) => setEditValues(p => ({ ...p, phoneNumber: v }))}
                placeholder="Not linked"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <ThemedText style={styles.cancelText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleUpdateInfo}>
                <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </BlurView>
      </Modal>

    </ThemedView>
  );
}

function LinkItem({ icon, label, isConnected, onPress }: any) {
  return (
    <TouchableOpacity style={styles.linkItem} onPress={onPress} disabled={isConnected}>
      <BlurView intensity={isConnected ? 30 : 10} tint="light" style={styles.linkBlur}>
        <Ionicons name={icon} size={24} color={isConnected ? Colors.premium.primary : "rgba(255,255,255,0.4)"} />
        <ThemedText style={[styles.linkLabel, isConnected && { color: Colors.premium.primary }]}>
          {isConnected ? "Linked" : `Link ${label}`}
        </ThemedText>
      </BlurView>
    </TouchableOpacity>
  );
}

function ActionItem({ icon, label, onPress, color = "#FFF", loading = false }: any) {
  return (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <Ionicons name={icon} size={20} color={color} style={{ opacity: 0.6 }} />
      <ThemedText style={[styles.actionLabel, { color }]}>{label}</ThemedText>
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
      )}
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
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.premium.primary,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.premium.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.background,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.premium.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  linkingGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  linkItem: {
    flex: 1,
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
  },
  linkBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 8,
  },
  linkLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
  },
  actionList: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.2)',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    padding: 32,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 24,
  },
  inputGroup: {
    gap: 16,
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: -8,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelText: {
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.premium.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '800',
  },
});
