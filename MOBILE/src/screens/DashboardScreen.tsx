import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const { data: userData } = await api.get('/api/me');
      const { data: planData } = await api.get('/api/sevrage-plan/current').catch(() => ({ data: null }));
      setStats({
        daysSmokeFree: planData?.daysSmokeFree ?? 0,
        nextAppointment: 'Aucun rendez-vous planifié',
        evaluationScore: '-',
        user: userData,
      });
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboard} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonjour, {user?.firstName || 'Patient'}</Text>
        <Text style={styles.subtitle}>Votre tableau de bord</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Jours sans fumer</Text>
        <Text style={styles.cardValue}>{stats.daysSmokeFree ?? 0}</Text>
        <Text style={styles.cardLabel}>Continuez comme ça !</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Prochain rendez-vous</Text>
        <Text style={styles.cardText}>{stats.nextAppointment || 'Aucun rendez-vous planifié'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Score d'évaluation</Text>
        <Text style={styles.cardValue}>{stats.evaluationScore ?? '-'}</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 24, paddingTop: 48, backgroundColor: '#fff' },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#212529' },
  subtitle: { fontSize: 16, color: '#6c757d', marginTop: 4 },
  card: { backgroundColor: '#fff', margin: 12, padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 14, color: '#6c757d', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardValue: { fontSize: 32, fontWeight: 'bold', color: '#0066CC' },
  cardLabel: { fontSize: 14, color: '#28a745', marginTop: 4 },
  cardText: { fontSize: 16, color: '#495057' },
  logoutButton: { margin: 12, padding: 14, backgroundColor: '#dc3545', borderRadius: 8, alignItems: 'center' },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

