import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from '../components/Header';

interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  status: 'DESBLOQUEADO' | 'EN_PROGRESO' | 'BLOQUEADO';
  date?: string;
  progressPercent?: number;
  iconName: string;
  iconLib: 'ionicons' | 'fa5' | 'mci';
}

export default function LogrosScreen() {
  const [filter, setFilter] = useState<'TODOS' | 'DESBLOQUEADOS' | 'BLOQUEADOS'>('TODOS');
  const [userPoints, setUserPoints] = useState(350);
  const [userLevel, setUserLevel] = useState('Bronce');

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedCompany = await AsyncStorage.getItem('userCompany');
        // Si hay datos en storage, los usamos para mantener coherencia
      } catch (e) {
        console.error('Error al cargar datos de logros:', e);
      }
    };
    loadData();
  }, []);

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'Primer Paso Empresarial',
      description: 'Completaste el registro de tu empresa en la plataforma CESOFI.',
      points: 100,
      status: 'DESBLOQUEADO',
      date: '10 Ene 2026',
      iconName: 'flag',
      iconLib: 'ionicons',
    },
    {
      id: '2',
      title: 'Diagnóstico Inicial',
      description: 'Evaluaste el estado de madurez de tu negocio.',
      points: 150,
      status: 'DESBLOQUEADO',
      date: '15 Ene 2026',
      iconName: 'clipboard-check',
      iconLib: 'mci',
    },
    {
      id: '3',
      title: 'Estratega de Negocio',
      description: 'Diseño e implementación del Plan de Negocios.',
      points: 100,
      status: 'EN_PROGRESO',
      progressPercent: 60,
      iconName: 'file-signature',
      iconLib: 'fa5',
    },
    {
      id: '4',
      title: 'Maestro Financiero',
      description: 'Calculaste y estructuraste el presupuesto de inversión.',
      points: 150,
      status: 'BLOQUEADO',
      iconName: 'calculator',
      iconLib: 'mci',
    },
    {
      id: '5',
      title: 'Negocio Formal',
      description: 'Registro oficial y constancia de situación fiscal ante el SAT.',
      points: 150,
      status: 'BLOQUEADO',
      iconName: 'shield-checkmark-outline',
      iconLib: 'ionicons',
    },
    {
      id: '6',
      title: 'Graduado CESOFI',
      description: 'Completaste exitosamente 3 capacitaciones empresariales.',
      points: 200,
      status: 'BLOQUEADO',
      iconName: 'school-outline',
      iconLib: 'ionicons',
    },
  ];

  const filteredAchievements = achievements.filter((item) => {
    if (filter === 'DESBLOQUEADOS') return item.status === 'DESBLOQUEADO';
    if (filter === 'BLOQUEADOS') return item.status !== 'DESBLOQUEADO';
    return true;
  });

  const renderIcon = (item: Achievement) => {
    const isUnlocked = item.status === 'DESBLOQUEADO';
    const isProgress = item.status === 'EN_PROGRESO';
    const color = isUnlocked ? '#034123' : isProgress ? '#D97706' : '#94A3B8';

    if (item.iconLib === 'fa5') {
      return <FontAwesome5 name={item.iconName as any} size={20} color={color} />;
    }
    if (item.iconLib === 'mci') {
      return <MaterialCommunityIcons name={item.iconName as any} size={22} color={color} />;
    }
    return <Ionicons name={item.iconName as any} size={22} color={color} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta Hero Gamificación */}
        <View style={styles.heroCard}>
          <View style={styles.levelHeader}>
            <View style={styles.trophyCircle}>
              <Ionicons name="ribbon-sharp" size={32} color="#FFFFFF" />
            </View>

            <View style={styles.levelInfo}>
              <Text style={styles.levelLabel}>Nivel Actual de la Empresa</Text>
              <Text style={styles.levelTitle}>Nivel {userLevel}</Text>
            </View>

            <View style={styles.pointsBadge}>
              <Ionicons name="star" size={16} color="#EAB308" />
              <Text style={styles.pointsNumber}>{userPoints} pts</Text>
            </View>
          </View>

          {/* Barra de Progreso hacia el siguiente Nivel */}
          <View style={styles.progressSection}>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressLabel}>Progreso al Nivel Plata (500 pts)</Text>
              <Text style={styles.progressPercent}>70%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '70%' }]} />
            </View>
            <Text style={styles.progressFootnote}>
              ¡Te faltan solo 150 puntos para alcanzar el nivel Plata y desbloquear asesorías personalizadas!
            </Text>
          </View>
        </View>

        {/* Filtro de Medallas */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'TODOS' && styles.activeFilterChip]}
            onPress={() => setFilter('TODOS')}
          >
            <Text style={[styles.filterText, filter === 'TODOS' && styles.activeFilterText]}>
              Todas ({achievements.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'DESBLOQUEADOS' && styles.activeFilterChip]}
            onPress={() => setFilter('DESBLOQUEADOS')}
          >
            <Text style={[styles.filterText, filter === 'DESBLOQUEADOS' && styles.activeFilterText]}>
              Desbloqueadas (2)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'BLOQUEADOS' && styles.activeFilterChip]}
            onPress={() => setFilter('BLOQUEADOS')}
          >
            <Text style={[styles.filterText, filter === 'BLOQUEADOS' && styles.activeFilterText]}>
              En Camino (4)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Galería de Insignias */}
        <View style={styles.achievementsList}>
          {filteredAchievements.map((item) => {
            const isUnlocked = item.status === 'DESBLOQUEADO';
            const isProgress = item.status === 'EN_PROGRESO';

            return (
              <View
                key={item.id}
                style={[
                  styles.achievementCard,
                  isUnlocked && styles.unlockedCard,
                  isProgress && styles.progressCard,
                ]}
              >
                <View style={styles.cardLeftRow}>
                  <View
                    style={[
                      styles.iconBg,
                      isUnlocked && styles.unlockedIconBg,
                      isProgress && styles.progressIconBg,
                    ]}
                  >
                    {renderIcon(item)}
                  </View>

                  <View style={styles.achievementTextGroup}>
                    <View style={styles.titleRow}>
                      <Text style={styles.achievementTitle}>{item.title}</Text>
                      {isUnlocked && (
                        <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                      )}
                    </View>
                    <Text style={styles.achievementDesc}>{item.description}</Text>

                    {isProgress && (
                      <View style={styles.miniProgressRow}>
                        <View style={styles.miniProgressBg}>
                          <View
                            style={[
                              styles.miniProgressFill,
                              { width: `${item.progressPercent}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.miniProgressText}>{item.progressPercent}%</Text>
                      </View>
                    )}

                    {isUnlocked && item.date && (
                      <Text style={styles.unlockedDate}>Conseguido el {item.date}</Text>
                    )}
                  </View>
                </View>

                {/* Badge de Puntos en la Esquina */}
                <View
                  style={[
                    styles.rewardBadge,
                    isUnlocked ? styles.unlockedReward : styles.lockedReward,
                  ]}
                >
                  <Text
                    style={[
                      styles.rewardText,
                      isUnlocked ? styles.unlockedRewardText : styles.lockedRewardText,
                    ]}
                  >
                    +{item.points} pts
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Sección de Beneficios por Nivel */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Beneficios por Nivel Empresarial</Text>

          <View style={styles.benefitCard}>
            <View style={styles.benefitHeader}>
              <View style={[styles.badgeDot, { backgroundColor: '#D97706' }]} />
              <Text style={styles.benefitLevelName}>Nivel Bronce (Actual)</Text>
              <Text style={styles.unlockedTag}>DESBLOQUEADO</Text>
            </View>
            <Text style={styles.benefitDesc}>
              • Acceso completo a Mi Ruta CESOFI{'\n'}
              • Plantillas y formatos descargables{'\n'}
              • Registro de evidencias y avance
            </Text>
          </View>

          <View style={[styles.benefitCard, { opacity: 0.8 }]}>
            <View style={styles.benefitHeader}>
              <View style={[styles.badgeDot, { backgroundColor: '#64748B' }]} />
              <Text style={styles.benefitLevelName}>Nivel Plata (500 pts)</Text>
              <Text style={styles.lockedTag}>PRÓXIMAMENTE</Text>
            </View>
            <Text style={styles.benefitDesc}>
              • 1 Asesoría personalizada 1-a-1 al mes{'\n'}
              • Acceso a talleres y capacitaciones exclusivas{'\n'}
              • Diagnóstico detallado con recomendaciones
            </Text>
          </View>

          <View style={[styles.benefitCard, { opacity: 0.6 }]}>
            <View style={styles.benefitHeader}>
              <View style={[styles.badgeDot, { backgroundColor: '#EAB308' }]} />
              <Text style={styles.benefitLevelName}>Nivel Oro (1,000 pts)</Text>
              <Text style={styles.lockedTag}>PRÓXIMAMENTE</Text>
            </View>
            <Text style={styles.benefitDesc}>
              • Vinculación prioritaria con fondos y créditos empresariales{'\n'}
              • Mentoría continua de expertos CESOFI{'\n'}
              • Sello de certificación de madurez comercial
            </Text>
          </View>
        </View>
      </ScrollView>
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
  heroCard: {
    backgroundColor: '#034123',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#034123',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trophyCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  levelInfo: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 12,
    color: '#A7F3D0',
    fontWeight: '500',
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pointsNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: '#E2E8F0',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A7F3D0',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 4,
  },
  progressFootnote: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
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
  achievementsList: {
    gap: 12,
    marginBottom: 24,
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unlockedCard: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  progressCard: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  cardLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  unlockedIconBg: {
    backgroundColor: '#DCFCE7',
  },
  progressIconBg: {
    backgroundColor: '#FEF3C7',
  },
  achievementTextGroup: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  achievementDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  unlockedDate: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 4,
  },
  miniProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  miniProgressBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#FDE68A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#D97706',
    borderRadius: 3,
  },
  miniProgressText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D97706',
  },
  rewardBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unlockedReward: {
    backgroundColor: '#DCFCE7',
  },
  lockedReward: {
    backgroundColor: '#F1F5F9',
  },
  rewardText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  unlockedRewardText: {
    color: '#15803D',
  },
  lockedRewardText: {
    color: '#64748B',
  },
  benefitsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  benefitCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  benefitLevelName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
    flex: 1,
  },
  unlockedTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  lockedTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
  },
  benefitDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
});