import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomDrawer } from './CustomDrawer';

const logoImg = require('../../assets/logo.png');

interface HeaderProps {
  userInitials?: string;
  userName?: string;
  userCompany?: string;
  notificationCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  userInitials: propInitials,
  userName: propName,
  userCompany: propCompany,
  notificationCount = 2,
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [userName, setUserName] = useState<string>(propName || '');
  const [userCompany, setUserCompany] = useState<string>(propCompany || '');
  const [userInitials, setUserInitials] = useState<string>(propInitials || '');

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

        {/* Logo de CESOFI */}
        <Image source={logoImg} style={styles.logoImage} resizeMode="contain" />

        {/* Lado derecho: Notificaciones y Avatar */}
        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={24} color="#034123" />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Avatar del usuario */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{userInitials || 'U'}</Text>
          </View>
        </View>
      </View>

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
});