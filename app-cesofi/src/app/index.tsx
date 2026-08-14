import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from '../components/Header';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useNavigateWithLoading } from '../hooks/useNavigateWithLoading';

export default function HomeScreen() {
  const router = useRouter();
  const { loading, loadingMessage, navigate } = useNavigateWithLoading();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userName, setUserName] = useState('Usuario');
  const [userCompany, setUserCompany] = useState('Empresa CESOFI');
  const [userInitials, setUserInitials] = useState('U');

  // Comprobar token e inicializar datos al abrir la app
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        // SI NO HAY TOKEN -> Redirigir directamente al Login
        if (!token) {
          router.replace('/login');
          return;
        }

        const storedName = await AsyncStorage.getItem('userName');
        const storedCompany = await AsyncStorage.getItem('userCompany');

        if (storedName) {
          setUserName(storedName);

          // Calcular iniciales (ej: "Ricardo Pérez" -> "RP")
          const nameParts = storedName.trim().split(' ').filter(Boolean);
          if (nameParts.length >= 2) {
            setUserInitials(`${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase());
          } else if (nameParts.length === 1) {
            setUserInitials(nameParts[0].substring(0, 2).toUpperCase());
          }
        }

        if (storedCompany) {
          setUserCompany(storedCompany);
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
        router.replace('/login');
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthAndLoadData();
  }, []);

  const quickActions = [
    {
      id: 'empresa',
      title: 'Mi Empresa',
      subtitle: 'Perfil y RFC',
      icon: 'business',
      iconLib: 'ionicons',
      color: '#034123',
      bgColor: '#E6F4EA',
      route: '/mi-empresa',
    },
    {
      id: 'evidencias',
      title: 'Evidencias',
      subtitle: 'Documentos',
      icon: 'folder-outline',
      iconLib: 'ionicons',
      color: '#0284C7',
      bgColor: '#E0F2FE',
      route: '/evidencias',
    },
    {
      id: 'logros',
      title: 'Mis Logros',
      subtitle: 'Medallas y Pts',
      icon: 'ribbon-outline',
      iconLib: 'ionicons',
      color: '#D97706',
      bgColor: '#FEF3C7',
      route: '/logros',
    },
    {
      id: 'ayuda',
      title: 'Ayuda',
      subtitle: 'Soporte y FAQ',
      icon: 'help-circle-outline',
      iconLib: 'ionicons',
      color: '#7C3AED',
      bgColor: '#F3E8FF',
      route: '/ayuda',
    },
  ];

  const activities = [
    {
      id: '1',
      number: '1',
      title: 'Plan de negocios',
      status: 'EN PROCESO',
      statusBg: '#FEF3C7',
      statusColor: '#D97706',
      points: '+100 pts',
      icon: 'file-document-outline',
    },
    {
      id: '2',
      number: '2',
      title: 'Presupuesto de inversión',
      status: 'PENDIENTE',
      statusBg: '#F1F5F9',
      statusColor: '#475569',
      points: '+150 pts',
      icon: 'calculator',
    },
    {
      id: '3',
      number: '3',
      title: 'Registro ante el SAT',
      status: 'PENDIENTE',
      statusBg: '#F1F5F9',
      statusColor: '#475569',
      points: '+150 pts',
      icon: 'domain',
    },
  ];

  // Si está verificando autenticación, mostramos spinner limpio
  if (checkingAuth) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#034123" />
        <Text style={styles.loadingText}>Cargando CESOFI...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Overlay de carga al navegar */}
      <LoadingOverlay visible={loading} message={loadingMessage} />
      {/* Header Principal */}
      <Header userInitials={userInitials} notificationCount={2} />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Hero de Bienvenida */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTextGroup}>
              <Text style={styles.greetingText}>¡Hola, {userName}! 👋</Text>
              <Text style={styles.companyNameText} numberOfLines={1}>
                {userCompany}
              </Text>
            </View>

            <View style={styles.pointsBadge}>
              <Ionicons name="star" size={16} color="#EAB308" />
              <Text style={styles.pointsText}>350 pts</Text>
            </View>
          </View>

          <Text style={styles.heroSubtitle}>
            Continúa avanzando en tu Ruta CESOFI para hacer crecer tu negocio.
          </Text>
        </View>

        {/* Grilla de Accesos Rápidos */}
        <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
        <View style={styles.quickGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickCard}
              activeOpacity={0.8}
              onPress={() => navigate(action.route, `Cargando ${action.title}...`)}
            >
              <View style={[styles.quickIconBg, { backgroundColor: action.bgColor }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={styles.quickCardTitle}>{action.title}</Text>
              <Text style={styles.quickCardSubtitle}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tarjeta Destacada "Mi Ruta CESOFI" */}
        <View style={styles.routeCard}>
          <View style={styles.routeCardHeader}>
            <View style={styles.routeIconBg}>
              <FontAwesome5 name="route" size={20} color="#034123" />
            </View>
            <View style={styles.routeHeaderInfo}>
              <Text style={styles.routeTitle}>Mi Ruta CESOFI</Text>
              <Text style={styles.routeSubtitle}>Avance general de tu plan</Text>
            </View>
            <View style={styles.percentBadge}>
              <Text style={styles.percentText}>60%</Text>
            </View>
          </View>

          {/* Barra de Progreso */}
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: '60%' }]} />
          </View>

          <View style={styles.routeFooterRow}>
            <Text style={styles.routeFooterText}>3 de 5 tareas completadas</Text>

            <TouchableOpacity
              style={styles.continueRouteButton}
              onPress={() => navigate('/ruta', 'Cargando Mi Ruta...')}
            >
              <Text style={styles.continueRouteText}>Continuar Ruta</Text>
              <Ionicons name="arrow-forward" size={14} color="#034123" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Próximas Actividades */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximas Actividades</Text>
          <TouchableOpacity onPress={() => navigate('/ruta', 'Cargando Mi Ruta...')}>
            <Text style={styles.seeAllText}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activitiesList}>
          {activities.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.activityCard}
              activeOpacity={0.8}
              onPress={() => navigate('/ruta', 'Cargando Mi Ruta...')}
            >
              <View style={styles.activityLeft}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberText}>{item.number}</Text>
                </View>

                <View style={styles.activityIconBg}>
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={20}
                    color="#475569"
                  />
                </View>

                <Text style={styles.activityTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>

              <View style={styles.activityRight}>
                <View style={[styles.statusBadge, { backgroundColor: item.statusBg }]}>
                  <Text style={[styles.statusText, { color: item.statusColor }]}>
                    {item.status}
                  </Text>
                </View>
                <Text style={styles.activityPoints}>{item.points}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Banner Motivacional de Soporte */}
        <TouchableOpacity
          style={styles.supportBanner}
          activeOpacity={0.85}
          onPress={() => navigate('/ayuda', 'Cargando Ayuda...')}
        >
          <View style={styles.supportIconCircle}>
            <Ionicons name="chatbubbles-outline" size={24} color="#FFFFFF" />
          </View>

          <View style={styles.supportInfo}>
            <Text style={styles.supportTitle}>¿Tienes dudas con tu negocio?</Text>
            <Text style={styles.supportSubtitle}>
              Contacta a un asesor de CESOFI para resolver tus inquietudes.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  heroBanner: {
    backgroundColor: '#034123',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#034123',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  heroTextGroup: {
    flex: 1,
    marginRight: 10,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  companyNameText: {
    fontSize: 14,
    color: '#A7F3D0',
    fontWeight: '600',
    marginTop: 2,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  pointsText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    color: '#034123',
    fontWeight: '600',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  quickCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  quickIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  quickCardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  routeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  routeIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeHeaderInfo: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  routeSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  percentBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentText: {
    color: '#034123',
    fontWeight: 'bold',
    fontSize: 14,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#034123',
    borderRadius: 5,
  },
  routeFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeFooterText: {
    fontSize: 12,
    color: '#64748B',
  },
  continueRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  continueRouteText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#034123',
  },
  activitiesList: {
    gap: 10,
    marginBottom: 20,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  numberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  numberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  activityIconBg: {
    marginRight: 10,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  activityPoints: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  supportBanner: {
    backgroundColor: '#034123',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  supportIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  supportInfo: {
    flex: 1,
    marginRight: 8,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  supportSubtitle: {
    fontSize: 11,
    color: '#A7F3D0',
    marginTop: 2,
  },
});