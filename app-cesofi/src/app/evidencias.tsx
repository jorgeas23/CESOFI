import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { Header } from '../components/Header';
import { API_URL } from '../config/api';
import { clearSession } from '../utils/auth';

interface EvidenceItem {
  id: string;
  title: string;
  activityName?: string;
  status: 'APROBADO' | 'EN_REVISION' | 'RECHAZADO' | 'PENDIENTE';
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  fileUrl?: string | null;
  date?: string;
  feedback?: string;
}

export default function EvidenciasScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('TODAS');

  // Modal de Subida / Dictamen
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(null);

  // Campos del formulario modal y archivo seleccionado
  const [documentTitle, setDocumentTitle] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('pdf');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [pickedFile, setPickedFile] = useState<{
    name: string;
    size: string;
    uri: string;
    fileType: string;
    mimeType: string;
    webFile?: File;
  } | null>(null);

  // Evidencias reales cargadas desde el backend
  const [evidences, setEvidences] = useState<EvidenceItem[]>([]);
  const [loadError, setLoadError] = useState(false);

  // Cargar evidencias reales desde el backend
  const fetchEvidences = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const token = await AsyncStorage.getItem('token');

      if (!token) return;

      const response = await fetch(`${API_URL}/api/evidence`, {
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
        throw new Error(data.error || 'No se pudo consultar el expediente');
      }

      const mapped: EvidenceItem[] = (data.evidences || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        activityName: e.activity?.title || 'Documento general',
        status: e.status || 'EN_REVISION',
        fileName: e.fileName,
        fileSize: e.fileSize,
        fileType: e.fileType,
        fileUrl: e.fileUrl,
        date: e.createdAt ? new Date(e.createdAt).toLocaleDateString() : 'Reciente',
        feedback: e.feedback,
      }));
      setEvidences(mapped);
    } catch (error) {
      console.error('Error al cargar evidencias del backend:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidences();
  }, []);

  // Cálculos para los contadores oficiales
  const totalSubidas = evidences.filter((e) => e.status !== 'PENDIENTE').length;
  const aprobadas = evidences.filter((e) => e.status === 'APROBADO').length;
  const enDictamen = evidences.filter((e) => e.status === 'EN_REVISION').length;
  const observadas = evidences.filter((e) => e.status === 'RECHAZADO').length;

  const progressPercent = Math.round((aprobadas / (evidences.length || 1)) * 100);

  // Filtrado de evidencias
  const filteredEvidences = evidences.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.activityName && item.activityName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === 'TODAS') return matchesSearch;
    if (filterStatus === 'APROBADO') return matchesSearch && item.status === 'APROBADO';
    if (filterStatus === 'EN_REVISION') return matchesSearch && item.status === 'EN_REVISION';
    if (filterStatus === 'RECHAZADO') return matchesSearch && item.status === 'RECHAZADO';
    if (filterStatus === 'PENDIENTE') return matchesSearch && item.status === 'PENDIENTE';
    return matchesSearch;
  });

  const getStatusBadge = (status: EvidenceItem['status']) => {
    switch (status) {
      case 'APROBADO':
        return { label: 'DICTAMINADO Y APROBADO', bg: '#DCFCE7', color: '#15803D', icon: 'shield-checkmark' };
      case 'EN_REVISION':
        return { label: 'EN PROCESO DE DICTAMEN', bg: '#FEF3C7', color: '#B45309', icon: 'time' };
      case 'RECHAZADO':
        return { label: 'CON OBSERVACIONES', bg: '#FEE2E2', color: '#B91C1C', icon: 'alert-circle' };
      default:
        return { label: 'PENDIENTE DE CARGA', bg: '#F1F5F9', color: '#475569', icon: 'cloud-upload-outline' };
    }
  };

  const handleOpenModal = (item: EvidenceItem | null) => {
    setSelectedItem(item);
    setDocumentTitle(item?.title || '');
    setAcceptTerms(false);
    setPickedFile(null);
    setModalVisible(true);
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const ext = asset.name.split('.').pop()?.toLowerCase() || 'pdf';
        const sizeMb = asset.size ? `${(asset.size / (1024 * 1024)).toFixed(2)} MB` : '';

        setPickedFile({
          name: asset.name,
          size: sizeMb,
          uri: asset.uri,
          fileType: ext,
          mimeType: asset.mimeType || 'application/octet-stream',
          // En web, expo-document-picker expone el File nativo del navegador aquí
          webFile: asset.file,
        });
        setSelectedFileType(ext === 'png' || ext === 'jpg' || ext === 'jpeg' ? 'png' : 'pdf');
      }
    } catch (error) {
      console.error('Error al seleccionar documento:', error);
      Alert.alert('Error', 'No se pudo abrir el explorador de archivos.');
    }
  };

  const handleUploadDocument = async () => {
    if (!pickedFile) {
      Alert.alert('Archivo no seleccionado', 'Por favor selecciona un archivo PDF o imagen de tu dispositivo antes de ingresar la evidencia.');
      return;
    }

    if (!documentTitle.trim()) {
      Alert.alert('Título requerido', 'Escribe un título para identificar el documento.');
      return;
    }

    if (!acceptTerms) {
      Alert.alert('Declaración obligatoria', 'Por favor confirma la declaración de veracidad legal antes de ingresar el documento.');
      return;
    }

    try {
      setUploading(true);
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        Alert.alert('Sesión expirada', 'Vuelve a iniciar sesión para continuar.');
        return;
      }

      const formData = new FormData();
      formData.append('title', documentTitle.trim());

      if (pickedFile.webFile) {
        formData.append('file', pickedFile.webFile);
      } else {
        formData.append('file', {
          uri: pickedFile.uri,
          name: pickedFile.name,
          type: pickedFile.mimeType,
        } as any);
      }

      const response = await fetch(`${API_URL}/api/evidence`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo ingresar el documento.');
      }

      setModalVisible(false);
      await fetchEvidences();
      Alert.alert('¡Documento Cargado!', `El archivo "${pickedFile.name}" ha sido ingresado al Comité Oficial de Dictamen de CESOFI.`);
    } catch (error: any) {
      console.error('Error al subir documento:', error);
      Alert.alert('Error', error.message || 'No se pudo ingresar el documento.');
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = (url?: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir el documento.'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Hero de Expediente Oficial */}
        <View style={styles.heroBanner}>
          <View style={styles.badgeOfficial}>
            <Ionicons name="shield-checkmark-sharp" size={16} color="#034123" />
            <Text style={styles.badgeOfficialText}>EXPEDIENTE DIGITAL OFICIAL CESOFI</Text>
          </View>

          <Text style={styles.heroTitle}>Portal de Cumplimiento Documental</Text>
          <Text style={styles.heroSubtitle}>
            Gestión y dictaminación de evidencias para la validación empresarial.
          </Text>

          {/* Estado Global del Expediente */}
          <View style={styles.auditProgressCard}>
            <View style={styles.auditProgressRow}>
              <Text style={styles.auditProgressLabel}>Cumplimiento del Expediente</Text>
              <Text style={styles.auditProgressPercent}>{progressPercent}% Validado</Text>
            </View>

            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>

            <View style={styles.auditStatsRow}>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatNumber}>{aprobadas}</Text>
                <Text style={styles.miniStatLabel}>Aprobados</Text>
              </View>

              <View style={styles.dividerMini} />

              <View style={styles.miniStat}>
                <Text style={styles.miniStatNumber}>{enDictamen}</Text>
                <Text style={styles.miniStatLabel}>En Dictamen</Text>
              </View>

              <View style={styles.dividerMini} />

              <View style={styles.miniStat}>
                <Text style={styles.miniStatNumber}>{observadas}</Text>
                <Text style={styles.miniStatLabel}>Observados</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Buscador y Filtros */}
        <View style={styles.controlsContainer}>
          <View style={styles.searchWrapper}>
            <Ionicons name="search-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por ID, folio o nombre de documento..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, filterStatus === 'TODAS' && styles.activeFilterChip]}
              onPress={() => setFilterStatus('TODAS')}
            >
              <Text style={[styles.filterText, filterStatus === 'TODAS' && styles.activeFilterText]}>
                Todos ({evidences.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filterStatus === 'APROBADO' && styles.activeFilterChip]}
              onPress={() => setFilterStatus('APROBADO')}
            >
              <Text style={[styles.filterText, filterStatus === 'APROBADO' && styles.activeFilterText]}>
                Aprobados ({aprobadas})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filterStatus === 'EN_REVISION' && styles.activeFilterChip]}
              onPress={() => setFilterStatus('EN_REVISION')}
            >
              <Text style={[styles.filterText, filterStatus === 'EN_REVISION' && styles.activeFilterText]}>
                En Dictamen ({enDictamen})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filterStatus === 'RECHAZADO' && styles.activeFilterChip]}
              onPress={() => setFilterStatus('RECHAZADO')}
            >
              <Text style={[styles.filterText, filterStatus === 'RECHAZADO' && styles.activeFilterText]}>
                Con Observación ({observadas})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.newEvidenceButton} onPress={() => handleOpenModal(null)}>
          <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
          <Text style={styles.newEvidenceButtonText}>Nueva Evidencia</Text>
        </TouchableOpacity>

        {/* Lista de Fichas de Documentación */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#034123" />
            <Text style={styles.loadingText}>Consultando expediente digital...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.emptyBox}>
            <Ionicons name="cloud-offline-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyText}>
              No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.
            </Text>
          </View>
        ) : filteredEvidences.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="document-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyText}>
              Aún no has cargado documentos. Presiona "Nueva Evidencia" para comenzar tu expediente.
            </Text>
          </View>
        ) : (
          <View style={styles.evidenceList}>
            {filteredEvidences.map((item) => {
              const badge = getStatusBadge(item.status);
              const isApproved = item.status === 'APROBADO';
              const isRejected = item.status === 'RECHAZADO';
              const isPending = item.status === 'PENDIENTE';

              return (
                <View key={item.id} style={styles.evidenceCard}>
                  {/* Header de la Ficha */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.folioText}>FOLIO: {item.id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                      <Ionicons name={badge.icon as any} size={14} color={badge.color} />
                      <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                  </View>

                  {/* Detalle Principal */}
                  <View style={styles.cardBody}>
                    <View style={styles.fileIconBg}>
                      <MaterialCommunityIcons
                        name={item.fileType === 'png' || item.fileType === 'jpg' ? 'file-image-outline' : 'file-pdf-box'}
                        size={28}
                        color={isApproved ? '#15803D' : '#034123'}
                      />
                    </View>

                    <View style={styles.fileMainInfo}>
                      <Text style={styles.documentTitle}>{item.title}</Text>
                      <Text style={styles.activitySubtitle}>{item.activityName}</Text>

                      {!isPending && (
                        <Text style={styles.fileMetaData}>
                          {item.fileName} • {item.fileSize} • Cargado: {item.date}
                        </Text>
                      )}

                      {item.fileUrl && (
                        <TouchableOpacity
                          style={styles.viewDocButton}
                          onPress={() => handleViewDocument(item.fileUrl)}
                        >
                          <Ionicons name="eye-outline" size={14} color="#034123" />
                          <Text style={styles.viewDocButtonText}>Ver documento</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Cuadro de Observaciones del Dictaminador (Si fue rechazado o en revisión) */}
                  {item.feedback && (
                    <View style={[styles.feedbackBox, isRejected && styles.rejectedFeedbackBox]}>
                      <Ionicons
                        name={isRejected ? 'alert-circle-outline' : 'information-circle-outline'}
                        size={16}
                        color={isRejected ? '#DC2626' : '#D97706'}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.feedbackText, isRejected && styles.rejectedFeedbackText]}>
                        <Text style={{ fontWeight: 'bold' }}>Dictamen: </Text>
                        {item.feedback}
                      </Text>
                    </View>
                  )}

                  {/* Botones de Acción */}
                  <View style={styles.cardFooterRow}>
                    {isPending ? (
                      <TouchableOpacity
                        style={styles.uploadButtonPrimary}
                        onPress={() => handleOpenModal(item)}
                      >
                        <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.uploadButtonText}>Cargar Documento Oficial</Text>
                      </TouchableOpacity>
                    ) : isRejected ? (
                      <TouchableOpacity
                        style={styles.reuploadButton}
                        onPress={() => handleOpenModal(item)}
                      >
                        <Ionicons name="refresh-outline" size={16} color="#DC2626" />
                        <Text style={styles.reuploadButtonText}>Subir Corrección Solicitada</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.approvedFooterRow}>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#15803D" />
                        <Text style={styles.approvedText}>Documento Verificado e Inalterable</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal de Carga e Ingreso Oficial de Archivo */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ingreso Oficial de Evidencia</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedItem ? (
                <>
                  <Text style={styles.modalSubtitle}>
                    Folio: <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>{selectedItem.id}</Text>
                  </Text>
                  <Text style={styles.modalDocName}>{selectedItem.title}</Text>
                </>
              ) : (
                <TextInput
                  style={styles.titleInput}
                  placeholder="Título del documento (ej. Comprobante de domicilio)"
                  placeholderTextColor="#94A3B8"
                  value={documentTitle}
                  onChangeText={setDocumentTitle}
                />
              )}

              {/* Zona Dropzone Estilizada e Interactiva */}
              <TouchableOpacity
                style={[styles.dropzone, pickedFile && styles.activeDropzone]}
                onPress={handlePickDocument}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={pickedFile ? 'document-text' : 'cloud-upload-sharp'}
                  size={42}
                  color={pickedFile ? '#15803D' : '#034123'}
                />
                <Text style={[styles.dropzoneTitle, pickedFile && styles.activeDropzoneTitle]}>
                  {pickedFile ? pickedFile.name : 'Presiona aquí para elegir tu archivo'}
                </Text>
                <Text style={styles.dropzoneSubtitle}>
                  {pickedFile
                    ? `Tamaño: ${pickedFile.size} • Formato: ${pickedFile.fileType.toUpperCase()}`
                    : 'Acepta archivos PDF, PNG o JPG de tu dispositivo (Máx 10 MB)'}
                </Text>

                <View style={styles.pickButtonBadge}>
                  <Ionicons name="folder-open-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.pickButtonBadgeText}>
                    {pickedFile ? 'Cambiar Archivo' : 'Explorar Archivos'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Declaración Legal de Veracidad */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAcceptTerms(!acceptTerms)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={acceptTerms ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={acceptTerms ? '#034123' : '#64748B'}
                />
                <Text style={styles.checkboxLabel}>
                  Declaro bajo protesta de decir verdad que el documento ingresado es auténtico y corresponde a la empresa registrada.
                </Text>
              </TouchableOpacity>

              {/* Botón Confirmar */}
              <TouchableOpacity
                style={[styles.confirmUploadButton, { opacity: uploading ? 0.7 : 1 }]}
                onPress={handleUploadDocument}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#FFFFFF" />
                    <Text style={styles.confirmUploadText}>Ingresar al Comité de Dictamen</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingBottom: 32,
  },
  heroBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  badgeOfficial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6F4EA',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 12,
  },
  badgeOfficialText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#034123',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
  auditProgressCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  auditProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  auditProgressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  auditProgressPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#034123',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#034123',
    borderRadius: 4,
  },
  auditStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  miniStat: {
    alignItems: 'center',
  },
  miniStatNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  miniStatLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  dividerMini: {
    width: 1,
    height: 20,
    backgroundColor: '#CBD5E1',
  },
  controlsContainer: {
    marginBottom: 16,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#034123',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  evidenceList: {
    gap: 14,
  },
  evidenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  folioText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fileIconBg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileMainInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  fileMetaData: {
    fontSize: 11,
    color: '#034123',
    fontWeight: '500',
    marginTop: 4,
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  rejectedFeedbackBox: {
    backgroundColor: '#FEE2E2',
  },
  feedbackText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
    lineHeight: 16,
  },
  rejectedFeedbackText: {
    color: '#991B1B',
  },
  cardFooterRow: {
    marginTop: 4,
  },
  uploadButtonPrimary: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#034123',
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  reuploadButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 10,
    borderRadius: 8,
  },
  reuploadButtonText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: 'bold',
  },
  approvedFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  approvedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  modalDocName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#034123',
    marginBottom: 16,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 16,
  },
  newEvidenceButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#034123',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  newEvidenceButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  viewDocButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  viewDocButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#034123',
    textDecorationLine: 'underline',
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  dropzone: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  activeDropzone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#15803D',
    borderStyle: 'solid',
  },
  dropzoneTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 8,
  },
  activeDropzoneTitle: {
    color: '#15803D',
  },
  dropzoneSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  pickButtonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#034123',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pickButtonBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  formatSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  formatChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  activeFormatChip: {
    backgroundColor: '#034123',
  },
  formatChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  activeFormatChipText: {
    color: '#FFFFFF',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 20,
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
    lineHeight: 17,
  },
  confirmUploadButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#034123',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  confirmUploadText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});