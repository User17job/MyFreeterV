// src/App.jsx - CON TEMA Y AUTH FUNCIONANDO
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { Settings } from "@/pages/Settings";

function App() {
  const { user, loading, initialize } = useAuthStore();
  const initTheme = useThemeStore((state) => state.initTheme);

  // Inicializar auth y tema
  useEffect(() => {
    console.log("🔵 Inicializando app...");
    initialize();
    initTheme();
  }, [initialize, initTheme]);

  // Mostrar loader mientras verifica la sesión
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-brown border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando MyFreeterV...</p>
        </div>
      </div>
    );
  }

  // Si hay error de configuración, mostrar mensaje
  if (
    !import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_ANON_KEY
  ) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">
            Configuración requerida
          </h1>
          <p className="text-gray-400 mb-6">
            Para usar MyFreeterV, necesitas configurar las credenciales de
            Supabase.
          </p>
          <div className="bg-dark-secondary p-4 rounded-lg text-left">
            <p className="text-sm text-gray-300 mb-2">
              Crea un archivo .env con:
            </p>
            <code className="text-xs text-orange-brown">
              VITE_SUPABASE_URL=tu_url_aqui
              <br />
              VITE_SUPABASE_ANON_KEY=tu_key_aqui
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Login - redirige a dashboard si ya está autenticado */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        {/* Dashboard - protegido */}
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" replace />}
        />

        {/* Settings - protegido */}
        <Route
          path="/settings"
          element={user ? <Settings /> : <Navigate to="/login" replace />}
        />

        {/* Redireccionamientos */}
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
