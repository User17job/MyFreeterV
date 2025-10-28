// ============================================
// 4. TOP BAR ACTUALIZADO
// src/components/dashboard/TopBar.jsx
// ============================================

import { LogOut, Settings, Moon, Sun, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { Button } from "@/components/ui/Button";
import { BellNotifications } from "./BellNotifications";

export function TopBar() {
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  const userName =
    user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuario";

  return (
    <div className="h-16 bg-dark-secondary dark:bg-dark-secondary border-b border-gray-800 dark:border-gray-800 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-10 w-10 object-contain"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <h1 className="text-xl font-bold text-white">MyFreeterV</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <User size={18} />
          <span className="font-medium text-white">{userName}</span>
        </div>

        {/* Campana de notificaciones */}
        <BellNotifications />

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-dark-tertiary text-gray-400 hover:text-white transition-colors"
          title={isDarkMode ? "Modo claro" : "Modo oscuro"}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button
          onClick={handleSettings}
          className="p-2 rounded-lg hover:bg-dark-tertiary text-gray-400 hover:text-white transition-colors"
          title="Configuración"
        >
          <Settings size={20} />
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut size={18} />
          Salir
        </Button>
      </div>
    </div>
  );
}

// ============================================
// DEMO INTERACTIVO
// ============================================

import { useState, useEffect } from "react";

function NotificationDemo() {
  const [demoEvents] = useState([
    {
      id: 1,
      title: "Reunión importante",
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: 2,
      title: "Cita médica",
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  ]);

  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  const handleAddCalendarNotification = () => {
    addNotification({
      type: "calendar",
      title: "Reunión de equipo",
      message: "Evento mañana a las 10:00 AM",
      icon: "📅",
    });
  };

  const handleAddTimerNotification = () => {
    addNotification({
      type: "timer",
      title: "⏰ Temporizador completado",
      message: "Pomodoro de 25 minutos",
      icon: "⏰",
    });
  };

  const handleAddTaskNotification = () => {
    addNotification({
      type: "task",
      title: "Completar proyecto",
      message: "Recordatorio de tarea",
      icon: "✅",
    });
  };

  return (
    <div className="min-h-screen bg-dark-primary text-white">
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Sistema de Notificaciones</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Panel de Demo */}
          <div className="bg-dark-secondary p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">
              🧪 Probar Notificaciones
            </h2>
            <div className="space-y-3">
              <button
                onClick={handleAddCalendarNotification}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-3"
              >
                <span className="text-2xl">📅</span>
                <div className="text-left">
                  <div className="font-medium">Evento de Calendario</div>
                  <div className="text-xs text-blue-200">
                    Simular evento próximo
                  </div>
                </div>
              </button>

              <button
                onClick={handleAddTimerNotification}
                className="w-full px-4 py-3 bg-orange hover:bg-orange/80 rounded-lg transition-colors flex items-center gap-3"
              >
                <span className="text-2xl">⏰</span>
                <div className="text-left">
                  <div className="font-medium">Timer Completado</div>
                  <div className="text-xs text-orange-200">
                    Simular fin de timer
                  </div>
                </div>
              </button>

              <button
                onClick={handleAddTaskNotification}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-3"
              >
                <span className="text-2xl">✅</span>
                <div className="text-left">
                  <div className="font-medium">Recordatorio de Tarea</div>
                  <div className="text-xs text-green-200">Simular reminder</div>
                </div>
              </button>
            </div>
          </div>

          {/* Características */}
          <div className="bg-dark-secondary p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">✨ Características</h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-orange">•</span>
                <span>
                  <strong>Eventos cercanos:</strong> Notifica eventos a 2 días o
                  menos
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange">•</span>
                <span>
                  <strong>Timer completo:</strong> Aviso cuando termina el
                  temporizador
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange">•</span>
                <span>
                  <strong>Badge animado:</strong> Contador visible de no leídas
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange">•</span>
                <span>
                  <strong>Persistencia:</strong> Las notificaciones se guardan
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange">•</span>
                <span>
                  <strong>Configuración:</strong> Activar/desactivar por tipo
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange">•</span>
                <span>
                  <strong>Browser notifications:</strong> Notificaciones del SO
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-dark-secondary p-6 rounded-lg border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">
            📋 Integración en tu proyecto
          </h2>
          <div className="space-y-4 text-gray-300 text-sm">
            <div>
              <h3 className="font-semibold text-white mb-2">
                1. Crear el store de notificaciones:
              </h3>
              <code className="block bg-dark-tertiary p-3 rounded text-xs">
                src/store/notificationStore.js
              </code>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">
                2. Crear utilidades:
              </h3>
              <code className="block bg-dark-tertiary p-3 rounded text-xs">
                src/utils/notificationUtils.js
              </code>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">
                3. Crear componente BellNotifications:
              </h3>
              <code className="block bg-dark-tertiary p-3 rounded text-xs">
                src/components/dashboard/BellNotifications.jsx
              </code>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">
                4. Actualizar TopBar:
              </h3>
              <code className="block bg-dark-tertiary p-3 rounded text-xs">
                Importar y agregar {`<BellNotifications />`}
              </code>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">
                5. En CalendarWidget:
              </h3>
              <code className="block bg-dark-tertiary p-3 rounded text-xs overflow-x-auto whitespace-pre">
                {`import { notifyCalendarEvent } from '@/utils/notificationUtils';

// Verificar eventos próximos
useEffect(() => {
  if (!isGlobalCalendar) return;
  
  events.forEach(event => {
    const eventDate = new Date(event.start_time);
    const today = new Date();
    const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntil >= 0 && daysUntil <= 2) {
      notifyCalendarEvent(event, daysUntil);
    }
  });
}, [events, isGlobalCalendar]);`}
              </code>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">
                6. En Settings, sincronizar:
              </h3>
              <code className="block bg-dark-tertiary p-3 rounded text-xs overflow-x-auto whitespace-pre">
                {`import { useNotificationStore } from '@/store/notificationStore';

const { settings, updateSettings } = useNotificationStore();

// Usar settings.calendar, settings.timer, settings.tasks`}
              </code>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>
            💡 Haz clic en la campanita arriba (↗️) para ver las notificaciones
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotificationDemo;
