// src/components/widgets/CalendarWidget.jsx - CON EVENTOS RECURRENTES const { data, error } = await supabase
import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Repeat,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  addDays,
  addWeeks,
  addMonths,
  isAfter,
  isBefore,
} from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useTabsStore } from "@/store/tabsStore";
import { notifyCalendarEvent } from "@/utils/notificationUtils";

// 🔥 HELPER SEGURO PARA SESSIONSTORAGE
const safeSessionStorage = {
  getItem: (key) => {
    try {
      if (typeof window === "undefined" || !window.sessionStorage) return null;
      return window.sessionStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      if (typeof window === "undefined" || !window.sessionStorage) return false;
      window.sessionStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  },
};

export function CalendarWidget({ widget }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    time: "09:00",
    description: "",
    tab: widget.data?.tab || "mi-vida",
    recurring: "none", // 🆕
    recurringEndDate: "", // 🆕
  });

  const [isClient, setIsClient] = useState(false);

  const user = useAuthStore((state) => state.user);
  const { tabs } = useTabsStore();

  const isGlobalCalendar = widget.data?.isGlobal;
  const currentTab = widget.data?.tab;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && user?.id) {
      fetchEvents();
    }
  }, [
    widget.id,
    currentDate,
    isGlobalCalendar,
    currentTab,
    isClient,
    user?.id,
  ]);

  // 🔥 SISTEMA DE NOTIFICACIONES MEJORADO - Solo notifica una vez al día
  useEffect(() => {
    if (!isGlobalCalendar || !isClient || events.length === 0) return;

    const checkUpcomingEvents = () => {
      const today = new Date();
      const todayKey = format(today, "yyyy-MM-dd");

      // Verificar si ya notificamos hoy
      const lastNotificationDate = safeSessionStorage.getItem(
        "last-calendar-check"
      );
      if (lastNotificationDate === todayKey) {
        return; // Ya notificamos hoy, no volver a notificar
      }

      today.setHours(0, 0, 0, 0);
      let hasNotified = false;

      events.forEach((event) => {
        try {
          const eventDate = new Date(event.start_time);
          eventDate.setHours(0, 0, 0, 0);

          const daysUntil = Math.ceil(
            (eventDate - today) / (1000 * 60 * 60 * 24)
          );

          // Notificar eventos próximos (hoy, mañana, en 2 días)
          if (daysUntil >= 0 && daysUntil <= 2) {
            notifyCalendarEvent(event, daysUntil);
            hasNotified = true;
          }
        } catch (error) {
          console.warn("Error checking event:", error);
        }
      });

      // Marcar que ya notificamos hoy
      if (hasNotified) {
        safeSessionStorage.setItem("last-calendar-check", todayKey);
      }
    };

    // Verificar al cargar
    checkUpcomingEvents();

    // Verificar a medianoche (cada 24 horas)
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight - now;

    const midnightTimeout = setTimeout(() => {
      checkUpcomingEvents();
      // Luego cada 24 horas
      const interval = setInterval(checkUpcomingEvents, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimeout);
  }, [events, isGlobalCalendar, isClient]);

  // 🆕 AGREGAR ESTA FUNCIÓN
  const generateRecurringInstances = (event, monthStart, monthEnd) => {
    if (!event.recurring_pattern || event.recurring_pattern === "none") {
      return [event];
    }

    const instances = [];
    const eventStart = new Date(event.start_time);
    const recurringEnd = event.recurring_end_date
      ? new Date(event.recurring_end_date)
      : addMonths(monthEnd, 12);

    let currentDate = new Date(eventStart);

    while (
      isBefore(currentDate, recurringEnd) ||
      isSameDay(currentDate, recurringEnd)
    ) {
      if (
        (isAfter(currentDate, monthStart) ||
          isSameDay(currentDate, monthStart)) &&
        (isBefore(currentDate, monthEnd) || isSameDay(currentDate, monthEnd))
      ) {
        const instanceStart = new Date(currentDate);
        const instanceEnd = new Date(event.end_time);
        const timeDiff = instanceEnd - new Date(event.start_time);
        instanceEnd.setTime(instanceStart.getTime() + timeDiff);

        instances.push({
          ...event,
          start_time: instanceStart.toISOString(),
          end_time: instanceEnd.toISOString(),
          isRecurringInstance: true,
          originalEventId: event.id,
        });
      }

      switch (event.recurring_pattern) {
        case "daily":
          currentDate = addDays(currentDate, 1);
          break;
        case "weekly":
          currentDate = addWeeks(currentDate, 1);
          break;
        case "monthly":
          currentDate = addMonths(currentDate, 1);
          break;
        default:
          currentDate = recurringEnd;
      }

      if (instances.length > 365) break;
    }

    return instances;
  };

  const fetchEvents = async () => {
    try {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);

      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .order("start_time", { ascending: true });

      if (error) throw error;

      if (!data) {
        setEvents([]);
        return;
      }

      // Generar instancias de eventos recurrentes
      let allEvents = [];
      data.forEach((event) => {
        const instances = generateRecurringInstances(event, start, end);
        allEvents = [...allEvents, ...instances];
      });

      // Filtrar por tab si no es calendario global
      let filteredEvents = allEvents;
      if (!isGlobalCalendar) {
        filteredEvents = allEvents.filter(
          (event) => event.data?.tab === currentTab
        );
      }

      setEvents(filteredEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
    }
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });

    const firstDayOfWeek = start.getDay();
    const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const emptyDays = Array(offset).fill(null);

    return [...emptyDays, ...days];
  };

  const getEventsForDay = (day) => {
    if (!day) return [];
    return events.filter((event) => isSameDay(new Date(event.start_time), day));
  };

  const getTabInfo = (tabId) => {
    const tab = tabs.find((t) => t.id === tabId);
    return tab || { label: "General", emoji: "📋" };
  };

  const handleDayClick = (day) => {
    if (!day) return;

    const dayEvents = getEventsForDay(day);
    setSelectedDate(day);

    if (dayEvents.length > 0) {
      setShowDayEventsModal(true);
    } else {
      setShowEventModal(true);
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.title.trim() || !selectedDate) return;

    try {
      const startTime = new Date(selectedDate);
      const [hours, minutes] = newEvent.time.split(":");
      startTime.setHours(parseInt(hours), parseInt(minutes));

      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1);

      const eventData = {
        user_id: user.id,
        widget_id: widget.id,
        title: newEvent.title,
        description: newEvent.description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        color: getTabColor(newEvent.tab),
        // 🆕 AGREGAR ESTAS DOS LÍNEAS:
        recurring_pattern: newEvent.recurring,
        recurring_end_date: newEvent.recurringEndDate || null,
        data: {
          tab: newEvent.tab,
          createdFrom: isGlobalCalendar ? "global" : currentTab,
        },
      };

      const { data, error } = await supabase
        .from("calendar_events")
        .insert([eventData])
        .select()
        .single();

      if (!error && data) {
        // Recargar eventos para mostrar instancias recurrentes
        fetchEvents();
        setShowEventModal(false);
        setNewEvent({
          title: "",
          time: "09:00",
          description: "",
          tab: widget.data?.tab || "mi-vida",
          recurring: "none",
          recurringEndDate: "",
        });
      }
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  const getTabColor = (tabId) => {
    const colors = {
      "mi-vida": "#c67236",
      profesion: "#3b82f6",
      comunidad: "#10b981",
      ministerio: "#8b5cf6",
      intimidad: "#ec4899",
    };
    return colors[tabId] || "#c67236";
  };

  const deleteEvent = async (event) => {
    try {
      // Si es una instancia recurrente, preguntar qué hacer
      if (event.isRecurringInstance) {
        const deleteAll = window.confirm(
          "¿Deseas eliminar todas las repeticiones de este evento o solo esta?"
        );

        if (deleteAll) {
          // Eliminar el evento original
          const { error } = await supabase
            .from("calendar_events")
            .delete()
            .eq("id", event.originalEventId);

          if (!error) {
            fetchEvents(); // Recargar para actualizar todas las instancias
          }
        } else {
          // TODO: Implementar eliminación de instancia única
          alert("Función de eliminar instancia única próximamente");
        }
      } else {
        // Eliminar evento normal
        const { error } = await supabase
          .from("calendar_events")
          .delete()
          .eq("id", event.id);

        if (!error) {
          setEvents(events.filter((e) => e.id !== event.id));
        }
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-400 text-sm">Cargando calendario...</div>
      </div>
    );
  }

  const days = getDaysInMonth();
  const monthName = format(currentDate, "MMMM yyyy", { locale: es });
  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-white capitalize">
          {monthName}
        </h4>
        <div className="flex gap-1">
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.setMonth(currentDate.getMonth() - 1))
              )
            }
            className="p-1 hover:bg-dark-tertiary rounded"
          >
            <ChevronLeft size={16} className="text-gray-400" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2 py-1 text-xs hover:bg-dark-tertiary rounded text-gray-400"
          >
            Hoy
          </button>
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.setMonth(currentDate.getMonth() + 1))
              )
            }
            className="p-1 hover:bg-dark-tertiary rounded"
          >
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {isGlobalCalendar && (
        <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
          <span>📅 Calendario Global</span>
          <div className="flex gap-2 flex-wrap">
            {tabs.slice(0, 5).map((tab) => (
              <span key={tab.id} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getTabColor(tab.id) }}
                />
                {tab.emoji} {tab.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {!isGlobalCalendar && (
        <div className="text-xs text-gray-400">
          📅 Eventos de: {getTabInfo(currentTab).emoji}{" "}
          {getTabInfo(currentTab).label}
        </div>
      )}

      <div className="grid grid-cols-7 gap-1 text-xs">
        {["L", "M", "X", "J", "V", "S", "D"].map((day, i) => (
          <div key={i} className="text-center text-gray-500 font-medium py-1">
            {day}
          </div>
        ))}

        {days.map((day, i) => {
          if (!day) {
            return <div key={i} className="aspect-square" />;
          }

          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <button
              key={i}
              onClick={() => handleDayClick(day)}
              className={`
                aspect-square p-1 rounded text-xs relative
                ${isCurrentMonth ? "text-white" : "text-gray-600"}
                ${
                  isCurrentDay
                    ? "bg-orange text-white font-bold"
                    : "hover:bg-dark-tertiary"
                }
              `}
            >
              {format(day, "d")}
              {dayEvents.length > 0 && (
                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <div
                      key={i}
                      className="w-1 h-1 rounded-full relative"
                      style={{ backgroundColor: event.color || "#c67236" }}
                      title={event.title}
                    >
                      {/* Indicador de evento recurrente */}
                      {event.isRecurringInstance && (
                        <Repeat
                          size={8}
                          className="absolute -top-1 -right-1 text-white"
                        />
                      )}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="w-1 h-1 rounded-full bg-gray-500" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Modal para ver eventos del día */}
      <Modal
        isOpen={showDayEventsModal}
        onClose={() => setShowDayEventsModal(false)}
        title={`Eventos - ${
          selectedDate ? format(selectedDate, "dd MMMM", { locale: es }) : ""
        }`}
        footer={
          <Button
            onClick={() => {
              setShowDayEventsModal(false);
              setShowEventModal(true);
            }}
          >
            <Plus size={16} className="mr-2" />
            Agregar Evento
          </Button>
        }
      >
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {selectedDateEvents.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No hay eventos este día
            </p>
          ) : (
            selectedDateEvents.map((event, idx) => {
              const eventTab = getTabInfo(event.data?.tab);
              return (
                <div
                  key={event.id + "-" + idx}
                  className="p-3 bg-dark-tertiary rounded-lg group relative"
                  style={{
                    borderLeft: `4px solid ${event.color || "#c67236"}`,
                  }}
                >
                  <button
                    onClick={() => deleteEvent(event)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="flex items-start gap-2 mb-2">
                    <Clock size={16} className="text-orange mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-medium">
                          {event.title}
                        </h4>

                        {event.isRecurringInstance && (
                          <Repeat
                            size={14}
                            className="text-orange"
                            title="Evento recurrente"
                          />
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {format(new Date(event.start_time), "HH:mm")} -{" "}
                        {format(new Date(event.end_time), "HH:mm")}
                      </p>
                      <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        {eventTab.emoji} {eventTab.label}
                      </span>
                    </div>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-300 mt-2">
                      {event.description}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* Modal para agregar evento */}
      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title={`Nuevo Evento - ${
          selectedDate ? format(selectedDate, "dd MMMM", { locale: es }) : ""
        }`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowEventModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddEvent}>Agregar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Título"
            value={newEvent.title}
            onChange={(e) =>
              setNewEvent({ ...newEvent, title: e.target.value })
            }
            placeholder="Nombre del evento"
          />
          <Input
            label="Hora"
            type="time"
            value={newEvent.time}
            onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
          />
          <Textarea
            label="Descripción (opcional)"
            value={newEvent.description}
            onChange={(e) =>
              setNewEvent({ ...newEvent, description: e.target.value })
            }
            placeholder="Detalles del evento..."
            rows={3}
          />
          {/* 🆕 AGREGAR SELECTOR DE RECURRENCIA */}
          <Select
            label="Repetir"
            value={newEvent.recurring}
            onChange={(e) =>
              setNewEvent({ ...newEvent, recurring: e.target.value })
            }
            options={[
              { value: "none", label: "No repetir" },
              { value: "daily", label: "🔄 Diariamente" },
              { value: "weekly", label: "📅 Semanalmente" },
              { value: "monthly", label: "📆 Mensualmente" },
            ]}
          />

          {/* Fecha de fin si es recurrente */}
          {newEvent.recurring !== "none" && (
            <Input
              label="Repetir hasta (opcional)"
              type="date"
              value={newEvent.recurringEndDate}
              onChange={(e) =>
                setNewEvent({ ...newEvent, recurringEndDate: e.target.value })
              }
              min={format(selectedDate || new Date(), "yyyy-MM-dd")}
            />
          )}

          {/* Fecha de fin si es recurrente */}
          {newEvent.recurring !== "none" && (
            <Input
              label="Repetir hasta (opcional)"
              type="date"
              value={newEvent.recurringEndDate}
              onChange={(e) =>
                setNewEvent({ ...newEvent, recurringEndDate: e.target.value })
              }
              min={format(selectedDate || new Date(), "yyyy-MM-dd")}
            />
          )}

          <Select
            label={isGlobalCalendar ? "Asignar a Dashboard" : "Dashboard"}
            value={newEvent.tab}
            onChange={(e) => setNewEvent({ ...newEvent, tab: e.target.value })}
            options={tabs.map((tab) => ({
              value: tab.id,
              label: `${tab.emoji} ${tab.label}`,
            }))}
            disabled={!isGlobalCalendar}
          />
          {!isGlobalCalendar && (
            <p className="text-xs text-gray-400">
              💡 Este evento se creará en: {getTabInfo(currentTab).emoji}{" "}
              {getTabInfo(currentTab).label}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
