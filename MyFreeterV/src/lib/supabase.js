// src/lib/supabase.js - VERIFICAR CONEXIÓN
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar que las credenciales existen
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ ERROR: Faltan las credenciales de Supabase en el archivo .env"
  );
  console.error("Por favor configura:");
  console.error("VITE_SUPABASE_URL=tu_url_aqui");
  console.error("VITE_SUPABASE_ANON_KEY=tu_key_aqui");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Test de conexión (solo en desarrollo)
if (import.meta.env.DEV) {
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error("❌ Error conectando a Supabase:", error.message);
    } else {
      console.log("✅ Supabase conectado correctamente");
      if (data.session) {
        console.log("👤 Usuario:", data.session.user.email);
      }
    }
  });
}
