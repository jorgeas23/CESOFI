import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Header } from '../components/Header';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export default function AyudaScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('1');

  // Estados del Formulario de Mensaje
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const faqs: FAQItem[] = [
    {
      id: '1',
      category: 'Evidencias',
      question: '¿Cómo subo mis evidencias de cumplimiento?',
      answer:
        'Ingresa a la sección "Evidencias" desde el menú principal, selecciona la actividad correspondiente y presiona el botón "Subir Documento". Aceptamos formatos PDF, JPG y PNG de hasta 10MB.',
    },
    {
      id: '2',
      category: 'Niveles y Puntos',
      question: '¿Qué beneficios obtengo al subir de nivel empresarial?',
      answer:
        'Al acumular puntos por completar actividades de la Ruta CESOFI, subes del nivel Bronce al Plata u Oro. Esto te otorga asesorías 1 a 1 sin costo, certificaciones oficiales y vinculación prioritaria con programas de crédito.',
    },
    {
      id: '3',
      category: 'Evidencias',
      question: '¿Qué hago si mi evidencia fue rechazada?',
      answer:
        'Entra a la sección "Evidencias" y presiona la tarjeta del documento rechazado para leer la retroalimentación del asesor. Corrige el archivo indicado y presiona "Reenviar Evidencia".',
    },
    {
      id: '4',
      category: 'Asesorías',
      question: '¿Cómo agendo una asesoría con un especialista CESOFI?',
      answer:
        'Accede al módulo de "Citas y Asesorías", elige el área temática que necesitas consultar (Fiscal, Financiera, Plan de Negocios) y selecciona el día y horario que mejor se adapte a tu agenda.',
    },
    {
      id: '5',
      category: 'Cuenta',
      question: '¿Puedo actualizar el RFC o nombre de mi empresa?',
      answer:
        'Sí. Ve al menú lateral, selecciona "Mi empresa" y presiona el botón "Editar". Podrás actualizar tu RFC, teléfono, dirección y representante legal.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAccordion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleOpenWhatsApp = () => {
    Linking.openURL('https://wa.me/529818114419?text=Hola,%20necesito%20soporte%20con%20mi%20cuenta%20CESOFI.');
  };

  const handleOpenEmail = () => {
    Linking.openURL('mailto:solucionesfinancieras@campeche.gob.mx?subject=Consulta%20Plataforma%20CESOFI');
  };

  const handleOpenPhone = () => {
    Linking.openURL('tel:9818114419');
  };

  const handleSendMessage = () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Campos incompletos', 'Por favor ingresa el asunto y el mensaje.');
      return;
    }

    setSending(true);
    setTimeout(() => {
      setSending(false);
      Alert.alert(
        '¡Mensaje Enviado!',
        'Tu consulta ha sido enviada al equipo de soporte de CESOFI. Te responderemos por correo a la brevedad.'
      );
      setSubject('');
      setMessage('');
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Hero */}
          <View style={styles.heroSection}>
            <View style={styles.heroBadge}>
              <Ionicons name="help-buoy-outline" size={20} color="#034123" />
              <Text style={styles.heroBadgeText}>Centro de Ayuda CESOFI</Text>
            </View>
            <Text style={styles.heroTitle}>¿En qué te podemos ayudar?</Text>
            <Text style={styles.heroSubtitle}>
              Encuentra soluciones rápidas o comunícate directamente con nuestro equipo técnico.
            </Text>

            {/* Buscador */}
            <View style={styles.searchWrapper}>
              <Ionicons name="search-outline" size={20} color="#64748B" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar duda, evidencia, asesoría..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Canales de Atención Rápida */}
          <Text style={styles.sectionHeading}>Canales de Atención Directa</Text>
          <View style={styles.channelsRow}>
            <TouchableOpacity style={styles.channelCard} onPress={handleOpenWhatsApp}>
              <View style={[styles.channelIconBg, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#16A34A" />
              </View>
              <Text style={styles.channelTitle}>WhatsApp</Text>
              <Text style={styles.channelSubtitle}>Respuesta rápida</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.channelCard} onPress={handleOpenEmail}>
              <View style={[styles.channelIconBg, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="mail-outline" size={24} color="#0284C7" />
              </View>
              <Text style={styles.channelTitle}>Correo</Text>
              <Text style={styles.channelSubtitle}>Soporte técnico</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.channelCard} onPress={handleOpenPhone}>
              <View style={[styles.channelIconBg, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="call-outline" size={24} color="#D97706" />
              </View>
              <Text style={styles.channelTitle}>Teléfono</Text>
              <Text style={styles.channelSubtitle}>Llama gratis</Text>
            </TouchableOpacity>
          </View>

          {/* Preguntas Frecuentes (Acordeón) */}
          <Text style={styles.sectionHeading}>Preguntas Frecuentes (FAQ)</Text>
          <View style={styles.faqList}>
            {filteredFaqs.length === 0 ? (
              <View style={styles.emptyFaq}>
                <Ionicons name="document-text-outline" size={36} color="#CBD5E1" />
                <Text style={styles.emptyFaqText}>
                  No se encontraron preguntas que coincidan con tu búsqueda.
                </Text>
              </View>
            ) : (
              filteredFaqs.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <View key={item.id} style={styles.faqCard}>
                    <TouchableOpacity
                      style={styles.faqHeader}
                      onPress={() => toggleAccordion(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.faqQuestionGroup}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>{item.category}</Text>
                        </View>
                        <Text style={styles.faqQuestionText}>{item.question}</Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#64748B"
                      />
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.faqAnswerBox}>
                        <Text style={styles.faqAnswerText}>{item.answer}</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>

          {/* Formulario de Mensaje Directo */}
          <View style={styles.contactFormCard}>
            <Text style={styles.formCardTitle}>¿No encontraste respuesta?</Text>
            <Text style={styles.formCardSubtitle}>
              Envíanos un mensaje directo y un asesor de CESOFI te contactará en breve.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Asunto de tu consulta *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Problema con mi documento de evidencia"
                placeholderTextColor="#94A3B8"
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mensaje o detalle de la duda *</Text>
              <TextInput
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Describe brevemente lo que necesitas..."
                placeholderTextColor="#94A3B8"
                value={message}
                onChangeText={setMessage}
                multiline
              />
            </View>

            <TouchableOpacity
              style={[styles.sendButton, { opacity: sending ? 0.7 : 1 }]}
              onPress={handleSendMessage}
              disabled={sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.sendButtonText}>Enviar Consulta</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  heroSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6F4EA',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 12,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#034123',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#0F172A',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  channelsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  channelCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  channelIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  channelTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  channelSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  faqList: {
    gap: 10,
    marginBottom: 24,
  },
  emptyFaq: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyFaqText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  faqQuestionGroup: {
    flex: 1,
    marginRight: 10,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  faqAnswerBox: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  faqAnswerText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  contactFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  formCardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  formCardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  sendButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#034123',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 6,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});