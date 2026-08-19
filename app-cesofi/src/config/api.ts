// Host del backend. En producción o al probar en un dispositivo físico,
// define EXPO_PUBLIC_API_URL (localhost no resuelve al equipo de desarrollo).
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
