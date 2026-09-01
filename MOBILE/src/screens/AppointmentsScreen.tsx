import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import api from '../services/api';

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<any[]>([]);

  const fetchAppointments = async () => {
    try {
      const { data } = await api.get('/api/appointments');
      setAppointments(data);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rendez-vous</Text>
      </View>
      {appointments.length === 0 && (
        <Text style={styles.empty}>Aucun rendez-vous planifié.</Text>
      )}
      {appointments.map((a) => (
        <View key={a.id} style={styles.card}>
          <Text style={styles.cardTitle}>{a.title || 'Rendez-vous'}</Text>
          <Text style={styles.cardText}>{a.dateTime || a.date}</Text>
        </View>
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
  cardText: { fontSize: 14, color: '#495057', marginTop: 4 },
});

