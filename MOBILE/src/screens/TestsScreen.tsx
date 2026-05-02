import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import api from '../services/api';

export default function TestsScreen() {
  const [tests, setTests] = useState<any[]>([]);

  const fetchTests = async () => {
    try {
      const { data } = await api.get('/api/tests');
      setTests(data);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const startTest = (testId: number) => {
    Alert.alert('Test', `Démarrage du test ${testId} (à implémenter)`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tests</Text>
      </View>
      {tests.length === 0 && (
        <Text style={styles.empty}>Aucun test disponible pour le moment.</Text>
      )}
      {tests.map((test) => (
        <TouchableOpacity key={test.id} style={styles.card} onPress={() => startTest(test.id)}>
          <Text style={styles.cardTitle}>{test.title}</Text>
          <Text style={styles.cardDesc}>{test.description}</Text>
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

