// src/lib/supabase.js - CORREGIDO
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Faltan credenciales de Supabase");
}

// SOLUCIÓN AL ERROR 406: Configurar headers correctos
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      // Esto soluciona el error 406
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  db: {
    schema: "public",
  },
  // Configuración para mejor manejo de errores en móvil
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Helper para manejar errores de manera consistente
export const handleSupabaseError = (error, context = "") => {
  console.error(`❌ Supabase Error [${context}]:`, error);

  // Errores comunes y sus mensajes amigables
  const errorMessages = {
    406: "Error de configuración del servidor",
    401: "Sesión expirada, por favor inicia sesión nuevamente",
    403: "No tienes permisos para realizar esta acción",
    404: "Recurso no encontrado",
    500: "Error del servidor, intenta más tarde",
  };

  const statusCode = error?.code || error?.status?.toString();
  return errorMessages[statusCode] || "Error al conectar con el servidor";
};
