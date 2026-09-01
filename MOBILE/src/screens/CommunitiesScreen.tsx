import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import api from '../services/api';

export default function CommunitiesScreen() {
  const [communities, setCommunities] = useState<any[]>([]);

  const fetchCommunities = async () => {
    try {
      const { data } = await api.get('/api/communities');
      setCommunities(data);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Communautés</Text>
      </View>
      {communities.length === 0 && (
        <Text style={styles.empty}>Aucune communauté disponible pour le moment.</Text>
      )}
      {communities.map((c) => (
        <TouchableOpacity key={c.id} style={styles.card}>
          <Text style={styles.cardTitle}>{c.name}</Text>
          <Text style={styles.cardDesc}>{c.description}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 24, paddingTop: 48, backgroundColor: '#fff', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0066CC' },
  empty: { textAlign: 'center', color: '#6c757d', marginTop: 40 },
  card: { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8, padding: 16, borderRadius: 12, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#212529' },
  cardDesc: { fontSize: 14, color: '#6c757d', marginTop: 4 },
});

