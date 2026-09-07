import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from '../components/Header';
import { API_URL } from '../config/api';
import { clearSession } from '../utils/auth';

interface Capacitacion {
  recomendacionId: string;
  titulo: string;
  categoria: string;
  institucion?: string;
  enlace?: string;
  justificacion: string;
}

interface RutaResponse {
  linked: boolean;
  found?: boolean;
  diagnosticoIA?: {
    recomendaciones?: Array<Capacitacion & { esCapacitacion?: boolean }>;
  } | null;
}

export default function CapacitacionesScreen() {
  const router = useRouter();
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
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar tus capacitaciones.');
      setRuta(data);
    } catch (err: any) {
      console.error('Error al cargar capacitaciones:', err);
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchRuta();
  }, [fetchRuta]);

  const capacitaciones = (ruta?.diagnosticoIA?.recomendaciones || []).filter((r) => r.esCapacitacion);

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchRuta(true)} colors={['#034123']} tintColor="#034123" />
        }
      >
        <View style={styles.topBanner}>
          <Text style={styles.topTitle}>CAPACITACIONES</Text>
          <Ionicons name="school-outline" size={22} color="#034123" />
        </View>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="large" color="#034123" />
            <Text style={styles.stateText}>Consultando tus capacitaciones recomendadas...</Text>
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
              Vincula tu folio de atención en "Mi Empresa" para ver las capacitaciones recomendadas
              para tu negocio.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => router.push('/mi-empresa')}>
              <Text style={styles.retryButtonText}>Ir a Mi Empresa</Text>
            </TouchableOpacity>
          </View>
        ) : !ruta.found ? (
          <View style={styles.stateBox}>
            <Ionicons name="alert-circle-outline" size={32} color="#94A3B8" />
            <Text style={styles.stateTitle}>Folio no encontrado</Text>
          </View>
        ) : capacitaciones.length === 0 ? (
          <View style={styles.stateBox}>
            <Ionicons name="school-outline" size={32} color="#94A3B8" />
            <Text style={styles.stateTitle}>Sin capacitaciones por ahora</Text>
            <Text style={styles.stateText}>
              Cuando tu asesor tenga capacitaciones recomendadas para tu nivel, aparecerán aquí.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {capacitaciones.map((cap) => (
              <TouchableOpacity
                key={cap.recomendacionId}
                style={styles.card}
                activeOpacity={cap.enlace ? 0.7 : 1}
                onPress={() => cap.enlace && Linking.openURL(cap.enlace).catch(() => {})}
              >
                <View style={styles.cardIconBg}>
                  <Ionicons name="school" size={22} color="#034123" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{cap.titulo}</Text>
                  {cap.institucion && <Text style={styles.cardInstitucion}>{cap.institucion}</Text>}
                  <Text style={styles.cardJustificacion}>{cap.justificacion}</Text>
                  {cap.enlace && (
                    <View style={styles.linkRow}>
                      <Ionicons name="open-outline" size={14} color="#034123" />
                      <Text style={styles.linkText}>Ver curso</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  topBanner: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  topTitle: { fontSize: 20, fontWeight: 'bold', color: '#034123', letterSpacing: 0.5 },
  stateBox: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 20 },
  stateTitle: { fontSize: 16, fontWeight: 'bold', color: '#0F172A', marginTop: 12, textAlign: 'center' },
  stateText: { fontSize: 13, color: '#64748B', marginTop: 8, textAlign: 'center', lineHeight: 19 },
  retryButton: { marginTop: 16, backgroundColor: '#034123', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  list: { gap: 12 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  cardIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#0F172A' },
  cardInstitucion: { fontSize: 11, fontWeight: '600', color: '#034123', marginTop: 2 },
  cardJustificacion: { fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 17 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  linkText: { fontSize: 12, fontWeight: '600', color: '#034123', textDecorationLine: 'underline' },
});
