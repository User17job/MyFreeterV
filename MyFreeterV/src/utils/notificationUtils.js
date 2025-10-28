// src/utils/notificationUtils.js - CON NOMBRE DEL TIMER
import { useNotificationStore } from "@/store/notificationStore";

export const notifyCalendarEvent = (event, daysUntil) => {
  const store = useNotificationStore.getState();

  if (!store.isNotificationEnabled("calendar")) return;

  const timeText =
    daysUntil === 0
      ? "hoy"
      : daysUntil === 1
      ? "mañana"
      : `en ${daysUntil} días`;

  store.addNotification({
    type: "calendar",
    title: event.title,
    message: `Evento ${timeText}`,
    icon: "📅",
    data: {
      eventId: event.id,
      date: event.start_time,
      daysUntil,
    },
  });

  if (Notification.permission === "granted") {
    new Notification(`📅 ${event.title}`, {
      body: `Evento ${timeText}`,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">📅</text></svg>',
    });
  }
};

// ⭐ MODIFICADO: Agregar parámetro timerName
export const notifyTimerComplete = (mode, minutes, timerName = null) => {
  const store = useNotificationStore.getState();

  if (!store.isNotificationEnabled("timer")) return;

  const modeNames = {
    pomodoro: "Pomodoro",
    short: "Descanso Corto",
    long: "Descanso Largo",
    custom: "Temporizador",
  };

  // ⭐ NUEVO: Usar nombre personalizado si existe
  const displayName = timerName || modeNames[mode] || "Temporizador";
  const title = `⏰ ${displayName} completado`;

  store.addNotification({
    type: "timer",
    title: title,
    message: `${minutes} minutos`,
    icon: "⏰",
    data: {
      mode,
      minutes,
      timerName,
    },
  });

  if (Notification.permission === "granted") {
    new Notification(title, {
      body: `${minutes} minutos finalizados`,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">⏰</text></svg>',
      requireInteraction: true,
    });
  }
};

export const notifyTaskReminder = (task) => {
  const store = useNotificationStore.getState();

  if (!store.isNotificationEnabled("tasks")) return;

  store.addNotification({
    type: "task",
    title: task.title,
    message: "Recordatorio de tarea",
    icon: "✅",
    data: {
      taskId: task.id,
    },
  });
};
