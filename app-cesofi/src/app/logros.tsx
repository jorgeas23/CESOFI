import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from '../components/Header';
import { API_URL } from '../config/api';

interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  status: 'DESBLOQUEADO' | 'BLOQUEADO';
  date?: string;
  iconName: string;
  iconLib: 'ionicons' | 'mci';
}

const LEVEL_THRESHOLDS = [
  { name: 'Bronce', min: 0 },
  { name: 'Plata', min: 500 },
  { name: 'Oro', min: 1000 },
];

export default function LogrosScreen() {
  const [filter, setFilter] = useState<'TODOS' | 'DESBLOQUEADOS' | 'BLOQUEADOS'>('TODOS');
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [userLevel, setUserLevel] = useState('Bronce');
  const [companyCreatedAt, setCompanyCreatedAt] = useState<string | null>(null);
  const [hasFolio, setHasFolio] = useState(false);
  const [hasPlan, setHasPlan] = useState(false);
  const [evidenceCount, setEvidenceCount] = useState(0);
  const [hasEvidenceInReview, setHasEvidenceInReview] = useState(false);
  const [hasEvidenceApproved, setHasEvidenceApproved] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const [companyRes, rutaRes, evidenceRes] = await Promise.all([
        fetch(`${API_URL}/api/company/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/ruta`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/evidence`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (companyRes.ok) {
        const data = await companyRes.json();
        if (data.company) {
          setUserPoints(data.company.points ?? 0);
          setUserLevel(data.company.level || 'Bronce');
          setCompanyCreatedAt(data.company.createdAt || null);
          setHasFolio(Boolean(data.company.folioCesofi));
        }
      }

      if (rutaRes.ok) {
        const data = await rutaRes.json();
        setHasPlan(Boolean(data.linked && data.found && data.diagnosticoIA));
      }

      if (evidenceRes.ok) {
        const data = await evidenceRes.json();
        const evidences = data.evidences || [];
        setEvidenceCount(evidences.length);
        setHasEvidenceInReview(evidences.some((e: any) => e.status === 'EN_REVISION' || e.status === 'APROBADO'));
        setHasEvidenceApproved(evidences.some((e: any) => e.status === 'APROBADO'));
      }
    } catch (e) {
      console.error('Error al cargar datos de logros:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'Cuenta CESOFI Creada',
      description: 'Registraste tu empresa en la plataforma CESOFI.',
      points: 50,
      status: 'DESBLOQUEADO',
      date: companyCreatedAt ? new Date(companyCreatedAt).toLocaleDateString() : undefined,
      iconName: 'flag',
      iconLib: 'ionicons',
    },
    {
      id: '2',
      title: 'Folio Vinculado a SIDEC',
      description: 'Conectaste tu Folio de Atención CESOFI para traer tu diagnóstico real.',
      points: 50,
      status: hasFolio ? 'DESBLOQUEADO' : 'BLOQUEADO',
      iconName: 'pricetag',
      iconLib: 'ionicons',
    },
    {
      id: '3',
      title: 'Plan de Mejora Recibido',
      description: 'Tu asesor generó tu diagnóstico y plan de mejora personalizado.',
      points: 100,
      status: hasPlan ? 'DESBLOQUEADO' : 'BLOQUEADO',
      iconName: 'clipboard-check',
      iconLib: 'mci',
    },
    {
      id: '4',
      title: 'Primera Evidencia Cargada',
      description: 'Subiste tu primer documento oficial al expediente digital.',
      points: 100,
      status: evidenceCount > 0 ? 'DESBLOQUEADO' : 'BLOQUEADO',
      iconName: 'file-upload',
      iconLib: 'mci',
    },
    {
      id: '5',
      title: 'Expediente en Dictamen',
      description: 'Tienes al menos un documento en proceso de revisión oficial.',
      points: 100,
      status: hasEvidenceInReview ? 'DESBLOQUEADO' : 'BLOQUEADO',
      iconName: 'shield-checkmark-outline',
      iconLib: 'ionicons',
    },
    {
      id: '6',
      title: 'Documento Aprobado',
      description: 'El comité de dictamen aprobó uno de tus documentos.',
      points: 150,
      status: hasEvidenceApproved ? 'DESBLOQUEADO' : 'BLOQUEADO',
      iconName: 'ribbon',
      iconLib: 'ionicons',
    },
  ];

  const unlockedCount = achievements.filter((a) => a.status === 'DESBLOQUEADO').length;
  const currentLevelIndex = LEVEL_THRESHOLDS.findIndex((l) => l.name === userLevel);
  const nextLevel = LEVEL_THRESHOLDS[currentLevelIndex + 1];
  const levelProgressPercent = nextLevel
    ? Math.min(100, Math.round((userPoints / nextLevel.min) * 100))
    : 100;

  const filteredAchievements = achievements.filter((item) => {
    if (filter === 'DESBLOQUEADOS') return item.status === 'DESBLOQUEADO';
    if (filter === 'BLOQUEADOS') return item.status !== 'DESBLOQUEADO';
    return true;
  });

  const renderIcon = (item: Achievement) => {
    const isUnlocked = item.status === 'DESBLOQUEADO';
    const color = isUnlocked ? '#034123' : '#94A3B8';

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
            {nextLevel ? (
              <>
                <View style={styles.progressTextRow}>
                  <Text style={styles.progressLabel}>
                    Progreso al Nivel {nextLevel.name} ({nextLevel.min} pts)
                  </Text>
                  <Text style={styles.progressPercent}>{levelProgressPercent}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${levelProgressPercent}%` }]} />
                </View>
                <Text style={styles.progressFootnote}>
                  {Math.max(nextLevel.min - userPoints, 0) === 0
                    ? '¡Ya alcanzaste el puntaje para subir de nivel!'
                    : `Te faltan ${nextLevel.min - userPoints} puntos para alcanzar el nivel ${nextLevel.name}.`}
                </Text>
              </>
            ) : (
              <Text style={styles.progressFootnote}>¡Alcanzaste el nivel máximo de la Ruta CESOFI!</Text>
            )}
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
              Desbloqueadas ({unlockedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filter === 'BLOQUEADOS' && styles.activeFilterChip]}
            onPress={() => setFilter('BLOQUEADOS')}
          >
            <Text style={[styles.filterText, filter === 'BLOQUEADOS' && styles.activeFilterText]}>
              En Camino ({achievements.length - unlockedCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Galería de Insignias */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#034123" />
          </View>
        ) : (
        <View style={styles.achievementsList}>
          {filteredAchievements.map((item) => {
            const isUnlocked = item.status === 'DESBLOQUEADO';

            return (
              <View
                key={item.id}
                style={[styles.achievementCard, isUnlocked && styles.unlockedCard]}
              >
                <View style={styles.cardLeftRow}>
                  <View style={[styles.iconBg, isUnlocked && styles.unlockedIconBg]}>
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
        )}

        {/* Sección de Beneficios por Nivel */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Beneficios por Nivel Empresarial</Text>

          <View style={[styles.benefitCard, userLevel === 'Bronce' && styles.benefitCardCurrent]}>
            <View style={styles.benefitHeader}>
              <View style={[styles.badgeDot, { backgroundColor: '#D97706' }]} />
              <Text style={styles.benefitLevelName}>
                Nivel Bronce{userLevel === 'Bronce' ? ' (Actual)' : ''}
              </Text>
              {userLevel === 'Bronce' && <Text style={styles.unlockedTag}>DESBLOQUEADO</Text>}
            </View>
            <Text style={styles.benefitDesc}>
              • Acceso completo a Mi Ruta CESOFI{'\n'}
              • Plantillas y formatos descargables{'\n'}
              • Registro de evidencias y avance
            </Text>
          </View>

          <View style={[styles.benefitCard, userLevel === 'Plata' && styles.benefitCardCurrent, userLevel === 'Bronce' && { opacity: 0.8 }]}>
            <View style={styles.benefitHeader}>
              <View style={[styles.badgeDot, { backgroundColor: '#64748B' }]} />
              <Text style={styles.benefitLevelName}>
                Nivel Plata (500 pts){userLevel === 'Plata' ? ' (Actual)' : ''}
              </Text>
              <Text style={userPoints >= 500 ? styles.unlockedTag : styles.lockedTag}>
                {userPoints >= 500 ? 'DESBLOQUEADO' : 'PRÓXIMAMENTE'}
              </Text>
            </View>
            <Text style={styles.benefitDesc}>
              • 1 Asesoría personalizada 1-a-1 al mes{'\n'}
              • Acceso a talleres y capacitaciones exclusivas{'\n'}
              • Diagnóstico detallado con recomendaciones
            </Text>
          </View>

          <View style={[styles.benefitCard, userLevel === 'Oro' && styles.benefitCardCurrent, userLevel !== 'Oro' && { opacity: 0.6 }]}>
            <View style={styles.benefitHeader}>
              <View style={[styles.badgeDot, { backgroundColor: '#EAB308' }]} />
              <Text style={styles.benefitLevelName}>
                Nivel Oro (1,000 pts){userLevel === 'Oro' ? ' (Actual)' : ''}
              </Text>
              <Text style={userPoints >= 1000 ? styles.unlockedTag : styles.lockedTag}>
                {userPoints >= 1000 ? 'DESBLOQUEADO' : 'PRÓXIMAMENTE'}
              </Text>
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
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
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
  benefitCardCurrent: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
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