import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_URL } from '../config/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      setErrorMessage('Ingresa tu correo electrónico.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo procesar tu solicitud.');

      setSent(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#034123" />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <Ionicons name="key-outline" size={32} color="#034123" />
          </View>

          <Text style={styles.title}>Recuperar Contraseña</Text>
          <Text style={styles.subtitle}>
            Ingresa el correo con el que te registraste. Te compartiremos un código para
            restablecer tu contraseña.
          </Text>

          {sent ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={40} color="#16A34A" />
              <Text style={styles.successText}>
                Si el correo está registrado, recibirás instrucciones para recuperar tu cuenta.
              </Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/reset-password')}>
                <Text style={styles.primaryButtonText}>Ya tengo mi código</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@empresa.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, { opacity: loading ? 0.7 : 1 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Enviar Instrucciones</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/reset-password')}>
                <Text style={styles.linkButtonText}>Ya tengo un código</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  backButton: { padding: 8, borderRadius: 8, backgroundColor: '#F1F5F9', alignSelf: 'flex-start', marginBottom: 24 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 19, marginBottom: 28, paddingHorizontal: 8 },
  errorText: { color: '#EF4444', textAlign: 'center', marginBottom: 16, fontSize: 13, fontWeight: '600' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 20,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#0F172A', fontSize: 14 },
  primaryButton: {
    backgroundColor: '#034123',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  linkButton: { marginTop: 16, alignItems: 'center' },
  linkButtonText: { fontSize: 13, color: '#034123', fontWeight: '600' },
  successBox: { alignItems: 'center', paddingVertical: 10 },
  successText: { fontSize: 14, color: '#166534', textAlign: 'center', marginVertical: 16, lineHeight: 20 },
});
