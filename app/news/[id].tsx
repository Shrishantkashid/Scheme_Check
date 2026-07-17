import React, { useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AmbientBackground } from '@/components/ambient-background';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

// Mock data to match what's in index.tsx
const MOCK_NEWS = [
  { 
    id: '1', 
    title: 'New Education Policy Framework Announced', 
    date: '2 hours ago', 
    type: 'Update',
    content: 'The Ministry of Education has announced a comprehensive new policy framework aimed at modernizing technical and higher education. The framework focuses on integrating AI and digital literacy into core curriculums across the nation. Additional funding has been allocated to rural schools to upgrade their infrastructure. This move is expected to bridge the digital divide and prepare students for the demands of the 21st-century workforce. Educational institutions have been given a timeline of two years to fully implement these changes.'
  },
  { 
    id: '2', 
    title: 'Student Protests in Capital Regarding Scholarship Delays', 
    date: '5 hours ago', 
    type: 'Protest',
    content: 'Thousands of university students gathered in the capital today to protest ongoing delays in the disbursement of national scholarships. Representatives from various student unions argued that the delays are causing severe financial strain on scholars from marginalized communities. The Ministry of Finance has issued a preliminary statement assuring that the backlog will be cleared within the next two weeks. However, student leaders have vowed to continue their peaceful demonstrations until concrete administrative actions are taken.'
  },
  { 
    id: '3', 
    title: 'Government Increases Funding for Technical Education', 
    date: '1 day ago', 
    type: 'Update',
    content: 'In a significant boost to the technology sector, the central government has increased the budget for technical and engineering education by 15% for the upcoming fiscal year. This funding is primarily targeted at upgrading laboratories, establishing new research centers in emerging technologies like Quantum Computing and Robotics, and providing better stipends for PhD researchers. Industry experts have welcomed the move, highlighting that it aligns perfectly with the national goal of becoming a global technology hub.'
  },
];

export default function NewsDetailScreen() {
  const { id, data } = useLocalSearchParams();
  const router = useRouter();

  const newsItem = useMemo(() => {
    if (data) {
      try {
        return JSON.parse(data as string);
      } catch (e) {
        console.error('Failed to parse news data:', e);
      }
    }
    return MOCK_NEWS.find(n => n.id === id);
  }, [id, data]);

  if (!newsItem) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>News article not found</ThemedText>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText style={{ color: Colors.premium.primary, marginTop: 20 }}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const isProtest = newsItem.type === 'Protest';

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
          <ThemedText style={styles.headerTitle}>Update Details</ThemedText>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.mainInfo}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: isProtest ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', borderColor: isProtest ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)' }]}>
                <Ionicons 
                  name={isProtest ? 'warning' : 'megaphone'} 
                  size={14} 
                  color={isProtest ? '#ef4444' : '#3b82f6'} 
                  style={{ marginRight: 6 }} 
                />
                <ThemedText style={[styles.badgeText, { color: isProtest ? '#ef4444' : '#3b82f6' }]}>{newsItem.type}</ThemedText>
              </View>
              <View style={[styles.badge, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.6)" style={{ marginRight: 6 }} />
                <ThemedText style={[styles.badgeText, { color: 'rgba(255,255,255,0.6)' }]}>{newsItem.date}</ThemedText>
              </View>
            </View>

            <ThemedText style={styles.title}>{newsItem.title}</ThemedText>
          </View>

          <View style={styles.section}>
            <BlurView intensity={10} tint="light" style={styles.contentCard}>
              <ThemedText style={styles.contentText}>{newsItem.content}</ThemedText>
            </BlurView>
          </View>
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
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    lineHeight: 34,
  },
  section: {
    marginBottom: 32,
  },
  contentCard: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  contentText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 26,
  },
});
