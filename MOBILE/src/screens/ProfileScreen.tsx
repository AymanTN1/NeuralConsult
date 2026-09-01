import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Nom</Text>
        <Text style={styles.value}>{user?.lastName || '-'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Prénom</Text>
        <Text style={styles.value}>{user?.firstName || '-'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email || '-'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Rôle</Text>
        <Text style={styles.value}>{user?.role || '-'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 24, paddingTop: 48, backgroundColor: '#fff', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0066CC' },
  card: { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 8, padding: 16, borderRadius: 12 },
  label: { fontSize: 12, color: '#6c757d', textTransform: 'uppercase', marginBottom: 4 },
  value: { fontSize: 18, color: '#212529', fontWeight: '500' },
});

