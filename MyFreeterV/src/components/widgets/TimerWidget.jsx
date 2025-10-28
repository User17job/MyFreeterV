// src/components/widgets/TimerWidget.jsx - CON NOMBRE PERSONALIZADO
import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Bell,
  BellOff,
  Volume2,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useTimerStore } from "@/store/timerStore";
import { notifyTimerComplete } from "@/utils/notificationUtils";
import { SoundSettings } from "./SoundSettings";

export function TimerWidget({ widget }) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(
    Notification.permission
  );
  const [isEditingName, setIsEditingName] = useState(false); // ⭐ NUEVO
  const [tempName, setTempName] = useState(""); // ⭐ NUEVO

  const {
    getTimer,
    getRemainingTime,
    start,
    pause,
    reset,
    setMode,
    setCustomMinutes,
    setTimerName, // ⭐ NUEVO
    complete,
    getActiveTimersCount,
    soundSettings,
  } = useTimerStore();

  const timer = getTimer(widget.id);
  const { mode, customMinutes, isRunning, name } = timer; // ⭐ NUEVO: name

  const [displayTime, setDisplayTime] = useState(getRemainingTime(widget.id));
  const [localCustomMinutes, setLocalCustomMinutes] = useState(customMinutes);

  const audioRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("Tu navegador no soporta notificaciones");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === "granted") {
        new Notification("¡Notificaciones activadas!", {
          body: "Recibirás alertas cuando termine el temporizador",
          icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75'>⏰</text></svg>",
        });
      }
    } catch (error) {
      console.error("Error al solicitar permisos:", error);
    }
  };

  useEffect(() => {
    if (isRunning) {
      hasCompletedRef.current = false;

      updateIntervalRef.current = setInterval(() => {
        const remaining = getRemainingTime(widget.id);
        setDisplayTime(remaining);

        if (remaining <= 0 && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          complete(widget.id);
          onTimerComplete();
        }
      }, 100);
    } else {
      setDisplayTime(getRemainingTime(widget.id));

      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isRunning, widget.id, getRemainingTime, complete]);

  const playSound = () => {
    if (soundSettings.selectedTone === "none") {
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    audioRef.current = new Audio(`/tones/${soundSettings.selectedTone}.mp3`);
    audioRef.current.volume = soundSettings.volume;

    audioRef.current
      .play()
      .catch((err) => console.log("Error reproduciendo audio:", err));

    let count = 0;
    const soundInterval = setInterval(() => {
      count++;
      if (count >= soundSettings.repeat) {
        clearInterval(soundInterval);
      } else {
        const repeatAudio = new Audio(
          `/tones/${soundSettings.selectedTone}.mp3`
        );
        repeatAudio.volume = soundSettings.volume;
        repeatAudio
          .play()
          .catch((err) => console.log("Error reproduciendo audio:", err));
      }
    }, 1500);
  };

  const onTimerComplete = () => {
    playSound();

    const modes = {
      pomodoro: 25,
      short: 5,
      long: 15,
      custom: customMinutes,
    };

    // ⭐ MODIFICADO: Incluir nombre en la notificación
    const timerLabel = name || `Timer ${mode}`;
    notifyTimerComplete(mode, modes[mode], timerLabel);

    const originalTitle = document.title;
    document.title = `⏰ ${timerLabel} completado!`;

    setTimeout(() => {
      document.title = originalTitle;
    }, 5000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // ⭐ NUEVO: Handlers para nombre
  const handleStartEditName = () => {
    setTempName(name || "");
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    setTimerName(widget.id, tempName.trim());
    setIsEditingName(false);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setTempName("");
  };

  const handleToggleRunning = () => {
    if (isRunning) {
      pause(widget.id);
    } else {
      start(widget.id);
    }
  };

  const handleReset = () => {
    reset(widget.id);
  };

  const handleModeChange = (newMode) => {
    setMode(widget.id, newMode);
  };

  const handleCustomTime = () => {
    const minutes = parseInt(localCustomMinutes);
    if (minutes > 0 && minutes <= 180) {
      setCustomMinutes(widget.id, minutes);
      setShowCustomModal(false);
    }
  };

  const modes = {
    pomodoro: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
    custom: customMinutes * 60,
  };
  const totalTime = modes[mode];
  const progress = ((totalTime - displayTime) / totalTime) * 100;

  const activeCount = getActiveTimersCount();

  // ⭐ NUEVO: Obtener label del modo
  const getModeLabel = () => {
    const labels = {
      pomodoro: "🍅 Pomodoro",
      short: "☕ Breve",
      long: "🌙 Largo",
      custom: `⏱️ ${customMinutes}min`,
    };
    return labels[mode] || "Timer";
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-4">
      {/* ⭐ NUEVO: Sección de nombre editable */}
      <div className="w-full">
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <Input
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Nombre del timer..."
              className="flex-1 text-sm"
              maxLength={30}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") handleCancelEditName();
              }}
            />
            <button
              onClick={handleSaveName}
              className="p-2 hover:bg-dark-tertiary rounded transition-colors text-green-500"
              title="Guardar"
            >
              <Check size={18} />
            </button>
            <button
              onClick={handleCancelEditName}
              className="p-2 hover:bg-dark-tertiary rounded transition-colors text-gray-400"
              title="Cancelar"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 group">
            <h3 className="text-lg font-semibold text-white text-center">
              {name || getModeLabel()}
            </h3>
            <button
              onClick={handleStartEditName}
              className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-dark-tertiary rounded transition-all text-gray-400 hover:text-white"
              title="Editar nombre"
            >
              <Edit2 size={16} />
            </button>
          </div>
        )}
        {name && !isEditingName && (
          <p className="text-xs text-gray-400 text-center mt-1">
            {getModeLabel()}
          </p>
        )}
      </div>

      {/* Indicador de timers activos */}
      {activeCount > 0 && (
        <div className="w-full bg-orange/10 border border-orange/30 rounded-lg p-2 text-center">
          <p className="text-xs text-orange font-medium">
            {activeCount === 1
              ? isRunning
                ? `⏱️ ${name || "Este timer"} está corriendo`
                : `⏱️ Hay 1 timer activo en otro dashboard`
              : `⏱️ Hay ${activeCount} timers activos`}
          </p>
        </div>
      )}

      {/* Botones de configuración */}
      <div className="w-full flex gap-2">
        {notificationPermission !== "granted" && (
          <Button
            variant="secondary"
            size="sm"
            onClick={requestNotificationPermission}
            className="flex-1 flex items-center justify-center gap-2 text-xs"
          >
            <Bell size={14} />
            Activar notificaciones
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowSoundModal(true)}
          className="flex-1 flex items-center justify-center gap-2 text-xs"
          title="Configurar sonido de alarma"
        >
          <Volume2 size={14} />
          Sonido
        </Button>
      </div>

      {notificationPermission === "granted" && (
        <div className="flex items-center gap-2 text-xs text-green-500">
          <Bell size={14} />
          <span>Notificaciones activas</span>
        </div>
      )}

      {notificationPermission === "denied" && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <BellOff size={14} />
          <span>Notificaciones bloqueadas</span>
        </div>
      )}

      {/* Botones de modo */}
      <div className="flex gap-2 flex-wrap justify-center">
        <button
          onClick={() => handleModeChange("pomodoro")}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
            mode === "pomodoro"
              ? "bg-orange text-white"
              : "bg-dark-tertiary text-gray-400 hover:text-white"
          }`}
        >
          🍅 Pomodoro
        </button>
        <button
          onClick={() => handleModeChange("short")}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
            mode === "short"
              ? "bg-orange text-white"
              : "bg-dark-tertiary text-gray-400 hover:text-white"
          }`}
        >
          ☕ Breve
        </button>
        <button
          onClick={() => handleModeChange("long")}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
            mode === "long"
              ? "bg-orange text-white"
              : "bg-dark-tertiary text-gray-400 hover:text-white"
          }`}
        >
          🌙 Largo
        </button>
        <button
          onClick={() => setShowCustomModal(true)}
          className={`px-3 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${
            mode === "custom"
              ? "bg-orange text-white"
              : "bg-dark-tertiary text-gray-400 hover:text-white"
          }`}
        >
          <Settings size={12} />
          {mode === "custom" ? `⏱️ ${customMinutes}min` : "Custom"}
        </button>
      </div>

      {/* Timer circular */}
      <div className="relative w-48 h-48">
        <svg className="transform -rotate-90 w-48 h-48">
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-dark-tertiary"
          />
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 88}`}
            strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
            className="text-orange transition-all duration-1000"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold text-white">
            {formatTime(displayTime)}
          </span>
        </div>
      </div>

      {/* Controles */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={handleToggleRunning}
          className="w-16 h-16 rounded-full"
        >
          {isRunning ? <Pause size={24} /> : <Play size={24} />}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={handleReset}
          className="w-16 h-16 rounded-full"
        >
          <RotateCcw size={24} />
        </Button>
      </div>

      {/* Modal tiempo personalizado */}
      <Modal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        title="Temporizador Personalizado"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCustomModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCustomTime}>Iniciar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Minutos"
            type="number"
            min="1"
            max="180"
            value={localCustomMinutes}
            onChange={(e) =>
              setLocalCustomMinutes(parseInt(e.target.value) || 25)
            }
            placeholder="Ej: 30"
          />
          <p className="text-xs text-gray-400">
            Ingresa entre 1 y 180 minutos (3 horas máximo)
          </p>
        </div>
      </Modal>

      {/* Modal configuración de sonido */}
      <Modal
        isOpen={showSoundModal}
        onClose={() => setShowSoundModal(false)}
        title="Configuración de Sonido"
        footer={
          <Button onClick={() => setShowSoundModal(false)}>Guardar</Button>
        }
      >
        <SoundSettings />
      </Modal>
    </div>
  );
}
