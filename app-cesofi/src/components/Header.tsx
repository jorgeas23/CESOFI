import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomDrawer } from './CustomDrawer';
import { API_URL } from '../config/api';

const logoImg = require('../../assets/logo.png');
const LAST_SEEN_KEY = 'notifications_last_seen_at';

interface HeaderProps {
  userInitials?: string;
  userName?: string;
  userCompany?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  status: 'APROBADO' | 'RECHAZADO';
  feedback?: string | null;
  updatedAt: string;
}

export const Header: React.FC<HeaderProps> = ({
  userInitials: propInitials,
  userName: propName,
  userCompany: propCompany,
}) => {
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [notifPanelVisible, setNotifPanelVisible] = useState(false);
  const [userName, setUserName] = useState<string>(propName || '');
  const [userCompany, setUserCompany] = useState<string>(propCompany || '');
  const [userInitials, setUserInitials] = useState<string>(propInitials || '');

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedName = propName || (await AsyncStorage.getItem('userName')) || 'Usuario';
        const storedCompany = propCompany || (await AsyncStorage.getItem('userCompany')) || 'Empresa CESOFI';
        setUserName(storedName);
        setUserCompany(storedCompany);

        if (propInitials) {
          setUserInitials(propInitials);
        } else if (storedName) {
          const nameParts = storedName.trim().split(' ').filter(Boolean);
          if (nameParts.length >= 2) {
            setUserInitials(`${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase());
          } else if (nameParts.length === 1) {
            setUserInitials(nameParts[0].substring(0, 2).toUpperCase());
          } else {
            setUserInitials('U');
          }
        }
      } catch (error) {
        console.error('Error al cargar datos del usuario en Header:', error);
      }
    };

    loadUserData();
  }, [propName, propCompany, propInitials, drawerVisible]);

  // Notificaciones reales: evidencias con dictamen (aprobadas o rechazadas)
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        // Un admin no tiene empresa ni evidencias propias — nada que notificarle aquí.
        const role = await AsyncStorage.getItem('userRole');
        if (role === 'ADMIN') return;

        const response = await fetch(`${API_URL}/api/evidence`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;

        const data = await response.json();
        const dictaminadas: NotificationItem[] = (data.evidences || [])
          .filter((e: any) => e.status === 'APROBADO' || e.status === 'RECHAZADO')
          .map((e: any) => ({
            id: e.id,
            title: e.title,
            status: e.status,
            feedback: e.feedback,
            updatedAt: e.updatedAt,
          }))
          .sort((a: NotificationItem, b: NotificationItem) => (a.updatedAt < b.updatedAt ? 1 : -1));

        setNotifications(dictaminadas);

        const lastSeenAt = await AsyncStorage.getItem(LAST_SEEN_KEY);
        const unseen = lastSeenAt
          ? dictaminadas.filter((n) => new Date(n.updatedAt).getTime() > new Date(lastSeenAt).getTime())
          : dictaminadas;
        setUnseenCount(unseen.length);
      } catch (error) {
        console.error('Error al cargar notificaciones:', error);
      }
    };

    loadNotifications();
  }, []);

  const handleOpenNotifications = async () => {
    setNotifPanelVisible(true);
    setUnseenCount(0);
    await AsyncStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
  };

  const handleNotificationPress = (id: string) => {
    setNotifPanelVisible(false);
    router.push('/evidencias');
  };

  return (
    <>
      <View style={styles.headerContainer}>
        {/* Ícono de tres líneas (ÚNICO QUE ABRE EL MENÚ) */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setDrawerVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="menu-outline" size={28} color="#034123" />
        </TouchableOpacity>

        {/* Logo de CESOFI: toca para ir al Dashboard */}
        <TouchableOpacity onPress={() => router.push('/')} activeOpacity={0.7}>
          <Image source={logoImg} style={styles.logoImage} resizeMode="contain" />
        </TouchableOpacity>

        {/* Lado derecho: Notificaciones y Avatar */}
        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={handleOpenNotifications}>
            <Ionicons name="notifications-outline" size={24} color="#034123" />
            {unseenCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unseenCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Avatar del usuario: toca para ir a Mi Empresa */}
          <TouchableOpacity onPress={() => router.push('/mi-empresa')} activeOpacity={0.7}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{userInitials || 'U'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Panel de Notificaciones */}
      <Modal
        visible={notifPanelVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setNotifPanelVisible(false)}
      >
        <TouchableOpacity
          style={styles.notifOverlay}
          activeOpacity={1}
          onPress={() => setNotifPanelVisible(false)}
        >
          <View style={styles.notifPanel}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>Notificaciones</Text>
              <TouchableOpacity onPress={() => setNotifPanelVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {notifications.length === 0 ? (
              <View style={styles.notifEmpty}>
                <Ionicons name="checkmark-done-outline" size={28} color="#94A3B8" />
                <Text style={styles.notifEmptyText}>
                  Aún no hay dictámenes de evidencias para mostrar.
                </Text>
              </View>
            ) : (
              notifications.map((item) => {
                const isApproved = item.status === 'APROBADO';
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.notifItem}
                    onPress={() => handleNotificationPress(item.id)}
                  >
                    <Ionicons
                      name={isApproved ? 'checkmark-circle' : 'alert-circle'}
                      size={20}
                      color={isApproved ? '#15803D' : '#DC2626'}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifItemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.notifItemSubtitle} numberOfLines={2}>
                        {isApproved
                          ? 'Tu evidencia fue aprobada.'
                          : item.feedback || 'Tu evidencia fue rechazada. Revisa la retroalimentación.'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Drawer desplegable */}
      <CustomDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        userInitials={userInitials || 'U'}
        user={{
          name: userName,
          company: userCompany,
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logoImage: {
    width: 90,
    height: 48,
  },
  iconButton: {
    padding: 4,
    position: 'relative',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#DC2626',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#034123',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  notifOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    alignItems: 'flex-end',
  },
  notifPanel: {
    marginTop: 64,
    marginRight: 12,
    width: 320,
    maxWidth: '90%',
    maxHeight: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  notifEmpty: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  notifEmptyText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  notifItemTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  notifItemSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
});
