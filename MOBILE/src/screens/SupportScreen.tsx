import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import api from '../services/api';

export default function SupportScreen() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {

      Alert.alert('Succès', 'Message envoyé au support.');
      setMessage('');
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Support</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Décrivez votre problème</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={4}
          placeholder="Votre message..."
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity style={styles.button} onPress={sendMessage} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Envoi...' : 'Envoyer'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 24, paddingTop: 48, backgroundColor: '#fff', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0066CC' },
  card: { backgroundColor: '#fff', marginHorizontal: 12, padding: 16, borderRadius: 12, elevation: 2 },
  label: { fontSize: 14, color: '#495057', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#dee2e6', borderRadius: 8, padding: 12, minHeight: 100, textAlignVertical: 'top', fontSize: 16 },
  button: { backgroundColor: '#0066CC', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

