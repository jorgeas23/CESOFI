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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_URL } from '../config/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(params.token || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    if (!token.trim() || !newPassword || !confirmPassword) {
      setErrorMessage('Completa todos los campos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo restablecer tu contraseña.');

      setDone(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={72} color="#16A34A" />
          <Text style={styles.title}>¡Contraseña Actualizada!</Text>
          <Text style={styles.subtitle}>Ya puedes iniciar sesión con tu nueva contraseña.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/login')}>
            <Text style={styles.primaryButtonText}>Ir a Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#034123" />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark-outline" size={32} color="#034123" />
          </View>

          <Text style={styles.title}>Restablecer Contraseña</Text>
          <Text style={styles.subtitle}>
            Pega el código que te compartimos y elige tu nueva contraseña.
          </Text>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <Text style={styles.label}>Código de recuperación</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="key-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Pega aquí tu código"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              value={token}
              onChangeText={setToken}
            />
          </View>

          <Text style={styles.label}>Nueva contraseña</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirmar contraseña</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Repite tu nueva contraseña"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { opacity: loading ? 0.7 : 1, marginTop: 8 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Restablecer Contraseña</Text>
            )}
          </TouchableOpacity>
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
  subtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 19, marginBottom: 24, paddingHorizontal: 8 },
  errorText: { color: '#EF4444', textAlign: 'center', marginBottom: 16, fontSize: 13, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 18,
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
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
});
