import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Linking, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import axios from 'axios';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AmbientBackground } from '@/components/ambient-background';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { API_URL } from '@/constants/config';
import { Scheme } from '@/constants/data';

const { width } = Dimensions.get('window');

export default function SchemeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchemeDetails = async () => {
      try {
        const res = await axios.get(`${API_URL}/schemes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setScheme(res.data);
      } catch (error) {
        console.error('Error fetching scheme details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchSchemeDetails();
    }
  }, [id, token]);

  const handleApply = () => {
    if (scheme?.applyLink) {
      Linking.openURL(scheme.applyLink);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.premium.primary} />
      </ThemedView>
    );
  }

  if (!scheme) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Scheme not found</ThemedText>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText style={{ color: Colors.premium.primary, marginTop: 20 }}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <AmbientBackground />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <BlurView intensity={20} tint="light" style={styles.backBlur}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </BlurView>
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Scheme Details</ThemedText>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.mainInfo}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                <ThemedText style={styles.badgeText}>{scheme.state}</ThemedText>
              </View>
              <View style={[styles.badge, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                <ThemedText style={styles.badgeText}>{scheme.category}</ThemedText>
              </View>
            </View>

            <ThemedText style={styles.title}>{scheme.title}</ThemedText>
            <ThemedText style={styles.description}>{scheme.description}</ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Benefits</ThemedText>
            <BlurView intensity={10} tint="light" style={styles.sectionCard}>
              <ThemedText style={styles.sectionText}>{scheme.benefits}</ThemedText>
            </BlurView>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Tags & Beneficiaries</ThemedText>
            <View style={styles.tagsContainer}>
              {scheme.tags.map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <ThemedText style={styles.tagText}># {tag}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {scheme.applyLink && (
            <View style={styles.footer}>
              <TouchableOpacity onPress={handleApply} style={styles.applyButton}>
                <ThemedText style={styles.applyButtonText}>Apply Now</ThemedText>
                <Ionicons name="open-outline" size={20} color="#000" />
              </TouchableOpacity>
              <ThemedText style={styles.disclaimer}>
                You will be redirected to the official government portal.
              </ThemedText>
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  backBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  mainInfo: {
    marginBottom: 32,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.premium.primary,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    lineHeight: 34,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
  },
  sectionCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.premium.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  disclaimer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 12,
    textAlign: 'center',
  },
});
