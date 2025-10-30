// ============================================
// 3. COMPONENTE BELL NOTIFICATIONS
// src/components/dashboard/BellNotifications.jsx
// ============================================

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function BellNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationStore();

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getNotificationIcon = (type) => {
    const icons = {
      calendar: "📅",
      timer: "⏰",
      task: "✅",
    };
    return icons[type] || "🔔";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-dark-tertiary text-gray-400 hover:text-white transition-colors"
        title="Notificaciones"
      >
        <Bell size={20} />

        {/* Badge de contador */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-dark-secondary border border-gray-800 rounded-lg shadow-xl z-50 max-h-[500px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Bell size={18} />
              Notificaciones
              {unreadCount > 0 && (
                <span className="text-xs bg-orange px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h3>

            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-orange hover:text-orange/80 transition-colors"
                  title="Marcar todas como leídas"
                >
                  <Check size={16} />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  title="Limpiar todas"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={48} className="mx-auto mb-3 opacity-30" />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-dark-tertiary transition-colors cursor-pointer group ${
                      !notification.read ? "bg-dark-tertiary/30" : ""
                    }`}
                    onClick={() =>
                      !notification.read && markAsRead(notification.id)
                    }
                  >
                    <div className="flex items-start gap-3">
                      {/* Icono */}
                      <div className="text-2xl flex-shrink-0">
                        {notification.icon ||
                          getNotificationIcon(notification.type)}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-white font-medium text-sm leading-tight">
                            {notification.title}
                          </h4>

                          {/* Botón eliminar */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <p className="text-gray-400 text-sm mt-1">
                          {notification.message}
                        </p>

                        <p className="text-gray-500 text-xs mt-2">
                          {formatDistanceToNow(
                            new Date(notification.timestamp),
                            {
                              addSuffix: true,
                              locale: es,
                            }
                          )}
                        </p>
                      </div>

                      {/* Indicador de no leído */}
                      {!notification.read && (
                        <div className="w-2 h-2 bg-orange rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
