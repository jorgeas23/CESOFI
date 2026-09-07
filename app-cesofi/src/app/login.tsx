import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { API_URL } from '../config/api';

const logoImg = require('../../assets/logo.png');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Verificando credenciales...');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setLoadingMessage('Verificando credenciales...');
    setErrorMessage('');

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Correo o contraseña incorrectos.');
      }

      // --- GUARDAR TOKEN Y DATOS DEL USUARIO EN ASYNCSTORAGE ---
      await AsyncStorage.setItem('token', data.token);
      if (data.user && data.user.name) {
        await AsyncStorage.setItem('userName', data.user.name);
      }
      if (data.user && data.user.company && data.user.company.name) {
        await AsyncStorage.setItem('userCompany', data.user.company.name);
      } else {
        // Sin empresa (ej. un admin) — no dejar el nombre de la empresa de una sesión anterior.
        await AsyncStorage.removeItem('userCompany');
      }
      if (data.user && data.user.role) {
        await AsyncStorage.setItem('userRole', data.user.role);
      }

      // Un administrador no es un empresario: va directo a su panel, nunca al dashboard.
      const destino = data.user?.role === 'ADMIN' ? '/admin' : '/';

      // Mostrar mensaje de éxito brevemente antes de navegar
      setLoadingMessage('¡Bienvenido! Cargando tu cuenta...');
      setTimeout(() => {
        setLoading(false);
        router.replace(destino);
      }, 700);

    } catch (error: any) {
      console.error('Error en el login:', error);
      const msg = error instanceof Error ? error.message : 'Error al conectar con el servidor.';
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Overlay de carga animado */}
      <LoadingOverlay visible={loading} message={loadingMessage} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoHeader}>
            <Image source={logoImg} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.welcomeTitle}>¡Bienvenido de nuevo!</Text>
            <Text style={styles.welcomeSubtitle}>
              Ingresa tus credenciales para acceder a la plataforma CESOFI
            </Text>
          </View>

          <View style={styles.formContainer}>
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo electrónico</Text>
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
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotPasswordButton} onPress={() => router.push('/forgot-password')}>
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, { opacity: loading ? 0.6 : 1 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Verificando...' : 'Iniciar Sesión'}
              </Text>
              {!loading && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Aún no tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.registerText}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoHeader: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoImage: {
    width: 160,
    height: 130,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
  },
  eyeIcon: {
    padding: 6,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#034123',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#034123',
    height: 50,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#034123',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
  },
  registerText: {
    fontSize: 13,
    color: '#034123',
    fontWeight: 'bold',
  },
});