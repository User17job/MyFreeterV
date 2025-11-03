// src/components/dashboard/BellNotifications.jsx - MEJORADO
import { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, X, CheckCheck } from "lucide-react";
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
      reminder: "🔔",
    };
    return icons[type] || "🔔";
  };

  // 🆕 Agrupar notificaciones por tipo y fecha
  const groupedNotifications = notifications.reduce((acc, notif) => {
    const key = `${notif.type}-${notif.title}-${new Date(
      notif.timestamp
    ).toDateString()}`;
    if (!acc[key]) {
      acc[key] = { ...notif, count: 1, ids: [notif.id] };
    } else {
      acc[key].count++;
      acc[key].ids.push(notif.id);
    }
    return acc;
  }, {});

  const groupedArray = Object.values(groupedNotifications);

  // 🆕 Marcar grupo como leído
  const markGroupAsRead = (notification) => {
    notification.ids.forEach((id) => markAsRead(id));
  };

  // 🆕 Eliminar grupo
  const deleteGroup = (notification) => {
    notification.ids.forEach((id) => deleteNotification(id));
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
                  className="text-xs text-orange hover:text-orange/80 transition-colors flex items-center gap-1"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck size={16} />
                  <span className="hidden sm:inline">Leer todas</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm("¿Limpiar todas las notificaciones?")) {
                      clearAll();
                    }
                  }}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  title="Limpiar todas"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Lista de notificaciones AGRUPADAS */}
          <div className="overflow-y-auto flex-1">
            {groupedArray.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No hay notificaciones</p>
                <p className="text-xs mt-2">
                  Te notificaremos sobre eventos próximos
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {groupedArray.map((notification, idx) => {
                  const hasMultiple = notification.count > 1;
                  const anyUnread = notification.ids.some((id) =>
                    notifications.find((n) => n.id === id && !n.read)
                  );

                  return (
                    <div
                      key={notification.id + "-" + idx}
                      className={`p-4 hover:bg-dark-tertiary transition-colors cursor-pointer group ${
                        anyUnread ? "bg-dark-tertiary/30" : ""
                      }`}
                      onClick={() => anyUnread && markGroupAsRead(notification)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icono */}
                        <div className="text-2xl flex-shrink-0 relative">
                          {notification.icon ||
                            getNotificationIcon(notification.type)}
                          {hasMultiple && (
                            <span className="absolute -top-1 -right-1 bg-orange text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                              {notification.count}
                            </span>
                          )}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium text-sm leading-tight">
                                {notification.title}
                                {hasMultiple && (
                                  <span className="text-xs text-orange ml-2">
                                    (×{notification.count})
                                  </span>
                                )}
                              </h4>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {anyUnread && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markGroupAsRead(notification);
                                  }}
                                  className="text-gray-500 hover:text-green-500"
                                  title="Marcar como leído"
                                >
                                  <Check size={14} />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteGroup(notification);
                                }}
                                className="text-gray-500 hover:text-red-500"
                                title="Eliminar"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>

                          <p className="text-gray-400 text-sm mt-1">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between mt-2">
                            <p className="text-gray-500 text-xs">
                              {formatDistanceToNow(
                                new Date(notification.timestamp),
                                {
                                  addSuffix: true,
                                  locale: es,
                                }
                              )}
                            </p>

                            {/* Indicador de no leído */}
                            {anyUnread && (
                              <div className="flex items-center gap-1 text-xs text-orange">
                                <div className="w-2 h-2 bg-orange rounded-full" />
                                <span>Nueva</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer con info */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-800 text-center">
              <p className="text-xs text-gray-500">
                💡 Las notificaciones se revisan una vez al día
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
