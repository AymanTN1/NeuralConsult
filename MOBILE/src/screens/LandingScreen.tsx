import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function LandingScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>NeuralConsult</Text>
        <Text style={styles.subtitle}>Sevrage Tabagique</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Votre parcours vers l'arrêt du tabac</Text>
        <Text style={styles.cardText}>
          Accompagnement personnalisé basé sur l'intelligence artificielle pour vous aider à arrêter de fumer durablement.
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>Se connecter</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.buttonOutline]} onPress={() => navigation.navigate('Register')}>
        <Text style={[styles.buttonText, styles.buttonTextOutline]}>Créer un compte</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  subtitle: {
    fontSize: 18,
    color: '#495057',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#0066CC',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0066CC',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextOutline: {
    color: '#0066CC',
  },
});
