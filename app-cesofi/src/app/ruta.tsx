import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function RutaScreen() {
  const router = useRouter();

  // Función segura para regresar
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const steps = [
    {
      id: 1,
      title: 'Registro de la empresa',
      description: 'Registra los datos básicos de tu empresa.',
      status: 'COMPLETADA',
      pts: '+100 pts',
      iconType: 'ion',
      iconName: 'storefront-outline',
    },
    {
      id: 2,
      title: 'Diagnóstico empresarial',
      description: 'Responde el diagnóstico para conocer el estado actual de tu empresa.',
      status: 'COMPLETADA',
      pts: '+150 pts',
      iconType: 'ion',
      iconName: 'clipboard-outline',
    },
    {
      id: 3,
      title: 'Plan de negocios',
      description: 'Diseña el plan estratégico de tu negocio a corto y mediano plazo.',
      status: 'EN PROCESO',
      pts: '+100 pts',
      iconType: 'ion',
      iconName: 'document-text-outline',
    },
    {
      id: 4,
      title: 'Presupuesto de inversión',
      description: 'Calcula los requerimientos financieros de tu empresa.',
      status: 'PENDIENTE',
      pts: '+150 pts',
      iconType: 'ion',
      iconName: 'calculator-outline',
    },
  ];

  const getStepStyles = (status: string) => {
    switch (status) {
      case 'COMPLETADA':
        return {
          nodeColor: '#034123',
          cardBorderColor: '#E2E8F0',
          badgeBg: '#DCFCE7',
          badgeTextColor: '#15803D',
          actionIcon: (
            <Ionicons name="checkmark-circle" size={24} color="#034123" />
          ),
        };
      case 'EN PROCESO':
        return {
          nodeColor: '#D97706',
          cardBorderColor: '#FCD34D',
          badgeBg: '#FEF3C7',
          badgeTextColor: '#B45309',
          actionIcon: (
            <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
          ),
        };
      default: // PENDIENTE
        return {
          nodeColor: '#94A3B8',
          cardBorderColor: '#E2E8F0',
          badgeBg: '#F1F5F9',
          badgeTextColor: '#64748B',
          actionIcon: (
            <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
          ),
        };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Botón de Regresar */}
        <View style={styles.topNavigationRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#034123" />
            <Text style={styles.backText}>Regresar</Text>
          </TouchableOpacity>
        </View>

        {/* Banner Informativo Superior */}
        <View style={styles.topBanner}>
          <Text style={styles.topTitle}>MI RUTA</Text>
          <View style={styles.topIconBox}>
            <Ionicons name="map-outline" size={22} color="#034123" />
          </View>
        </View>

        {/* Contenido Principal: Línea de tiempo + Pasos */}
        <View style={styles.timelineContainer}>
          <View style={styles.verticalLine} />

          {steps.map((item) => {
            const stepStyle = getStepStyles(item.status);
            return (
              <View key={item.id} style={styles.stepRow}>
                <View
                  style={[
                    styles.nodeCircle,
                    { borderColor: stepStyle.nodeColor },
                  ]}
                >
                  <View
                    style={[
                      styles.nodeInnerCircle,
                      { backgroundColor: stepStyle.nodeColor },
                    ]}
                  >
                    {item.iconType === 'ion' ? (
                      <Ionicons
                        name={item.iconName as any}
                        size={20}
                        color="#FFFFFF"
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={item.iconName as any}
                        size={20}
                        color="#FFFFFF"
                      />
                    )}
                  </View>
                </View>

                <View
                  style={[
                    styles.stepCard,
                    { borderColor: stepStyle.cardBorderColor },
                  ]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View
                      style={[
                        styles.stepNumberBadge,
                        { backgroundColor: stepStyle.nodeColor },
                      ]}
                    >
                      <Text style={styles.stepNumberText}>{item.id}</Text>
                    </View>

                    <View style={styles.cardTextContent}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardDescription}>
                        {item.description}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardFooterRow}>
                    <View style={styles.statusAndPts}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: stepStyle.badgeBg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: stepStyle.badgeTextColor },
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>
                      <Text style={styles.ptsText}>{item.pts}</Text>
                    </View>
                    {stepStyle.actionIcon}
                  </View>
                </View>
              </View>
            );
          })}

          {/* Meta Final */}
          <View style={styles.stepRow}>
            <View style={[styles.nodeCircle, { borderColor: '#034123' }]}>
              <View
                style={[
                  styles.nodeInnerCircle,
                  { backgroundColor: '#034123' },
                ]}
              >
                <Ionicons name="trophy" size={20} color="#FFFFFF" />
              </View>
            </View>

            <View style={[styles.stepCard, styles.metaCard]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaTitle}>Meta: Empresa fortalecida</Text>
                <Text style={styles.metaDescription}>
                  Completa todas las actividades de la ruta y obtén tu
                  reconocimiento.
                </Text>
              </View>
              <View style={styles.metaFlagBox}>
                <Ionicons name="flag-outline" size={24} color="#034123" />
              </View>
            </View>
          </View>
        </View>

        {/* Tarjeta de Puntos Totales */}
        <View style={styles.summaryCard}>
          <View style={styles.starCircle}>
            <Ionicons name="star" size={22} color="#FFFFFF" />
          </View>
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <Text style={styles.puntosTotalValue}>1,150 pts</Text>
            <Text style={styles.puntosTotalSub}>
              Puedes obtener al completar toda la ruta
            </Text>
          </View>
        </View>

        {/* Caja Importante */}
        <View style={styles.importantBox}>
          <View style={styles.lightbulbBadge}>
            <Ionicons name="bulb-outline" size={22} color="#034123" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.importantTitle}>Importante</Text>
            <Text style={styles.importantText}>
              Completa cada paso en orden para avanzar en tu ruta. Cada
              actividad te acerca a una empresa más fuerte y competitiva.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Tab Bar Inferior */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.replace('/')}
        >
          <Ionicons name="home-outline" size={22} color="#94A3B8" />
          <Text style={styles.tabLabel}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="clipboard-outline" size={22} color="#94A3B8" />
          <Text style={styles.tabLabel}>Mi diagnóstico</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="leaf" size={22} color="#034123" />
          <Text style={[styles.tabLabel, { color: '#034123', fontWeight: 'bold' }]}>
            Mi ruta
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="folder-outline" size={22} color="#94A3B8" />
          <Text style={styles.tabLabel}>Evidencias</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#94A3B8" />
          <Text style={styles.tabLabel}>Más</Text>
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
  topNavigationRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  backText: {
    color: '#034123',
    fontWeight: '600',
    fontSize: 14,
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nodeInnerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stepNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cardTextContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  statusAndPts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  ptsText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#D97706',
  },
  metaCard: {
    borderColor: '#034123',
    backgroundColor: '#F0FDF4',
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#034123',
    marginBottom: 2,
  },
  metaDescription: {
    fontSize: 12,
    color: '#166534',
  },
  metaFlagBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  starCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAB308',
    justifyContent: 'center',
    alignItems: 'center',
  },
  puntosTotalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  puntosTotalSub: {
    fontSize: 12,
    color: '#64748B',
  },
  importantBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  lightbulbBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  importantTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 2,
  },
  importantText: {
    fontSize: 12,
    color: '#B45309',
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