import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoadingOverlay } from './LoadingOverlay';
import { useNavigateWithLoading } from '../hooks/useNavigateWithLoading';

interface CustomDrawerProps {
  visible: boolean;
  onClose: () => void;
  activeScreen?: string;
  userInitials?: string;
  user?: {
    name?: string;
    company?: string;
  };
}

export const CustomDrawer: React.FC<CustomDrawerProps> = ({
  visible,
  onClose,
  activeScreen = 'index',
  userInitials: propInitials,
  user: propUser,
}) => {
  const router = useRouter();
  const { loading, loadingMessage, navigate } = useNavigateWithLoading();
  const [userName, setUserName] = useState<string>(propUser?.name || '');
  const [userCompany, setUserCompany] = useState<string>(propUser?.company || '');
  const [userInitials, setUserInitials] = useState<string>(propInitials || '');

  useEffect(() => {
    if (visible) {
      const loadUserData = async () => {
        try {
          const storedName = propUser?.name || (await AsyncStorage.getItem('userName')) || 'Usuario';
          const storedCompany = propUser?.company || (await AsyncStorage.getItem('userCompany')) || 'Empresa CESOFI';
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
          console.error('Error al cargar usuario en CustomDrawer:', error);
        }
      };

      loadUserData();
    }
  }, [visible, propUser, propInitials]);

  // Lista de opciones actualizada con "Mi empresa" y mejor ícono para "Mis logros"
  const menuItems = [
    { id: 'index', label: 'Dashboard', lib: 'ionicons', icon: 'home-outline', route: '/' },
    { id: 'mi-empresa', label: 'Mi empresa', lib: 'ionicons', icon: 'business-outline', route: '/mi-empresa' },
    { id: 'ruta', label: 'Mi ruta', lib: 'fa5', icon: 'route', route: '/ruta' },
    { id: 'evidencias', label: 'Evidencias', lib: 'ionicons', icon: 'folder-outline', route: '/evidencias' },
    { id: 'citas', label: 'Citas y Asesorías', lib: 'ionicons', icon: 'calendar-outline', route: '/citas' },
    { id: 'capacitaciones', label: 'Capacitaciones', lib: 'ionicons', icon: 'school-outline', route: '/capacitaciones' },
    { id: 'logros', label: 'Mis logros', lib: 'ionicons', icon: 'ribbon-outline', route: '/logros' },
    { id: 'ayuda', label: 'Ayuda', lib: 'ionicons', icon: 'help-circle-outline', route: '/ayuda' },
  ];

  const moduleLabels: Record<string, string> = {
    '/': 'Cargando Dashboard...',
    '/mi-empresa': 'Cargando Mi Empresa...',
    '/ruta': 'Cargando Mi Ruta...',
    '/evidencias': 'Cargando Evidencias...',
    '/citas': 'Cargando Citas y Asesorías...',
    '/capacitaciones': 'Cargando Capacitaciones...',
    '/logros': 'Cargando Mis Logros...',
    '/ayuda': 'Cargando Ayuda...',
  };

  const handleNavigation = (route: string) => {
    onClose();
    const message = moduleLabels[route] || 'Cargando...';
    navigate(route, message);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'userName', 'userCompany']);
    } catch (e) {
      console.error('Error al limpiar storage en logout:', e);
    }
    onClose();
    router.replace('/login');
  };

  const renderIcon = (item: typeof menuItems[0], isActive: boolean) => {
    const iconColor = isActive ? '#034123' : '#64748B';
    const size = 20;

    if (item.lib === 'fa5') {
      return <FontAwesome5 name={item.icon as any} size={18} color={iconColor} style={styles.iconStyle} />;
    }
    if (item.lib === 'mci') {
      return <MaterialCommunityIcons name={item.icon as any} size={20} color={iconColor} style={styles.iconStyle} />;
    }
    return <Ionicons name={item.icon as any} size={size} color={iconColor} style={styles.iconStyle} />;
  };

  return (
    <>
      {/* Overlay de carga al navegar entre módulos */}
      <LoadingOverlay visible={loading} message={loadingMessage} />
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.drawerContainer}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* Header Perfil */}
            <View style={styles.userHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{userInitials || 'U'}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {userName || 'Usuario'}
                </Text>
                <Text style={styles.userCompany} numberOfLines={1}>
                  {userCompany || 'Empresa CESOFI'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Menú Scroll */}
            <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
              {menuItems.map((item) => {
                const isActive = activeScreen === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.menuItem, isActive && styles.activeMenuItem]}
                    onPress={() => handleNavigation(item.route)}
                  >
                    {renderIcon(item, isActive)}
                    <Text style={[styles.menuText, isActive && styles.activeMenuText]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Cerrar Sesión */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
    </>
  );
};

export default CustomDrawer;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
  },
  drawerContainer: {
    width: '80%',
    maxWidth: 300,
    backgroundColor: '#FFFFFF',
    height: '100%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#034123',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  userCompany: {
    fontSize: 12,
    color: '#64748B',
  },
  closeButton: {
    padding: 4,
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  activeMenuItem: {
    backgroundColor: '#ECFDF5',
  },
  iconStyle: {
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 12,
    fontWeight: '500',
  },
  activeMenuText: {
    color: '#034123',
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
});