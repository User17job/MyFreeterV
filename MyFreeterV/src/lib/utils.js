// src/lib/utils.js
import { clsx } from "clsx";

export function cn(...inputs) {
  return clsx(inputs);
}

export function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
