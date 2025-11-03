// src/App.jsx - MEJORADO
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useTabsStore } from "@/store/tabsStore";
import { useWidgetStore } from "@/store/widgetStore";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { Settings } from "@/pages/Settings";

function App() {
  const { user, loading, error, initialize, isInitialized } = useAuthStore();
  const initTheme = useThemeStore((state) => state.initTheme);
  const resetTabs = useTabsStore((state) => state.reset);
  const resetWidgets = useWidgetStore((state) => state.reset);
  const [appReady, setAppReady] = useState(false);

  // Inicializar auth y tema
  useEffect(() => {
    console.log("🔵 Inicializando app...");

    const init = async () => {
      try {
        await initialize();
        initTheme();
        setAppReady(true);
      } catch (error) {
        console.error("❌ Error inicializando app:", error);
        setAppReady(true); // Continuar de todos modos
      }
    };

    init();
  }, [initialize, initTheme]);

  // Limpiar stores cuando el usuario cierra sesión
  useEffect(() => {
    if (!user && isInitialized) {
      console.log("🧹 Limpiando stores (logout)");
      resetTabs();
      resetWidgets();
    }
  }, [user, isInitialized, resetTabs, resetWidgets]);

  // Mostrar loader mientras verifica la sesión
  if (loading || !appReady) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-brown border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando MyFreeterV...</p>
        </div>
      </div>
    );
  }

  // Mostrar error de autenticación si existe
  if (error && !user) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Error de Conexión
          </h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-orange-brown text-white rounded-lg hover:bg-orange-brown/80 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Validar configuración de Supabase
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
            <code className="text-xs text-orange-brown block">
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
