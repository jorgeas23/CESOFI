import React, { useState, useEffect, useCallback } from 'react';
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
  Linking,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from '../components/Header';
import { API_URL } from '../config/api';
import { clearSession } from '../utils/auth';

interface EvidenceAdmin {
  id: string;
  title: string;
  pasoId: string | null;
  fileName: string | null;
  fileSize: string | null;
  fileType: string | null;
  fileUrl: string | null;
  status: 'PENDIENTE' | 'EN_REVISION' | 'APROBADO' | 'RECHAZADO';
  feedback: string | null;
  createdAt: string;
  company: { id: string; name: string; folioCesofi: string | null; rfc: string | null };
}

interface SupportMessageAdmin {
  id: string;
  subject: string;
  message: string;
  status: 'PENDIENTE' | 'RESPONDIDO';
  respuesta: string | null;
  createdAt: string;
  company: { id: string; name: string; folioCesofi: string | null };
}

interface CompanyAdmin {
  id: string;
  name: string;
  rfc: string | null;
  phone: string | null;
  address: string | null;
  folioCesofi: string | null;
  points: number;
  level: string;
  createdAt: string;
  user: { name: string; email: string };
  _count: { evidences: number };
}

interface PasoRuta {
  id?: string;
  orden: number;
  titulo: string;
  descripcion: string;
  area: string;
  impactoEnPuntaje?: string;
  recursos: string;
  plazo: string;
}

interface RutaAdmin {
  linked: boolean;
  found?: boolean;
  message?: string;
  generadoPorCesofi?: boolean;
  resultado?: { nivel: number; puntajeTotal: number; dscr: number; esViable: boolean };
  negocio?: { rfc: string | null; nombreNegocio: string };
  diagnosticoIA?: {
    resumenGeneral: string;
    planMejoraNivel: {
      nivelActual: number;
      nivelObjetivo: number;
      tiempoEstimado: string;
      pasos: PasoRuta[];
    };
  } | null;
}

