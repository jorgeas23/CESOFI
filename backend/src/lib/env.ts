function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} no está configurado en las variables de entorno`);
  }
  return value;
}

required('DATABASE_URL');

export const JWT_SECRET = required('JWT_SECRET');
export const SUPABASE_URL = required('SUPABASE_URL');
export const SUPABASE_SECRET_KEY = required('SUPABASE_SECRET_KEY');
export const SUPABASE_EVIDENCE_BUCKET = process.env.SUPABASE_EVIDENCE_BUCKET || 'evidencias';

// API externa del Sistema de Diagnóstico Financiero (compañero/SEDECO). Opcional: si no está
// configurada, el endpoint /api/ruta responde indicando que la integración aún no está lista,
// en vez de tumbar el servidor completo.
export const DIAGNOSTICO_API_URL = process.env.DIAGNOSTICO_API_URL || '';
export const DIAGNOSTICO_API_KEY = process.env.DIAGNOSTICO_API_KEY || '';

// Llave que el Sistema de Diagnóstico debe mandar como X-API-Key al empujarnos
// un caso (POST /api/externo/casos). Es nuestra, la generamos y se la damos a
// ellos — no confundir con DIAGNOSTICO_API_KEY, que es la de ELLOS para cuando
// nosotros les llamamos a su API (pull). Sin configurar, el receptor rechaza
// todo con 401 (nunca deja pasar una petición sin llave que verificar).
export const RECEPTOR_API_KEY = process.env.RECEPTOR_API_KEY || '';
