function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} no está configurado en las variables de entorno`);
  }
  return value;
}

export const JWT_SECRET = required('JWT_SECRET');
export const SUPABASE_URL = required('SUPABASE_URL');
export const SUPABASE_SECRET_KEY = required('SUPABASE_SECRET_KEY');
export const SUPABASE_EVIDENCE_BUCKET = process.env.SUPABASE_EVIDENCE_BUCKET || 'evidencias';
