// src/components/widgets/CalendarWidget.jsx - CORREGIDO CON MODAL RESPONSIVE
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
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
import { useNotificationStore } from "@/store/notificationStore";

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
  });
  const user = useAuthStore((state) => state.user);
  const { tabs } = useTabsStore();

  const isGlobalCalendar = widget.data?.isGlobal;
  const currentTab = widget.data?.tab;

  useEffect(() => {
    fetchEvents();
  }, [widget.id, currentDate, isGlobalCalendar, currentTab]);

  // Verificar eventos próximos y notificar
  useEffect(() => {
    if (!isGlobalCalendar) return;

    const checkUpcomingEvents = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      events.forEach((event) => {
        const eventDate = new Date(event.start_time);
        eventDate.setHours(0, 0, 0, 0);

        const daysUntil = Math.ceil(
          (eventDate - today) / (1000 * 60 * 60 * 24)
        );

        // Notificar eventos a 2 días o menos
        if (daysUntil >= 0 && daysUntil <= 2) {
          // Verificar si ya se notificó (evitar duplicados)
          const notificationKey = `calendar-${event.id}-${daysUntil}`;
          const hasNotified = sessionStorage.getItem(notificationKey);

          if (!hasNotified) {
            notifyCalendarEvent(event, daysUntil);
            sessionStorage.setItem(notificationKey, "true");
          }
        }
      });
    };

    checkUpcomingEvents();

    // Verificar cada 1 hora
    const interval = setInterval(checkUpcomingEvents, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [events, isGlobalCalendar]);

  const fetchEvents = async () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);

    // Base query: todos los eventos del mes del usuario
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", user.id)
      .gte("start_time", start.toISOString())
      .lte("start_time", end.toISOString())
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching events:", error);
      return;
    }

    if (!data) {
      setEvents([]);
      return;
    }

    // Filtrar en el cliente según el tipo de calendario
    let filteredEvents = data;

    if (isGlobalCalendar) {
      // Calendario global: muestra TODOS los eventos
      filteredEvents = data;
    } else {
      // Calendario de tab específica: muestra solo eventos de esa tab
      filteredEvents = data.filter((event) => event.data?.tab === currentTab);
    }

    setEvents(filteredEvents);
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });

    // Obtener el día de la semana del primer día (0 = Domingo, 1 = Lunes, etc.)
    const firstDayOfWeek = start.getDay();
    // Ajustar para que Lunes = 0 (en vez de Domingo = 0)
    const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    // Agregar días vacíos al inicio para alinear correctamente
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
    if (!day) return; // No hacer nada si es un día vacío

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

    const startTime = new Date(selectedDate);
    const [hours, minutes] = newEvent.time.split(":");
    startTime.setHours(parseInt(hours), parseInt(minutes));

    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1);

    const { data, error } = await supabase
      .from("calendar_events")
      .insert([
        {
          user_id: user.id,
          widget_id: widget.id,
          title: newEvent.title,
          description: newEvent.description,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          color: getTabColor(newEvent.tab),
          data: {
            tab: newEvent.tab,
            createdFrom: isGlobalCalendar ? "global" : currentTab,
          },
        },
      ])
      .select()
      .single();

    if (!error && data) {
      setEvents([...events, data]);
      setShowEventModal(false);
      setNewEvent({
        title: "",
        time: "09:00",
        description: "",
        tab: widget.data?.tab || "mi-vida",
      });
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

  const deleteEvent = async (eventId) => {
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", eventId);

    if (!error) {
      setEvents(events.filter((e) => e.id !== eventId));
    }
  };

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
          // Si es un día vacío (null), renderizar celda vacía
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
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: event.color || "#c67236" }}
                      title={event.title}
                    />
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

      {/* Modal para ver eventos del día - CON PORTAL */}
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
            selectedDateEvents.map((event) => {
              const eventTab = getTabInfo(event.data?.tab);
              return (
                <div
                  key={event.id}
                  className="p-3 bg-dark-tertiary rounded-lg group relative"
                  style={{
                    borderLeft: `4px solid ${event.color || "#c67236"}`,
                  }}
                >
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="flex items-start gap-2 mb-2">
                    <Clock size={16} className="text-orange mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{event.title}</h4>
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

      {/* Modal para agregar evento - CON PORTAL */}
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
