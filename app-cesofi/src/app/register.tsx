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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_URL } from '../config/api';

const logoImg = require('../../assets/logo.png');

export default function RegisterScreen() {
  const router = useRouter();

  // Modo de registro: empresa nueva (manual) o empresario ya evaluado por SIDEC (por folio)
  const [mode, setMode] = useState<'manual' | 'folio'>('manual');

  // Estados del Formulario sincronizados con el backend
  const [companyName, setCompanyName] = useState('');
  const [rfc, setRfc] = useState(''); // Opcional
  const [folio, setFolio] = useState(''); // Modo "folio"
  const [name, setName] = useState(''); // Nombre del contacto
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de control de la interfaz
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successCompanyName, setSuccessCompanyName] = useState('');

  const handleRegister = async () => {
    setErrorMessage('');

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Por favor completa todos los campos obligatorios (*).');
      return;
    }

    if (mode === 'manual' && !companyName.trim()) {
      setErrorMessage('Por favor completa todos los campos obligatorios (*).');
      return;
    }

    if (mode === 'folio' && !folio.trim()) {
      setErrorMessage('Ingresa tu Folio de Atención CESOFI.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Asegúrate de que ambas contraseñas coincidan.');
      return;
    }

    const endpoint = mode === 'folio' ? '/api/auth/register-folio' : '/api/auth/register';
    const payload =
      mode === 'folio'
        ? { folio: folio.trim(), name: name.trim(), email: email.trim(), password }
        : {
            companyName: companyName.trim(),
            name: name.trim(),
            email: email.trim(),
            password,
            rfc: rfc.trim() ? rfc.trim() : null,
          };

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocurrió un error al registrarse.');
      }

      setSuccessCompanyName(data.user?.company?.name || companyName);
      setIsSuccess(true);
    } catch (error: any) {
      console.error('Error en el registro:', error);
      const msg = error instanceof Error ? error.message : 'No se pudo conectar con el servidor.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // VISTA DE ÉXITO TRAS REGISTRARSE
  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark-circle" size={72} color="#16A34A" />
          </View>
          <Text style={styles.successTitle}>¡Registro Exitoso!</Text>
          <Text style={styles.successSubtitle}>
            Tu cuenta y la empresa <Text style={styles.boldText}>{successCompanyName}</Text> han sido creadas correctamente en la plataforma CESOFI.
          </Text>

          <TouchableOpacity
            style={styles.goToLoginButton}
            onPress={() => router.replace('/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.goToLoginText}>Ir a Iniciar Sesión</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/login');
                }
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#034123" />
            </TouchableOpacity>
            <Image source={logoImg} style={styles.logoImage} resizeMode="contain" />
          </View>

          <View style={styles.textHeader}>
            <Text style={styles.title}>Registro de Empresa</Text>
            <Text style={styles.subtitle}>
              Crea una cuenta para evaluar y gestionar la sostenibilidad de tu empresa.
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Selector de modo de registro */}
            <View style={styles.modeSelector}>
              <TouchableOpacity
                style={[styles.modeTab, mode === 'manual' && styles.modeTabActive]}
                onPress={() => setMode('manual')}
              >
                <Text style={[styles.modeTabText, mode === 'manual' && styles.modeTabTextActive]}>
                  Registro Manual
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeTab, mode === 'folio' && styles.modeTabActive]}
                onPress={() => setMode('folio')}
              >
                <Text style={[styles.modeTabText, mode === 'folio' && styles.modeTabTextActive]}>
                  Ya tengo Folio CESOFI
                </Text>
              </TouchableOpacity>
            </View>

            {mode === 'folio' ? (
              <>
                {/* Folio de Atención CESOFI */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Folio de Atención CESOFI *</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="pricetag-outline" size={20} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Ej. CESOFI-2026-0002"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                      value={folio}
                      onChangeText={setFolio}
                    />
                  </View>
                  <Text style={styles.helperText}>
                    Es el folio que te asignó tu asesor cuando evaluaron tu negocio. Con él traemos
                    automáticamente el nombre y RFC de tu empresa.
                  </Text>
                </View>
              </>
            ) : (
              <>
                {/* Nombre de la Empresa */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nombre de la Empresa *</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="business-outline" size={20} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Ej. Industrias CESOFI S.A."
                      placeholderTextColor="#94A3B8"
                      value={companyName}
                      onChangeText={setCompanyName}
                    />
                  </View>
                </View>

                {/* RFC (Opcional) */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelWrapper}>
                    <Text style={styles.label}>RFC / Identificación Fiscal</Text>
                    <Text style={styles.optionalText}>(Opcional)</Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="card-outline" size={20} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="ABC123456XYZ"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                      value={rfc}
                      onChangeText={setRfc}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Persona de Contacto */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre del Contacto Principal *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Juan Pérez"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Correo Electrónico */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo corporativo *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="contacto@empresa.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña *</Text>
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

            {/* Confirmar Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Contraseña *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            {/* Botón de Registro con estado Loading */}
            <TouchableOpacity
              style={[styles.registerButton, { opacity: loading ? 0.7 : 1 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.registerButtonText}>Registrar Empresa</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer para ir a Login */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginText}>Inicia Sesión</Text>
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
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  logoImage: {
    width: 110,
    height: 90,
  },
  textHeader: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  formContainer: {
    width: '100%',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#034123',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  helperText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 15,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  optionalText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginBottom: 6,
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
  registerButton: {
    backgroundColor: '#034123',
    height: 50,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    elevation: 2,
    shadowColor: '#034123',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
  },
  loginText: {
    fontSize: 13,
    color: '#034123',
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  successIconCircle: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
  goToLoginButton: {
    backgroundColor: '#034123',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#034123',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  goToLoginText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});