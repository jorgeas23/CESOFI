// Host del backend. En producción o al probar en un dispositivo físico,
// define EXPO_PUBLIC_API_URL (localhost no resuelve al equipo de desarrollo).
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

// Página de reservas de Google Calendar del equipo CESOFI: ahí el empresario
// elige día/hora y Google genera y envía la confirmación con el link de Meet.
export const BOOKING_URL =
  process.env.EXPO_PUBLIC_BOOKING_URL || 'https://calendar.app.google/3tBfxev2We6KB5ZPA';