export default function AdminScreen() {
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [view, setView] = useState<'EVIDENCIAS' | 'MENSAJES' | 'EMPRESARIOS'>('EVIDENCIAS');

  // Directorio de empresarios
  const [companies, setCompanies] = useState<CompanyAdmin[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [companySearch, setCompanySearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [evidences, setEvidences] = useState<EvidenceAdmin[]>([]);
  const [filter, setFilter] = useState<'EN_REVISION' | 'APROBADO' | 'RECHAZADO' | 'TODAS'>('EN_REVISION');

  // Mensajes de soporte
  const [supportMessages, setSupportMessages] = useState<SupportMessageAdmin[]>([]);
  const [loadingSupport, setLoadingSupport] = useState(true);
  const [supportFilter, setSupportFilter] = useState<'PENDIENTE' | 'RESPONDIDO' | 'TODOS'>('PENDIENTE');
  const [replyTarget, setReplyTarget] = useState<SupportMessageAdmin | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Modal de dictamen
  const [selected, setSelected] = useState<EvidenceAdmin | null>(null);
  const [decision, setDecision] = useState<'APROBADO' | 'RECHAZADO' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Detalle de empresa: datos + su Ruta + evidencia cruzada por paso
  const [companyDetail, setCompanyDetail] = useState<CompanyAdmin | null>(null);
  const [companyRuta, setCompanyRuta] = useState<RutaAdmin | null>(null);
  const [companyEvidences, setCompanyEvidences] = useState<EvidenceAdmin[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchEvidences = useCallback(async (status: string, isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/evidence/admin?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 403) {
        Alert.alert('Acceso denegado', 'Esta sección es solo para administradores.');
        router.replace('/');
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar las evidencias.');
      setEvidences(data.evidences || []);
    } catch (error: any) {
      console.error('Error al cargar evidencias de admin:', error);
      Alert.alert('Error', error.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    const checkAccess = async () => {
      const role = await AsyncStorage.getItem('userRole');
      if (role !== 'ADMIN') {
        Alert.alert('Acceso denegado', 'Esta sección es solo para administradores.');
        router.replace('/');
        return;
      }
      setCheckingAccess(false);
    };
    checkAccess();
  }, [router]);

  useEffect(() => {
    if (!checkingAccess) fetchEvidences(filter);
  }, [checkingAccess, filter, fetchEvidences]);

  const fetchSupportMessages = useCallback(async (status: string, isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoadingSupport(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/support/admin?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar los mensajes.');
      setSupportMessages(data.supportMessages || []);
    } catch (error: any) {
      console.error('Error al cargar mensajes de soporte:', error);
      Alert.alert('Error', error.message || 'Error de conexión con el servidor.');
    } finally {
      setLoadingSupport(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!checkingAccess) fetchSupportMessages(supportFilter);
  }, [checkingAccess, supportFilter, fetchSupportMessages]);

  const fetchCompanies = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoadingCompanies(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/company/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar las empresas.');
      setCompanies(data.companies || []);
    } catch (error: any) {
      console.error('Error al cargar empresas:', error);
      Alert.alert('Error', error.message || 'Error de conexión con el servidor.');
    } finally {
      setLoadingCompanies(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!checkingAccess && view === 'EMPRESARIOS') fetchCompanies();
  }, [checkingAccess, view, fetchCompanies]);

  // Vuelve a cargar solo la evidencia de la empresa cuyo detalle está abierto (tras dictaminar)
  const refreshCompanyEvidences = useCallback(async (companyId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_URL}/api/evidence/admin?status=TODAS&companyId=${companyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setCompanyEvidences(data.evidences || []);
    } catch (error) {
      console.error('Error al refrescar evidencias de la empresa:', error);
    }
  }, []);

  const openCompanyDetail = useCallback(async (company: CompanyAdmin) => {
    setCompanyDetail(company);
    setLoadingDetail(true);
    setCompanyRuta(null);
    setCompanyEvidences([]);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const [rutaRes, evRes] = await Promise.all([
        fetch(`${API_URL}/api/ruta/admin/${company.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/evidence/admin?status=TODAS&companyId=${company.id}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const rutaData = await rutaRes.json();
      setCompanyRuta(rutaRes.ok ? rutaData : { linked: false, message: rutaData.error || 'No se pudo cargar la ruta.' });

      const evData = await evRes.json();
      if (evRes.ok) setCompanyEvidences(evData.evidences || []);
    } catch (error) {
      console.error('Error al cargar detalle de empresa:', error);
      Alert.alert('Error', 'No se pudo cargar el detalle de esta empresa.');
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const closeCompanyDetail = () => {
    setCompanyDetail(null);
    setCompanyRuta(null);
    setCompanyEvidences([]);
  };

  // La evidencia más reciente de este paso (companyEvidences viene ordenado por fecha asc)
  const evidenciaDePasoAdmin = (pasoId?: string) => {
    if (!pasoId) return undefined;
    const candidatas = companyEvidences.filter((e) => e.pasoId === pasoId);
    return candidatas[candidatas.length - 1];
  };

  const filteredCompanies = companies.filter((c) => {
    const q = companySearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.user.email.toLowerCase().includes(q) ||
      (c.folioCesofi || '').toLowerCase().includes(q)
    );
  });

  const submitReply = async () => {
    if (!replyTarget || !replyText.trim()) {
      Alert.alert('Respuesta requerida', 'Escribe una respuesta antes de enviarla.');
      return;
    }

    try {
      setSubmittingReply(true);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/support/${replyTarget.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ respuesta: replyText.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo enviar la respuesta.');

      setReplyTarget(null);
      setReplyText('');
      await fetchSupportMessages(supportFilter);
    } catch (error: any) {
      console.error('Error al responder mensaje:', error);
      Alert.alert('Error', error.message || 'No se pudo enviar la respuesta.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const openDecision = (evidence: EvidenceAdmin, tipo: 'APROBADO' | 'RECHAZADO') => {
    setSelected(evidence);
    setDecision(tipo);
    setFeedback('');
  };

  const submitDecision = async () => {
    if (!selected || !decision) return;

    if (decision === 'RECHAZADO' && !feedback.trim()) {
      Alert.alert('Comentario requerido', 'Explica brevemente por qué se rechaza, para que el empresario sepa qué corregir.');
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/evidence/${selected.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: decision, feedback: feedback.trim() || undefined }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo dictaminar la evidencia.');

      setSelected(null);
      setDecision(null);
      await fetchEvidences(filter);
      // Si se dictaminó desde el detalle de una empresa, refrescar su evidencia ahí también
      if (companyDetail) {
        await refreshCompanyEvidences(companyDetail.id);
        fetchCompanies(true); // puntos/nivel pudieron cambiar — refrescar en segundo plano
      }
    } catch (error: any) {
      console.error('Error al dictaminar:', error);
      Alert.alert('Error', error.message || 'No se pudo procesar el dictamen.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await clearSession();
    router.replace('/login');
  };

  if (checkingAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#034123" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              view === 'EVIDENCIAS'
                ? fetchEvidences(filter, true)
                : view === 'MENSAJES'
                ? fetchSupportMessages(supportFilter, true)
                : fetchCompanies(true)
            }
            colors={['#034123']}
            tintColor="#034123"
          />
        }
      >
        <View style={styles.topBanner}>
          <Text style={styles.topTitle}>
            {view === 'EVIDENCIAS' ? 'DICTAMEN DE EVIDENCIAS' : view === 'MENSAJES' ? 'MENSAJES DE SOPORTE' : 'DIRECTORIO DE EMPRESARIOS'}
          </Text>
          <Ionicons name="shield-checkmark-outline" size={22} color="#034123" />
        </View>

        <View style={styles.viewSwitchRow}>
          <TouchableOpacity
            style={[styles.viewSwitchTab, view === 'EVIDENCIAS' && styles.viewSwitchTabActive]}
            onPress={() => setView('EVIDENCIAS')}
          >
            <Text style={[styles.viewSwitchText, view === 'EVIDENCIAS' && styles.viewSwitchTextActive]}>Evidencias</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewSwitchTab, view === 'MENSAJES' && styles.viewSwitchTabActive]}
            onPress={() => setView('MENSAJES')}
          >
            <Text style={[styles.viewSwitchText, view === 'MENSAJES' && styles.viewSwitchTextActive]}>Mensajes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewSwitchTab, view === 'EMPRESARIOS' && styles.viewSwitchTabActive]}
            onPress={() => setView('EMPRESARIOS')}
          >
            <Text style={[styles.viewSwitchText, view === 'EMPRESARIOS' && styles.viewSwitchTextActive]}>Empresarios</Text>
          </TouchableOpacity>
        </View>

        {view === 'EVIDENCIAS' ? (
        <>
        <View style={styles.filterRow}>
          {(['EN_REVISION', 'APROBADO', 'RECHAZADO', 'TODAS'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.activeFilterChip]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>
                {f === 'EN_REVISION' ? 'Pendientes' : f === 'APROBADO' ? 'Aprobadas' : f === 'RECHAZADO' ? 'Rechazadas' : 'Todas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#034123" />
          </View>
        ) : evidences.length === 0 ? (
          <View style={styles.loadingBox}>
            <Ionicons name="checkmark-done-circle-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyText}>No hay evidencias en este filtro.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {evidences.map((ev) => (
              <View key={ev.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.companyName}>{ev.company.name}</Text>
                  {ev.company.folioCesofi && <Text style={styles.folioText}>{ev.company.folioCesofi}</Text>}
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.fileIconBg}>
                    <MaterialCommunityIcons
                      name={ev.fileType === 'png' || ev.fileType === 'jpg' ? 'file-image-outline' : 'file-pdf-box'}
                      size={24}
                      color="#034123"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docTitle}>{ev.title}</Text>
                    {ev.pasoId && <Text style={styles.pasoTag}>Paso: {ev.pasoId}</Text>}
                    <Text style={styles.metaText}>
                      {ev.fileName} • {ev.fileSize} • {new Date(ev.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {ev.fileUrl && (
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => Linking.openURL(ev.fileUrl!).catch(() => {})}
                  >
                    <Ionicons name="eye-outline" size={14} color="#034123" />
                    <Text style={styles.viewButtonText}>Ver documento</Text>
                  </TouchableOpacity>
                )}

                {ev.feedback && (
                  <View style={styles.feedbackBox}>
                    <Text style={styles.feedbackText}>{ev.feedback}</Text>
                  </View>
                )}

                {ev.status === 'EN_REVISION' ? (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => openDecision(ev, 'RECHAZADO')}
                    >
                      <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                      <Text style={styles.rejectButtonText}>Rechazar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => openDecision(ev, 'APROBADO')}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.approveButtonText}>Aprobar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, ev.status === 'APROBADO' ? styles.approvedBadge : styles.rejectedBadge]}>
                    <Text style={[styles.statusBadgeText, { color: ev.status === 'APROBADO' ? '#15803D' : '#B91C1C' }]}>
                      {ev.status}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
        </>
        ) : view === 'MENSAJES' ? (
        <>
        <View style={styles.filterRow}>
          {(['PENDIENTE', 'RESPONDIDO', 'TODOS'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, supportFilter === f && styles.activeFilterChip]}
              onPress={() => setSupportFilter(f)}
            >
              <Text style={[styles.filterText, supportFilter === f && styles.activeFilterText]}>
                {f === 'PENDIENTE' ? 'Pendientes' : f === 'RESPONDIDO' ? 'Respondidos' : 'Todos'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loadingSupport ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#034123" />
          </View>
        ) : supportMessages.length === 0 ? (
          <View style={styles.loadingBox}>
            <Ionicons name="mail-open-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyText}>No hay mensajes en este filtro.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {supportMessages.map((m) => (
              <View key={m.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.companyName}>{m.company.name}</Text>
                  {m.company.folioCesofi && <Text style={styles.folioText}>{m.company.folioCesofi}</Text>}
                </View>

                <Text style={styles.docTitle}>{m.subject}</Text>
                <Text style={styles.metaText}>{new Date(m.createdAt).toLocaleDateString()}</Text>
                <Text style={styles.messageBodyText}>{m.message}</Text>

                {m.respuesta && (
                  <View style={styles.feedbackBox}>
                    <Text style={styles.feedbackLabel}>Tu respuesta:</Text>
                    <Text style={styles.feedbackText}>{m.respuesta}</Text>
                  </View>
                )}

                {m.status === 'PENDIENTE' ? (
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => { setReplyTarget(m); setReplyText(''); }}
                  >
                    <Ionicons name="arrow-undo-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.approveButtonText}>Responder</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.statusBadge, styles.approvedBadge]}>
                    <Text style={[styles.statusBadgeText, { color: '#15803D' }]}>RESPONDIDO</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
        </>
        ) : (
        <>
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, correo o folio..."
            placeholderTextColor="#94A3B8"
            value={companySearch}
            onChangeText={setCompanySearch}
          />
        </View>

        {loadingCompanies ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#034123" />
          </View>
        ) : filteredCompanies.length === 0 ? (
          <View style={styles.loadingBox}>
            <Ionicons name="business-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyText}>No hay empresarios que coincidan.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredCompanies.map((c) => (
              <TouchableOpacity key={c.id} style={styles.card} activeOpacity={0.7} onPress={() => openCompanyDetail(c)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.companyName}>{c.name}</Text>
                  {c.folioCesofi && <Text style={styles.folioText}>{c.folioCesofi}</Text>}
                </View>
                <Text style={styles.metaText}>{c.user.name} • {c.user.email}</Text>
                {c.rfc && <Text style={styles.metaText}>RFC: {c.rfc}</Text>}
                <View style={styles.companyStatsRow}>
                  <View style={styles.companyStatBadge}>
                    <Ionicons name="star" size={12} color="#EAB308" />
                    <Text style={styles.companyStatText}>{c.points} pts</Text>
                  </View>
                  <View style={styles.companyStatBadge}>
                    <Ionicons name="ribbon-outline" size={12} color="#034123" />
                    <Text style={styles.companyStatText}>{c.level}</Text>
                  </View>
                  <View style={styles.companyStatBadge}>
                    <Ionicons name="folder-outline" size={12} color="#64748B" />
                    <Text style={styles.companyStatText}>{c._count.evidences} evidencias</Text>
                  </View>
                </View>
                <View style={styles.cardFooterRow}>
                  <Text style={styles.metaText}>Registrado: {new Date(c.createdAt).toLocaleDateString()}</Text>
                  <View style={styles.seeMoreRow}>
                    <Text style={styles.seeMoreText}>Ver empresa y ruta</Text>
                    <Ionicons name="chevron-forward" size={14} color="#034123" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        </>
        )}

        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Detalle de empresa: datos + su Ruta + la evidencia cruzada por paso */}
      <Modal visible={!!companyDetail} animationType="slide" onRequestClose={closeCompanyDetail}>
        <SafeAreaView style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={closeCompanyDetail} style={styles.detailBackButton}>
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.detailHeaderTitle} numberOfLines={1}>{companyDetail?.name}</Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView contentContainerStyle={styles.detailScroll}>
            {/* Datos de la empresa */}
            <View style={styles.detailInfoCard}>
              <View style={styles.detailInfoHeaderRow}>
                <Text style={styles.detailCompanyName}>{companyDetail?.name}</Text>
                {companyDetail?.folioCesofi && (
                  <View style={styles.folioBadge}>
                    <Text style={styles.folioBadgeText}>{companyDetail.folioCesofi}</Text>
                  </View>
                )}
              </View>
              <View style={styles.detailInfoGrid}>
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Contacto</Text>
                  <Text style={styles.detailInfoValue}>{companyDetail?.user.name}</Text>
                  <Text style={styles.detailInfoSub}>{companyDetail?.user.email}</Text>
                </View>
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>RFC</Text>
                  <Text style={styles.detailInfoValue}>{companyDetail?.rfc || '—'}</Text>
                </View>
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Teléfono</Text>
                  <Text style={styles.detailInfoValue}>{companyDetail?.phone || '—'}</Text>
                </View>
                <View style={styles.detailInfoItem}>
                  <Text style={styles.detailInfoLabel}>Dirección</Text>
                  <Text style={styles.detailInfoValue}>{companyDetail?.address || '—'}</Text>
                </View>
              </View>
              <View style={styles.companyStatsRow}>
                <View style={styles.companyStatBadge}>
                  <Ionicons name="star" size={12} color="#EAB308" />
                  <Text style={styles.companyStatText}>{companyDetail?.points} pts</Text>
                </View>
                <View style={styles.companyStatBadge}>
                  <Ionicons name="ribbon-outline" size={12} color="#034123" />
                  <Text style={styles.companyStatText}>{companyDetail?.level}</Text>
                </View>
                <View style={styles.companyStatBadge}>
                  <Ionicons name="calendar-outline" size={12} color="#64748B" />
                  <Text style={styles.companyStatText}>
                    Desde {companyDetail && new Date(companyDetail.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Su Ruta CESOFI */}
            <Text style={styles.detailSectionTitle}>Ruta CESOFI</Text>

            {loadingDetail ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#034123" />
              </View>
            ) : !companyRuta?.linked ? (
              <View style={styles.loadingBox}>
                <Ionicons name="link-outline" size={28} color="#94A3B8" />
                <Text style={styles.emptyText}>{companyRuta?.message || 'Esta empresa aún no vincula su Folio CESOFI.'}</Text>
              </View>
            ) : !companyRuta.found ? (
              <View style={styles.loadingBox}>
                <Ionicons name="alert-circle-outline" size={28} color="#94A3B8" />
                <Text style={styles.emptyText}>{companyRuta.message}</Text>
              </View>
            ) : !companyRuta.diagnosticoIA?.planMejoraNivel ? (
              <View style={styles.loadingBox}>
                <Ionicons name="hourglass-outline" size={28} color="#94A3B8" />
                <Text style={styles.emptyText}>
                  {companyRuta.resultado
                    ? `Nivel ${companyRuta.resultado.nivel} — plan de mejora aún en preparación.`
                    : 'Plan de mejora aún en preparación.'}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.rutaSummaryRow}>
                  <View style={styles.rutaSummaryBox}>
                    <Text style={styles.detailInfoLabel}>Nivel actual</Text>
                    <Text style={styles.rutaSummaryValue}>{companyRuta.diagnosticoIA.planMejoraNivel.nivelActual}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color="#94A3B8" />
                  <View style={styles.rutaSummaryBox}>
                    <Text style={styles.detailInfoLabel}>Meta</Text>
                    <Text style={[styles.rutaSummaryValue, { color: '#034123' }]}>
                      {companyRuta.diagnosticoIA.planMejoraNivel.nivelObjetivo}
                    </Text>
                  </View>
                </View>

                {companyRuta.diagnosticoIA.planMejoraNivel.pasos.map((paso) => {
                  const evidencia = evidenciaDePasoAdmin(paso.id);
                  const status = evidencia?.status;
                  const necesitaValidar = status === 'EN_REVISION';

                  return (
                    <View key={paso.orden} style={[styles.pasoCard, necesitaValidar && styles.pasoCardPending]}>
                      <View style={styles.pasoCardHeaderRow}>
                        <View style={styles.pasoOrdenBadge}>
                          <Text style={styles.pasoOrdenBadgeText}>{paso.orden}</Text>
                        </View>
                        <Text style={styles.pasoTitle}>{paso.titulo}</Text>
                      </View>
                      <Text style={styles.pasoDescripcion}>{paso.descripcion}</Text>

                      {status === 'APROBADO' ? (
                        <View style={styles.pasoStatusRow}>
                          <Ionicons name="checkmark-circle" size={14} color="#15803D" />
                          <Text style={[styles.pasoStatusText, { color: '#15803D' }]}>Completado</Text>
                        </View>
                      ) : status === 'RECHAZADO' ? (
                        <View style={styles.pasoStatusRow}>
                          <Ionicons name="close-circle" size={14} color="#DC2626" />
                          <Text style={[styles.pasoStatusText, { color: '#DC2626' }]}>Rechazado — esperando corrección</Text>
                          {evidencia?.feedback && <Text style={styles.metaText}>"{evidencia.feedback}"</Text>}
                        </View>
                      ) : necesitaValidar ? (
                        <View style={styles.pendingValidationBox}>
                          <View style={styles.pasoStatusRow}>
                            <Ionicons name="time" size={14} color="#D97706" />
                            <Text style={[styles.pasoStatusText, { color: '#D97706' }]}>Esta es la que debes validar</Text>
                          </View>
                          <View style={styles.pendingValidationActions}>
                            {evidencia?.fileUrl && (
                              <TouchableOpacity
                                style={styles.viewButton}
                                onPress={() => Linking.openURL(evidencia.fileUrl!).catch(() => {})}
                              >
                                <Ionicons name="eye-outline" size={14} color="#034123" />
                                <Text style={styles.viewButtonText}>Ver documento</Text>
                              </TouchableOpacity>
                            )}
                            <View style={{ flex: 1 }} />
                            <TouchableOpacity
                              style={styles.validateRejectButton}
                              onPress={() => evidencia && openDecision(evidencia, 'RECHAZADO')}
                            >
                              <Text style={styles.rejectButtonText}>Rechazar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.validateApproveButton}
                              onPress={() => evidencia && openDecision(evidencia, 'APROBADO')}
                            >
                              <Text style={styles.approveButtonText}>Aprobar</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.pasoStatusRow}>
                          <Ionicons name="ellipse-outline" size={14} color="#94A3B8" />
                          <Text style={[styles.pasoStatusText, { color: '#94A3B8' }]}>Sin evidencia todavía</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            )}

            <View style={{ height: 30 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal de dictamen */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {decision === 'APROBADO' ? 'Aprobar documento' : 'Rechazar documento'}
            </Text>
            <Text style={styles.modalSubtitle}>{selected?.title} — {selected?.company.name}</Text>

            <TextInput
              style={styles.feedbackInput}
              placeholder={decision === 'RECHAZADO' ? 'Explica qué debe corregir (obligatorio)...' : 'Comentario opcional...'}
              placeholderTextColor="#94A3B8"
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setSelected(null)} disabled={submitting}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, decision === 'RECHAZADO' && styles.confirmButtonReject, { opacity: submitting ? 0.7 : 1 }]}
                onPress={submitDecision}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    {decision === 'APROBADO' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de respuesta a mensaje de soporte */}
      <Modal visible={!!replyTarget} animationType="slide" transparent onRequestClose={() => setReplyTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Responder consulta</Text>
            <Text style={styles.modalSubtitle}>{replyTarget?.subject} — {replyTarget?.company.name}</Text>
            <Text style={styles.messageBodyText}>{replyTarget?.message}</Text>

            <TextInput
              style={styles.feedbackInput}
              placeholder="Escribe tu respuesta..."
              placeholderTextColor="#94A3B8"
              value={replyText}
              onChangeText={setReplyText}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setReplyTarget(null)} disabled={submittingReply}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { opacity: submittingReply ? 0.7 : 1 }]}
                onPress={submitReply}
                disabled={submittingReply}
              >
                {submittingReply ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Enviar Respuesta</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  topBanner: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  topTitle: { fontSize: 16, fontWeight: 'bold', color: '#034123', letterSpacing: 0.5 },
  viewSwitchRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  viewSwitchTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewSwitchTabActive: {
    backgroundColor: '#034123',
  },
  viewSwitchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  viewSwitchTextActive: {
    color: '#FFFFFF',
  },
  messageBodyText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
    marginTop: 6,
    marginBottom: 10,
  },
  feedbackLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 4,
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
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },
  companyStatsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 8, marginBottom: 4 },
  companyStatBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  companyStatText: { fontSize: 11, fontWeight: '600', color: '#334155' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E2E8F0' },
  activeFilterChip: { backgroundColor: '#034123' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  activeFilterText: { color: '#FFFFFF' },
  loadingBox: { paddingVertical: 50, alignItems: 'center' },
  emptyText: { marginTop: 10, fontSize: 13, color: '#64748B' },
  list: { gap: 14 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  companyName: { fontSize: 14, fontWeight: 'bold', color: '#0F172A' },
  folioText: { fontSize: 11, fontWeight: '600', color: '#034123' },
  cardBody: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  fileIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  docTitle: { fontSize: 14, fontWeight: 'bold', color: '#0F172A' },
  pasoTag: { fontSize: 11, color: '#64748B', marginTop: 2 },
  metaText: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  viewButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  viewButtonText: { fontSize: 12, fontWeight: '600', color: '#034123', textDecorationLine: 'underline' },
  feedbackBox: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, marginBottom: 10 },
  feedbackText: { fontSize: 12, color: '#475569', lineHeight: 17 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  rejectButton: {
    flex: 1,
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
  rejectButtonText: { color: '#DC2626', fontSize: 13, fontWeight: 'bold' },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#034123',
    paddingVertical: 10,
    borderRadius: 8,
  },
  approveButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  approvedBadge: { backgroundColor: '#DCFCE7' },
  rejectedBadge: { backgroundColor: '#FEE2E2' },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold' },
  logoutRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 10,
  },
  logoutText: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
  modalSubtitle: { fontSize: 12, color: '#64748B', marginBottom: 14 },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActionsRow: { flexDirection: 'row', gap: 10 },
  cancelButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10, backgroundColor: '#F1F5F9' },
  cancelButtonText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  confirmButton: { flex: 2, paddingVertical: 12, alignItems: 'center', borderRadius: 10, backgroundColor: '#034123' },
  confirmButtonReject: { backgroundColor: '#DC2626' },
  confirmButtonText: { fontSize: 13, fontWeight: 'bold', color: '#FFFFFF' },

  // Tarjeta de empresa: pie con llamado a la acción
  cardFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  seeMoreRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeMoreText: { fontSize: 11, fontWeight: '700', color: '#034123' },

  // Detalle de empresa (pantalla completa)
  detailContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  detailBackButton: { padding: 2 },
  detailHeaderTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 'bold', color: '#0F172A', marginHorizontal: 8 },
  detailScroll: { padding: 16, paddingBottom: 40 },
  detailInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  detailInfoHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  detailCompanyName: { flex: 1, fontSize: 17, fontWeight: 'bold', color: '#0F172A', marginRight: 8 },
  folioBadge: { backgroundColor: '#E6F4EA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  folioBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#034123' },
  detailInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 14 },
  detailInfoItem: { width: '45%' },
  detailInfoLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 3 },
  detailInfoValue: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  detailInfoSub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  detailSectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#0F172A', marginBottom: 12 },
  rutaSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  rutaSummaryBox: { alignItems: 'center' },
  rutaSummaryValue: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', marginTop: 2 },
  pasoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  pasoCardPending: { borderColor: '#FBBF24', borderWidth: 1.5, backgroundColor: '#FFFBEB' },
  pasoCardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  pasoOrdenBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#034123',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pasoOrdenBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  pasoTitle: { flex: 1, fontSize: 14, fontWeight: 'bold', color: '#0F172A' },
  pasoDescripcion: { fontSize: 12, color: '#64748B', lineHeight: 17, marginBottom: 8 },
  pasoStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pasoStatusText: { fontSize: 12, fontWeight: 'bold' },
  pendingValidationBox: { gap: 10 },
  pendingValidationActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  validateRejectButton: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5' },
  validateApproveButton: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: '#034123' },
});
