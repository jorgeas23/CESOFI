import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Header } from '../components/Header';
import { API_URL } from '../config/api';
import { clearSession } from '../utils/auth';

interface CompanyData {
  id: string;
  name: string;
  rfc: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  points: number;
  level: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function MiEmpresaScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Datos de la empresa
  const [company, setCompany] = useState<CompanyData | null>(null);

  // Estados del Formulario de Edición
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [rfc, setRfc] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);

  // Estados para cambio de contraseña
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Cargar datos de la empresa desde la API
  const fetchCompanyProfile = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        Alert.alert('Sesión expirada', 'Por favor vuelve a iniciar sesión.');
        return;
      }

      const response = await fetch(`${API_URL}/api/company/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        await clearSession();
        router.replace('/login');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudieron obtener los datos de la empresa');
      }

      if (data.company) {
        const comp = data.company;
        setCompany(comp);
        setCompanyName(comp.name || '');
        setRfc(comp.rfc || '');
        setPhone(comp.phone || '');
        setAddress(comp.address || '');
        setLogoUri(comp.logoUrl || null);
        if (comp.user) {
          setContactName(comp.user.name || '');
          setEmail(comp.user.email || '');
        }

        // Actualizar AsyncStorage local para refrescar el menú
        await AsyncStorage.setItem('userCompany', comp.name || 'Empresa CESOFI');
        if (comp.user?.name) {
          await AsyncStorage.setItem('userName', comp.user.name);
        }
      }
    } catch (error: any) {
      console.error('Error al cargar la empresa:', error);
      Alert.alert('Error', error.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  // Seleccionar imagen de galería
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para seleccionar una imagen.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        const base64Uri = `data:image/jpeg;base64,${asset.base64}`;
        setLogoUri(base64Uri);
      }
    }
  };

  // Guardar cambios en la base de datos
  const handleSaveChanges = async () => {
    if (!companyName.trim() || !contactName.trim()) {
      Alert.alert('Campos requeridos', 'El nombre de la empresa y del contacto son obligatorios.');
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/company/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: companyName.trim(),
          contactName: contactName.trim(),
          rfc: rfc.trim() ? rfc.trim() : null,
          phone: phone.trim() ? phone.trim() : null,
          address: address.trim() ? address.trim() : null,
          logoUrl: logoUri,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudieron guardar los cambios.');
      }

      Alert.alert('¡Éxito!', 'Información de la empresa actualizada correctamente.');
      setIsEditing(false);
      fetchCompanyProfile();
    } catch (error: any) {
      console.error('Error al actualizar empresa:', error);
      Alert.alert('Error', error.message || 'No se pudo guardar la información.');
    } finally {
      setSaving(false);
    }
  };

  // Cambiar contraseña
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Campos requeridos', 'Por favor llena todos los campos de contraseña.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setChangingPassword(true);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo cambiar la contraseña.');
      }

      Alert.alert('¡Éxito!', 'Tu contraseña ha sido actualizada correctamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      Alert.alert('Error', error.message || 'Error al conectar con el servidor.');
    } finally {
      setChangingPassword(false);
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'oro':
        return { bg: '#FEF08A', color: '#854D0E' };
      case 'plata':
        return { bg: '#E2E8F0', color: '#334155' };
      default:
        return { bg: '#FFEDD5', color: '#C2410C' };
    }
  };

  const badgeStyle = getLevelBadgeColor(company?.level || 'Bronce');

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchCompanyProfile(true)}
              enabled={!isEditing}
              colors={['#034123']}
              tintColor="#034123"
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#034123" />
              <Text style={styles.loadingText}>Cargando información de tu empresa...</Text>
            </View>
          ) : (
            <>
              {/* ── Tarjeta Hero con imagen de empresa ── */}
              <View style={styles.heroCard}>
                <View style={styles.heroHeader}>
                  {/* Avatar / Imagen de empresa */}
                  <TouchableOpacity
                    onPress={isEditing ? handlePickImage : undefined}
                    style={styles.avatarWrapper}
                    activeOpacity={isEditing ? 0.7 : 1}
                  >
                    {logoUri ? (
                      <Image
                        source={{ uri: logoUri }}
                        style={styles.companyAvatar}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.buildingIconBg}>
                        <Ionicons name="business" size={32} color="#034123" />
                      </View>
                    )}
                    {/* Botón de cámara solo en modo edición */}
                    {isEditing && (
                      <View style={styles.cameraOverlay}>
                        <Ionicons name="camera" size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={styles.heroTitles}>
                    <Text style={styles.companyTitle} numberOfLines={1}>
                      {company?.name || 'Mi Empresa'}
                    </Text>
                    <Text style={styles.contactSubtitle}>
                      Representante: {company?.user?.name || 'Contacto'}
                    </Text>
                    {isEditing && (
                      <TouchableOpacity onPress={handlePickImage} style={styles.changePhotoBtn}>
                        <Ionicons name="image-outline" size={14} color="#034123" />
                        <Text style={styles.changePhotoText}>
                          {logoUri ? 'Cambiar imagen' : 'Agregar imagen'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Badges de Puntos y Nivel */}
                <View style={styles.statsContainer}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Nivel Empresarial</Text>
                    <View style={[styles.levelBadge, { backgroundColor: badgeStyle.bg }]}>
                      <Ionicons name="ribbon" size={16} color={badgeStyle.color} />
                      <Text style={[styles.levelText, { color: badgeStyle.color }]}>
                        {company?.level || 'Bronce'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.dividerVertical} />

                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Puntos Acumulados</Text>
                    <View style={styles.pointsBadge}>
                      <Ionicons name="star" size={16} color="#EAB308" />
                      <Text style={styles.pointsText}>{company?.points || 0} pts</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* ── Tarjeta de Datos de la Empresa ── */}
              <View style={styles.detailsCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.sectionTitle}>Datos de la Empresa</Text>
                  {!isEditing ? (
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => setIsEditing(true)}
                    >
                      <Ionicons name="create-outline" size={18} color="#034123" />
                      <Text style={styles.editButtonText}>Editar</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setIsEditing(false);
                        fetchCompanyProfile(); // Descartar cambios
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Formulario / Vista de Datos */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nombre Comercial / Razón Social *</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={companyName}
                      onChangeText={setCompanyName}
                      placeholder="Ej. Mi Negocio S.A. de C.V."
                    />
                  ) : (
                    <View style={styles.dataDisplayBox}>
                      <Ionicons name="business-outline" size={20} color="#64748B" />
                      <Text style={styles.dataDisplayText}>{companyName || 'Sin especificar'}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Representante / Contacto *</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={contactName}
                      onChangeText={setContactName}
                      placeholder="Nombre del propietario o encargado"
                    />
                  ) : (
                    <View style={styles.dataDisplayBox}>
                      <Ionicons name="person-outline" size={20} color="#64748B" />
                      <Text style={styles.dataDisplayText}>{contactName || 'Sin especificar'}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Correo Electrónico (Registrado)</Text>
                  <View style={[styles.dataDisplayBox, { backgroundColor: '#F8FAFC' }]}>
                    <Ionicons name="mail-outline" size={20} color="#94A3B8" />
                    <Text style={[styles.dataDisplayText, { color: '#64748B' }]}>
                      {email || 'Sin correo'}
                    </Text>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>RFC (Registro Federal de Contribuyentes)</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={rfc}
                      onChangeText={setRfc}
                      placeholder="Ej. ABCD123456789"
                      autoCapitalize="characters"
                    />
                  ) : (
                    <View style={styles.dataDisplayBox}>
                      <Ionicons name="card-outline" size={20} color="#64748B" />
                      <Text style={styles.dataDisplayText}>{rfc || 'Sin registrar'}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Teléfono de Contacto</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="Ej. 9991234567"
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <View style={styles.dataDisplayBox}>
                      <Ionicons name="call-outline" size={20} color="#64748B" />
                      <Text style={styles.dataDisplayText}>{phone || 'Sin registrar'}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Dirección Fiscal / Ubicación</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                      value={address}
                      onChangeText={setAddress}
                      placeholder="Calle, número, colonia, municipio, estado"
                      multiline
                    />
                  ) : (
                    <View style={styles.dataDisplayBox}>
                      <Ionicons name="location-outline" size={20} color="#64748B" />
                      <Text style={styles.dataDisplayText}>{address || 'Sin registrar'}</Text>
                    </View>
                  )}
                </View>

                {/* Botón de Guardar si está en modo edición */}
                {isEditing && (
                  <TouchableOpacity
                    style={[styles.saveButton, { opacity: saving ? 0.7 : 1 }]}
                    onPress={handleSaveChanges}
                    disabled={saving}
                    activeOpacity={0.8}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* ── Sección de Cambio de Contraseña ── */}
              <View style={styles.detailsCard}>
                <TouchableOpacity
                  style={styles.cardHeaderRow}
                  onPress={() => setShowPasswordSection(!showPasswordSection)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.lockIconBg}>
                      <Ionicons name="lock-closed-outline" size={18} color="#034123" />
                    </View>
                    <Text style={styles.sectionTitle}>Cambiar Contraseña</Text>
                  </View>
                  <Ionicons
                    name={showPasswordSection ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>

                {showPasswordSection && (
                  <View style={styles.passwordSection}>
                    <Text style={styles.passwordHint}>
                      Por seguridad, ingresa tu contraseña actual antes de establecer una nueva.
                    </Text>

                    {/* Contraseña actual */}
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Contraseña Actual</Text>
                      <View style={styles.passwordWrapper}>
                        <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.pwdIcon} />
                        <TextInput
                          style={styles.passwordInput}
                          value={currentPassword}
                          onChangeText={setCurrentPassword}
                          placeholder="Tu contraseña actual"
                          placeholderTextColor="#94A3B8"
                          secureTextEntry={!showCurrentPwd}
                        />
                        <TouchableOpacity onPress={() => setShowCurrentPwd(!showCurrentPwd)}>
                          <Ionicons
                            name={showCurrentPwd ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color="#64748B"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Nueva contraseña */}
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Nueva Contraseña</Text>
                      <View style={styles.passwordWrapper}>
                        <Ionicons name="key-outline" size={18} color="#64748B" style={styles.pwdIcon} />
                        <TextInput
                          style={styles.passwordInput}
                          value={newPassword}
                          onChangeText={setNewPassword}
                          placeholder="Mínimo 6 caracteres"
                          placeholderTextColor="#94A3B8"
                          secureTextEntry={!showNewPwd}
                        />
                        <TouchableOpacity onPress={() => setShowNewPwd(!showNewPwd)}>
                          <Ionicons
                            name={showNewPwd ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color="#64748B"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Confirmar nueva contraseña */}
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
                      <View style={[
                        styles.passwordWrapper,
                        confirmPassword && newPassword !== confirmPassword
                          ? { borderColor: '#EF4444' }
                          : {},
                      ]}>
                        <Ionicons name="shield-checkmark-outline" size={18} color="#64748B" style={styles.pwdIcon} />
                        <TextInput
                          style={styles.passwordInput}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          placeholder="Repite la nueva contraseña"
                          placeholderTextColor="#94A3B8"
                          secureTextEntry={!showConfirmPwd}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPwd(!showConfirmPwd)}>
                          <Ionicons
                            name={showConfirmPwd ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color="#64748B"
                          />
                        </TouchableOpacity>
                      </View>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <Text style={styles.errorText}>Las contraseñas no coinciden</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.saveButton, { opacity: changingPassword ? 0.7 : 1 }]}
                      onPress={handleChangePassword}
                      disabled={changingPassword}
                      activeOpacity={0.8}
                    >
                      {changingPassword ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" />
                          <Text style={styles.saveButtonText}>Actualizar Contraseña</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  // ── Hero Card ──
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    marginRight: 16,
    position: 'relative',
  },
  companyAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  buildingIconBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#034123',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroTitles: {
    flex: 1,
  },
  companyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  contactSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  changePhotoText: {
    fontSize: 12,
    color: '#034123',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '500',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  dividerVertical: {
    width: 1,
    height: 32,
    backgroundColor: '#CBD5E1',
  },
  // ── Details Card ──
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lockIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#034123',
    fontWeight: '600',
    fontSize: 13,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelButtonText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 13,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  dataDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dataDisplayText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
    flex: 1,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#034123',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  // ── Password Section ──
  passwordSection: {
    marginTop: -8,
  },
  passwordHint: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#034123',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    height: 48,
  },
  pwdIcon: {
    marginRight: 10,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
});
