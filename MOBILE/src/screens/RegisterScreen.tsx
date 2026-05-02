import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const { register } = useAuth();
  const navigation = useNavigation<any>();

  const handleRegister = async () => {
    if (!acceptsTerms) {
      Alert.alert('Conditions', 'Vous devez accepter les conditions d\'utilisation pour créer un compte.');
      return;
    }
    try {
      await register({ email, password, firstName, lastName, role: 'PATIENT', acceptsTerms });
      Alert.alert('Succès', 'Compte créé. Veuillez vérifier votre email.');
      navigation.navigate('Login');
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || 'Échec de l\'inscription');
    }
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Créer un compte</Text>
      <TextInput style={styles.input} placeholder="Prénom" value={firstName} onChangeText={setFirstName} />
      <TextInput style={styles.input} placeholder="Nom" value={lastName} onChangeText={setLastName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.termsContainer} onPress={() => setAcceptsTerms(!acceptsTerms)}>
        <View style={[styles.checkbox, acceptsTerms && styles.checkboxChecked]}>
          {acceptsTerms && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.termsText}>J'accepte les conditions d'utilisation</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, !acceptsTerms && styles.buttonDisabled]} onPress={handleRegister} disabled={!acceptsTerms}>
        <Text style={styles.buttonText}>S'inscrire</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#0066CC', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#dee2e6', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: '#0066CC', borderRadius: 4, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#0066CC' },
  checkmark: { color: '#fff', fontWeight: 'bold' },
  termsText: { flex: 1, fontSize: 14, color: '#495057' },
  button: { backgroundColor: '#0066CC', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#adb5bd', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
