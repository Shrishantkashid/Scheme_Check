import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import axios from 'axios';
import { debounce } from 'lodash';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AmbientBackground } from '@/components/ambient-background';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { SCHEMES, Scheme } from '@/constants/data';
import { API_URL } from '@/constants/config';

const { width } = Dimensions.get('window');

const CATEGORIES = ['All', 'Agriculture', 'Education', 'Healthcare', 'Employment', 'Finance'];
const STATES = ['All', 'Central', 'Karnataka'];

export default function ExploreScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchSchemes = async (query = '', cat = 'All', st = 'All') => {
    if (!token) return;
    try {
      setLoading(true);
      let url = `${API_URL}/schemes?limit=50`;
      if (query) url += `&search=${encodeURIComponent(query)}`;
      if (cat !== 'All') url += `&category=${encodeURIComponent(cat)}`;
      if (st !== 'All') url += `&state=${encodeURIComponent(st)}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchemes(res.data.schemes);
      setTotal(res.data.total);
    } catch (error) {
      console.error('Error fetching schemes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const debouncedFetch = useCallback(
    debounce((q, c, s) => fetchSchemes(q, c, s), 500),
    [token]
  );

  useEffect(() => {
    fetchSchemes(search, category, stateFilter);
  }, [category, stateFilter, token]);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    debouncedFetch(text, category, stateFilter);
  };

  const renderSchemeItem = ({ item, index }: { item: Scheme, index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50)}>
      <TouchableOpacity 
        style={styles.schemeItem}
        onPress={() => router.push(`/scheme/${item._id || item.id}`)}
      >
        <BlurView intensity={10} tint="light" style={styles.schemeInner}>
          <View style={styles.schemeHeader}>
            <ThemedText style={styles.schemeTitle}>{item.title}</ThemedText>
            <View style={styles.stateBadge}>
              <ThemedText style={styles.stateBadgeText}>{item.state}</ThemedText>
            </View>
          </View>
          <ThemedText numberOfLines={2} style={styles.schemeDesc}>{item.description}</ThemedText>
          <View style={styles.schemeFooter}>
            <View style={styles.catTag}>
              <ThemedText style={styles.catTagText}>{item.category}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <ThemedView style={styles.container}>
      <AmbientBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Explore Schemes</ThemedText>
          <ThemedText style={styles.subtitle}>{total} real schemes found</ThemedText>
          
          <View style={styles.searchBox}>
            <BlurView intensity={20} tint="light" style={styles.searchBlur}>
              <Ionicons name="search" size={20} color="rgba(255,255,255,0.4)" />
              <TextInput
                placeholder="Search by name, tags, or benefit..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={styles.searchInput}
                value={search}
                onChangeText={handleSearchChange}
              />
              {loading && <ActivityIndicator size="small" color={Colors.premium.primary} />}
            </BlurView>
          </View>

          <View style={styles.filtersContainer}>
            <FlatList
              horizontal
              data={CATEGORIES}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => setCategory(item)}
                  style={[styles.filterChip, category === item && styles.activeChip]}
                >
                  <ThemedText style={[styles.filterText, category === item && styles.activeFilterText]}>
                    {item}
                  </ThemedText>
                </TouchableOpacity>
              )}
            />
          </View>
          
          <View style={styles.stateSelector}>
            {STATES.map(st => (
              <TouchableOpacity 
                key={st}
                onPress={() => setStateFilter(st)}
                style={[styles.stateTab, stateFilter === st && styles.activeStateTab]}
              >
                <ThemedText style={[styles.stateTabText, stateFilter === st && styles.activeStateTabText]}>
                  {st}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <FlatList
          data={schemes}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderSchemeItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyBox}>
                <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.1)" />
                <ThemedText style={styles.emptyText}>No matching schemes found.</ThemedText>
              </View>
            ) : null
          }
        />
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
    marginBottom: 20,
  },
  searchBox: {
    height: 54,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  searchBlur: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    marginLeft: 12,
    fontSize: 16,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  activeChip: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  activeFilterText: {
    color: Colors.premium.primary,
  },
  stateSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  stateTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeStateTab: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stateTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
  },
  activeStateTabText: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  schemeItem: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  schemeInner: {
    padding: 20,
  },
  schemeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  schemeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
    marginRight: 12,
  },
  stateBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stateBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
  },
  schemeDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 20,
    marginBottom: 16,
  },
  schemeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catTag: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  catTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.premium.primary,
  },
  emptyBox: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 16,
    textAlign: 'center',
  },
});
