import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';

/**
 * Hook que envuelve la navegación con un overlay de carga.
 * Muestra la pantalla de carga ~400ms antes de navegar,
 * dando sensación de fluidez entre pantallas.
 */
export function useNavigateWithLoading() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Cargando...');

  const navigate = useCallback(
    (route: string, message: string = 'Cargando...') => {
      setLoadingMessage(message);
      setLoading(true);

      // Pequeño delay para que la animación se vea antes de la transición
      setTimeout(() => {
        setLoading(false);
        router.push(route as any);
      }, 500);
    },
    [router]
  );

  const replace = useCallback(
    (route: string, message: string = 'Cargando...') => {
      setLoadingMessage(message);
      setLoading(true);

      setTimeout(() => {
        setLoading(false);
        router.replace(route as any);
      }, 600);
    },
    [router]
  );

  return { loading, loadingMessage, navigate, replace };
}
