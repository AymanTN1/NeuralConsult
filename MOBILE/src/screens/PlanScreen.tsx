import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import api from '../services/api';

export default function PlanScreen() {
  const [plan, setPlan] = useState<any>(null);

  const fetchPlan = async () => {
    try {
      const { data } = await api.get('/api/sevrage-plan/current');
      setPlan(data);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Plan de sevrage</Text>
      </View>
      {!plan && <Text style={styles.empty}>Aucun plan disponible.</Text>}
      {plan && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Objectif</Text>
          <Text style={styles.cardText}>{plan.objective || 'Non défini'}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 24, paddingTop: 48, backgroundColor: '#fff', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0066CC' },
  empty: { textAlign: 'center', color: '#6c757d', marginTop: 40 },
  card: { backgroundColor: '#fff', marginHorizontal: 12, padding: 16, borderRadius: 12, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#212529', marginBottom: 8 },
  cardText: { fontSize: 14, color: '#495057' },
});

