import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
} from 'react-native';

const logoImg = require('../../assets/logo.png');

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Cargando...',
}) => {
  // Animación de opacidad general (fade in / out)
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animación de los 3 puntos (dots)
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  // Animación del logo (escala suave pulsante)
  const logoScale = useRef(new Animated.Value(1)).current;

  // Rotación del anillo exterior
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in del overlay
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Pulso del logo
      const logoPulse = Animated.loop(
        Animated.sequence([
          Animated.timing(logoScale, {
            toValue: 1.06,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      logoPulse.start();

      // Rotación del spinner
      const spin = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spin.start();

      // Animación de los puntos en cascada
      const animateDots = () => {
        const dotAnim = (dot: Animated.Value, delay: number) =>
          Animated.loop(
            Animated.sequence([
              Animated.delay(delay),
              Animated.timing(dot, {
                toValue: 1,
                duration: 350,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(dot, {
                toValue: 0,
                duration: 350,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.delay(700 - delay),
            ])
          );
        Animated.parallel([
          dotAnim(dot1, 0),
          dotAnim(dot2, 200),
          dotAnim(dot3, 400),
        ]).start();
      };
      animateDots();

      return () => {
        logoPulse.stop();
        spin.stop();
        dot1.stopAnimation();
        dot2.stopAnimation();
        dot3.stopAnimation();
        logoScale.setValue(1);
        spinAnim.setValue(0);
        dot1.setValue(0);
        dot2.setValue(0);
        dot3.setValue(0);
      };
    } else {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const dotStyle = (dot: Animated.Value) => ({
    opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [
      {
        translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }),
      },
    ],
  });

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={styles.card}>
          {/* Anillo spinner exterior */}
          <View style={styles.spinnerWrapper}>
            <Animated.View
              style={[styles.spinnerRing, { transform: [{ rotate: spin }] }]}
            />
            {/* Logo con pulso */}
            <Animated.View
              style={[styles.logoWrapper, { transform: [{ scale: logoScale }] }]}
            >
              <Image source={logoImg} style={styles.logo} resizeMode="contain" />
            </Animated.View>
          </View>

          {/* Mensaje */}
          <Text style={styles.message}>{message}</Text>

          {/* Dots animados */}
          <View style={styles.dotsRow}>
            <Animated.View style={[styles.dot, dotStyle(dot1)]} />
            <Animated.View style={[styles.dot, dotStyle(dot2)]} />
            <Animated.View style={[styles.dot, dotStyle(dot3)]} />
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

export default LoadingOverlay;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    minWidth: 220,
  },
  spinnerWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  spinnerRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#034123',
    borderRightColor: '#A7F3D0',
  },
  logoWrapper: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 35,
    padding: 8,
  },
  logo: {
    width: 52,
    height: 52,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 14,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#034123',
  },
});
