import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from '../components/Header';
import { API_URL } from '../config/api';
import { clearSession } from '../utils/auth';

interface Paso {
  orden: number;
  titulo: string;
  descripcion: string;
  area: string;
  impactoEnPuntaje?: string;
  recursos: string;
  plazo: string;
}

interface Recomendacion {
  recomendacionId: string;
  titulo: string;
  categoria: string;
  institucion?: string;
  esCapacitacion?: boolean;
  enlace?: string;
  justificacion: string;
}

interface RutaResponse {
  linked: boolean;
  found?: boolean;
  configured?: boolean;
  message?: string;
  folio?: string;
  negocio?: { rfc: string | null; nombreNegocio: string };
  resultado?: { nivel: number; puntajeTotal: number; dscr: number; esViable: boolean };
  diagnosticoIA?: {
    resumenGeneral: string;
    accionesCriticas?: string[];
    recomendaciones?: Recomendacion[];
    planMejoraNivel: {
      nivelActual: number;
      nivelObjetivo: number;
      tiempoEstimado: string;
      pasos: Paso[];
    };
  } | null;
}

export default function RutaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ruta, setRuta] = useState<RutaResponse | null>(null);

  const fetchRuta = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        await clearSession();
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/ruta`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        await clearSession();
        router.replace('/login');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo obtener tu ruta.');
      }

      setRuta(data);
    } catch (err: any) {
      console.error('Error al cargar la ruta:', err);
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchRuta();
  }, [fetchRuta]);

  const diagnostico = ruta?.diagnosticoIA;
  const plan = diagnostico?.planMejoraNivel;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchRuta(true)} colors={['#034123']} tintColor="#034123" />
        }
      >
        {/* Banner Informativo Superior */}
        <View style={styles.topBanner}>
          <Text style={styles.topTitle}>MI RUTA</Text>
          <View style={styles.topIconBox}>
            <Ionicons name="map-outline" size={22} color="#034123" />
          </View>
        </View>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color="#034123" />
            <Text style={styles.stateText}>Consultando tu plan de mejora...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Ionicons name="cloud-offline-outline" size={32} color="#94A3B8" />
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchRuta()}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : !ruta?.linked ? (
          <View style={styles.stateBox}>
            <Ionicons name="link-outline" size={32} color="#94A3B8" />
            <Text style={styles.stateTitle}>Vincula tu Folio CESOFI</Text>
            <Text style={styles.stateText}>
              Para que tu Ruta se llene automáticamente con tu plan de mejora, acciones críticas y
              capacitaciones, vincula el folio de atención que te asignó tu asesor en "Mi Empresa".
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => router.push('/mi-empresa')}>
              <Text style={styles.retryButtonText}>Ir a Mi Empresa</Text>
            </TouchableOpacity>
          </View>
        ) : !ruta.found ? (
          <View style={styles.stateBox}>
            <Ionicons name="alert-circle-outline" size={32} color="#94A3B8" />
            <Text style={styles.stateTitle}>Folio no encontrado</Text>
            <Text style={styles.stateText}>{ruta.message}</Text>
          </View>
        ) : !diagnostico || !plan ? (
          <View style={styles.stateBox}>
            <Ionicons name="hourglass-outline" size={32} color="#94A3B8" />
            <Text style={styles.stateTitle}>Diagnóstico en preparación</Text>
            <Text style={styles.stateText}>
              Tu asesor todavía no genera tu diagnóstico y plan de mejora personalizado. Vuelve a
              consultar más tarde.
            </Text>
          </View>
        ) : (
          <>
            {/* Resumen del nivel actual */}
            <View style={styles.levelSummaryCard}>
              <View style={styles.levelRow}>
                <View style={styles.levelBox}>
                  <Text style={styles.levelBoxLabel}>Nivel actual</Text>
                  <Text style={styles.levelBoxValue}>{plan.nivelActual}</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#94A3B8" />
                <View style={styles.levelBox}>
                  <Text style={styles.levelBoxLabel}>Meta</Text>
                  <Text style={[styles.levelBoxValue, { color: '#034123' }]}>{plan.nivelObjetivo}</Text>
                </View>
                <View style={styles.dividerVertical} />
                <View style={styles.levelBox}>
                  <Text style={styles.levelBoxLabel}>Tiempo estimado</Text>
                  <Text style={styles.levelBoxSub}>{plan.tiempoEstimado}</Text>
                </View>
              </View>
              {diagnostico.resumenGeneral && (
                <Text style={styles.resumenText}>{diagnostico.resumenGeneral}</Text>
              )}
            </View>

            {/* Acciones críticas */}
            {diagnostico.accionesCriticas && diagnostico.accionesCriticas.length > 0 && (
              <View style={styles.criticalCard}>
                <Text style={styles.criticalTitle}>⚠️ Acciones críticas (próximas 4 semanas)</Text>
                {diagnostico.accionesCriticas.map((accion, index) => (
                  <View key={index} style={styles.criticalRow}>
                    <Ionicons name="alert-circle" size={16} color="#B45309" />
                    <Text style={styles.criticalText}>{accion}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Línea de tiempo del plan de mejora */}
            <View style={styles.timelineContainer}>
              <View style={styles.verticalLine} />

              {plan.pasos.map((paso) => (
                <View key={paso.orden} style={styles.stepRow}>
                  <View style={styles.nodeCircle}>
                    <View style={styles.nodeInnerCircle}>
                      <Text style={styles.nodeOrderText}>{paso.orden}</Text>
                    </View>
                  </View>

                  <View style={styles.stepCard}>
                    <Text style={styles.cardTitle}>{paso.titulo}</Text>
                    <Text style={styles.cardDescription}>{paso.descripcion}</Text>

                    <View style={styles.tagsRow}>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{paso.area}</Text>
                      </View>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{paso.plazo}</Text>
                      </View>
                      {paso.impactoEnPuntaje && (
                        <View style={[styles.tag, styles.tagImpact]}>
                          <Text style={[styles.tagText, { color: '#15803D' }]}>{paso.impactoEnPuntaje}</Text>
                        </View>
                      )}
                    </View>

                    {paso.recursos && (
                      <Text style={styles.recursosText}>Recursos: {paso.recursos}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* Recomendaciones y capacitaciones */}
            {diagnostico.recomendaciones && diagnostico.recomendaciones.length > 0 && (
              <View style={styles.recCard}>
                <Text style={styles.recTitle}>Recomendaciones y capacitaciones</Text>
                {diagnostico.recomendaciones.map((rec) => (
                  <TouchableOpacity
                    key={rec.recomendacionId}
                    style={styles.recItem}
                    activeOpacity={rec.enlace ? 0.7 : 1}
                    onPress={() => rec.enlace && Linking.openURL(rec.enlace).catch(() => {})}
                  >
                    <View style={styles.recIconBg}>
                      <Ionicons
                        name={rec.esCapacitacion ? 'school-outline' : 'ribbon-outline'}
                        size={18}
                        color="#034123"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recItemTitle}>{rec.titulo}</Text>
                      {rec.institucion && <Text style={styles.recItemSub}>{rec.institucion}</Text>}
                      <Text style={styles.recItemJust}>{rec.justificacion}</Text>
                    </View>
                    {rec.enlace && <Ionicons name="open-outline" size={18} color="#94A3B8" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Tab Bar Inferior */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/')}>
          <Ionicons name="home-outline" size={22} color="#94A3B8" />
          <Text style={styles.tabLabel}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="leaf" size={22} color="#034123" />
          <Text style={[styles.tabLabel, { color: '#034123', fontWeight: 'bold' }]}>Mi ruta</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/evidencias')}>
          <Ionicons name="folder-outline" size={22} color="#94A3B8" />
          <Text style={styles.tabLabel}>Evidencias</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  topBanner: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  topTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#034123',
    letterSpacing: 0.5,
  },
  topIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateBox: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 12,
    textAlign: 'center',
  },
  stateText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 19,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#034123',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  levelSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelBox: {
    alignItems: 'center',
    flex: 1,
  },
  levelBoxLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  levelBoxValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  levelBoxSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  dividerVertical: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  resumenText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 12,
    lineHeight: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  criticalCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  criticalTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 10,
  },
  criticalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  criticalText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
    lineHeight: 17,
  },
  timelineContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  verticalLine: {
    position: 'absolute',
    left: 20,
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: '#CBD5E1',
    zIndex: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    zIndex: 1,
  },
  nodeCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#034123',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nodeInnerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#034123',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeOrderText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagImpact: {
    backgroundColor: '#DCFCE7',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  recursosText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  recCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  recIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recItemTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  recItemSub: {
    fontSize: 11,
    color: '#034123',
    fontWeight: '600',
    marginTop: 1,
  },
  recItemJust: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 16,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
});
