import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { BOOKING_URL } from '../config/api';

const steps = [
  {
    icon: 'calendar-outline' as const,
    title: 'Elige día y horario',
    description: 'Selecciona el día y la hora que mejor te acomoden en el calendario del equipo CESOFI.',
  },
  {
    icon: 'mail-outline' as const,
    title: 'Recibe la confirmación',
    description: 'Google Calendar te envía por correo la confirmación con el link de la videollamada de Google Meet.',
  },
  {
    icon: 'videocam-outline' as const,
    title: 'Únete a tu cita',
    description: 'El día y hora acordados, entra al link de Meet desde tu correo para tu asesoría en línea.',
  },
];

export default function CitasScreen() {
  const handleOpenBooking = () => {
    Linking.openURL(BOOKING_URL).catch(() =>
      Alert.alert('Error', 'No se pudo abrir la página de reservas. Intenta de nuevo.')
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBanner}>
          <View style={styles.badgeOfficial}>
            <Ionicons name="videocam-outline" size={16} color="#034123" />
            <Text style={styles.badgeOfficialText}>ASESORÍAS EN LÍNEA</Text>
          </View>
          <Text style={styles.heroTitle}>Agenda tu Asesoría por Google Meet</Text>
          <Text style={styles.heroSubtitle}>
            Las citas con el equipo CESOFI son videollamadas, no presenciales. Elige tu horario y
            recibirás el link para conectarte.
          </Text>
        </View>

        <View style={styles.stepsList}>
          {steps.map((step, index) => (
            <View key={step.title} style={styles.stepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.stepIconBg}>
                <Ionicons name={step.icon} size={20} color="#034123" />
              </View>
              <View style={styles.stepTextContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.bookButton} onPress={handleOpenBooking}>
          <Ionicons name="calendar-sharp" size={18} color="#FFFFFF" />
          <Text style={styles.bookButtonText}>Agendar mi Cita</Text>
          <Ionicons name="open-outline" size={16} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.importantBox}>
          <Ionicons name="information-circle-outline" size={20} color="#B45309" style={{ marginRight: 10 }} />
          <Text style={styles.importantText}>
            Se abrirá el calendario de reservas de CESOFI en tu navegador. Revisa tu correo para
            confirmar tu horario y obtener el link de la videollamada.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  heroBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeOfficial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6F4EA',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 12,
  },
  badgeOfficialText: { fontSize: 10, fontWeight: 'bold', color: '#034123', letterSpacing: 0.5 },
  heroTitle: { fontSize: 20, fontWeight: 'bold', color: '#0F172A', marginBottom: 6 },
  heroSubtitle: { fontSize: 13, color: '#64748B', lineHeight: 19 },
  stepsList: { gap: 12, marginBottom: 20 },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#034123',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepNumberText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  stepIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepTextContent: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: 'bold', color: '#0F172A', marginBottom: 2 },
  stepDescription: { fontSize: 12, color: '#64748B', lineHeight: 17 },
  bookButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#034123',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 16,
  },
  bookButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  importantBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  importantText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17 },
});
