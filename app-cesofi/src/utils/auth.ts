import AsyncStorage from '@react-native-async-storage/async-storage';

// Decodifica el payload de un JWT (sin verificar la firma, solo para leer "exp" en cliente)
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const payload = token.split('.')[1];
    const json = decodeURIComponent(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove(['token', 'userName', 'userCompany', 'userRole']);
}
