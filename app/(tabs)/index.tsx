import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, TextInput, ScrollView, TouchableOpacity, Dimensions, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeInRight } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AmbientBackground } from '@/components/ambient-background';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { SCHEMES, Scheme } from '@/constants/data';
import { API_URL } from '@/constants/config';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user, token } = useAuth();
  const [schemeSearch, setSchemeSearch] = useState('');
  const [newsSearch, setNewsSearch] = useState('');
  const [recommendations, setRecommendations] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/schemes/recommend`, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      
      if (res.ok) {
        setRecommendations(data.recommendations);
      } else {
        throw new Error('Failed to fetch recommendations');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations(SCHEMES.slice(0, 3));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token && user?.isOnboarded) {
      fetchRecommendations();
    } else {
      setLoading(false);
    }
  }, [token, user?.isOnboarded]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecommendations();
  };

  const filteredSchemes = useMemo(() => {
    if (!schemeSearch) {
      return recommendations.length > 0 ? recommendations : SCHEMES;
    }
    return (recommendations.length > 0 ? recommendations : SCHEMES).filter(s => 
      s.title.toLowerCase().includes(schemeSearch.toLowerCase()) || 
      s.category.toLowerCase().includes(schemeSearch.toLowerCase())
    );
  }, [schemeSearch, recommendations]);

  const router = useRouter();
  const firstName = user?.fullName?.split(' ')[0] || 'User';

  const handleSchemePress = (scheme: Scheme) => {
    const id = scheme._id || scheme.id;
    if (id) {
      router.push(`/scheme/${id}`);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" />
      <AmbientBackground />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.premium.primary} />
          }
        >
          
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
            <View>
              <ThemedText style={styles.greeting}>Intelligence Center</ThemedText>
              <ThemedText style={styles.userName}>Hello, {firstName}</ThemedText>
            </View>
            <TouchableOpacity style={styles.profileCircle}>
              <ThemedText style={styles.avatarInitial}>{firstName[0]}</ThemedText>
            </TouchableOpacity>
          </Animated.View>

          {/* Dual Search Section */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.searchSection}>
            <ThemedText style={styles.sectionTitle}>Global Search</ThemedText>
            
            <View style={styles.searchContainer}>
              <View style={styles.searchInputWrapper}>
                <BlurView intensity={20} tint="light" style={styles.searchBlur}>
                  <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    placeholder="Search Schemes..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    style={styles.searchInput}
                    value={schemeSearch}
                    onChangeText={setSchemeSearch}
                    onFocus={() => router.push('/(tabs)/explore')}
                  />
                </BlurView>
              </View>
              
              <View style={styles.searchInputWrapper}>
                <BlurView intensity={20} tint="light" style={styles.searchBlur}>
                  <Ionicons name="newspaper-outline" size={18} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    placeholder="Search News..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    style={styles.searchInput}
                    value={newsSearch}
                    onChangeText={setNewsSearch}
                  />
                </BlurView>
              </View>
            </View>
          </Animated.View>

          {/* Recommended Schemes */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Precision Recommendations</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>Tailored based on your recent onboarding data</ThemedText>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.horizontalScroll}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={Colors.premium.primary} />
                  <ThemedText style={styles.loadingText}>AI Ranking...</ThemedText>
                </View>
              ) : (
                recommendations.map((scheme, index) => (
                  <Animated.View 
                    key={scheme._id || scheme.id} 
                    entering={FadeInRight.delay(600 + index * 100)}
                  >
                    <SchemeCard scheme={scheme} onPress={() => handleSchemePress(scheme)} />
                  </Animated.View>
                ))
              )}
            </ScrollView>
          </View>

          {/* New & Trending */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>New in {user?.profile?.occupation || 'General'}</ThemedText>
            <View style={styles.verticalList}>
              {filteredSchemes.slice(0, 4).map((scheme, index) => (
                <Animated.View 
                  key={scheme._id || scheme.id} 
                  entering={FadeInUp.delay(800 + index * 100)}
                >
                  <SchemeListItem scheme={scheme} onPress={() => handleSchemePress(scheme)} />
                </Animated.View>
              ))}
            </View>
          </View>

          {/* News Section (Empty per request) */}
          <View style={[styles.section, { marginBottom: 40 }]}>
            <ThemedText style={styles.sectionTitle}>National Updates & Protests</ThemedText>
            <BlurView intensity={10} tint="light" style={styles.emptyNewsBox}>
              <Ionicons name="notifications-off-outline" size={32} color="rgba(255,255,255,0.2)" />
              <ThemedText style={styles.emptyNewsText}>No recent news updates available in your region.</ThemedText>
            </BlurView>
          </View>

        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function SchemeCard({ scheme, onPress }: { scheme: Scheme, onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
      <BlurView intensity={20} tint="light" style={styles.cardBlur}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryBadge}>
            <ThemedText style={styles.categoryText}>{scheme.state || 'National'}</ThemedText>
          </View>
          {scheme.matchScore && (
            <View style={styles.matchBadge}>
              <ThemedText style={styles.matchText}>{scheme.matchScore}% FIT</ThemedText>
            </View>
          )}
        </View>
        <ThemedText numberOfLines={1} style={styles.cardTitle}>{scheme.title}</ThemedText>
        <ThemedText numberOfLines={3} style={styles.cardReason}>
          {scheme.personalReason || scheme.description}
        </ThemedText>
        
        <View style={styles.cardFooter}>
          <ThemedText style={styles.beneficiaryText}>{scheme.category}</ThemedText>
          <Ionicons name="chevron-forward" size={16} color={Colors.premium.primary} />
        </View>
      </BlurView>
    </TouchableOpacity>
  );
}

function SchemeListItem({ scheme, onPress }: { scheme: Scheme, onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.listItem} onPress={onPress}>
      <BlurView intensity={15} tint="light" style={styles.listItemBlur}>
        <View style={styles.listItemIcon}>
          <Ionicons name="document-text-outline" size={24} color={Colors.premium.primary} />
        </View>
        <View style={styles.listItemContent}>
          <ThemedText style={styles.listItemTitle}>{scheme.title}</ThemedText>
          <ThemedText style={styles.listItemCategory}>{scheme.category} • {scheme.beneficiary}</ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.2)" />
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
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.premium.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  profileCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.premium.primary,
  },
  searchSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  searchInputWrapper: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchBlur: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 14,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  horizontalScroll: {
    paddingHorizontal: 24,
    gap: 16,
  },
  card: {
    width: width * 0.75,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  cardBlur: {
    padding: 24,
    height: 180,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.premium.primary,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 24,
  },
  cardDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  beneficiaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
  },
  verticalList: {
    paddingHorizontal: 24,
    gap: 12,
    marginTop: 12,
  },
  listItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  listItemBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  listItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  listItemCategory: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  emptyNewsBox: {
    marginHorizontal: 24,
    marginTop: 16,
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  emptyNewsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  loadingContainer: {
    width: width - 48,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  matchText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#22c55e',
  },
  cardReason: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    marginBottom: 12,
    fontStyle: 'italic',
  },
});
