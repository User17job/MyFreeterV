// src/components/widgets/TimerWidget.jsx - SEGURO PARA MÓVIL
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

export function TimerWidget({ widget }) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState("default");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isClient, setIsClient] = useState(false);

  const {
    getTimer,
    getRemainingTime,
    start,
    pause,
    reset,
    setMode,
    setCustomMinutes,
    setTimerName,
    complete,
    getActiveTimersCount,
    soundSettings,
  } = useTimerStore();

  const timer = getTimer(widget.id);
  const { mode, customMinutes, isRunning, name } = timer;

  const [displayTime, setDisplayTime] = useState(0);
  const [localCustomMinutes, setLocalCustomMinutes] = useState(customMinutes);

  const audioRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const hasCompletedRef = useRef(false);

  // 🔥 ESPERAR A QUE EL CLIENTE ESTÉ LISTO
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 🔥 VERIFICAR NOTIFICACIONES SOLO EN CLIENTE
  useEffect(() => {
    if (!isClient) return;

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [isClient]);

  // Inicializar displayTime solo cuando el cliente esté listo
  useEffect(() => {
    if (isClient && widget?.id) {
      setDisplayTime(getRemainingTime(widget.id));
    }
  }, [isClient, widget?.id, getRemainingTime]);

  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const requestNotificationPermission = async () => {
    if (
      !isClient ||
      typeof window === "undefined" ||
      !("Notification" in window)
    ) {
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
    if (!isClient) return;

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
  }, [isRunning, widget.id, getRemainingTime, complete, isClient]);

  const playSound = () => {
    if (!isClient || soundSettings.selectedTone === "none") {
      return;
    }

    try {
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
          try {
            const repeatAudio = new Audio(
              `/tones/${soundSettings.selectedTone}.mp3`
            );
            repeatAudio.volume = soundSettings.volume;
            repeatAudio
              .play()
              .catch((err) => console.log("Error reproduciendo audio:", err));
          } catch (err) {
            console.error("Error creating audio:", err);
          }
        }
      }, 1500);
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const onTimerComplete = () => {
    if (!isClient) return;

    playSound();

    const modes = {
      pomodoro: 25,
      short: 5,
      long: 15,
      custom: customMinutes,
    };

    const timerLabel = name || `Timer ${mode}`;
    notifyTimerComplete(mode, modes[mode], timerLabel);

    if (typeof document !== "undefined") {
      const originalTitle = document.title;
      document.title = `⏰ ${timerLabel} completado!`;

      setTimeout(() => {
        document.title = originalTitle;
      }, 5000);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

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

  // 🔥 NO RENDERIZAR HASTA QUE EL CLIENTE ESTÉ LISTO
  if (!isClient) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-400 text-sm">Cargando timer...</div>
      </div>
    );
  }

  const modes = {
    pomodoro: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
    custom: customMinutes * 60,
  };
  const totalTime = modes[mode];
  const progress =
    totalTime > 0 ? ((totalTime - displayTime) / totalTime) * 100 : 0;

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
    <div className="space-y-4">
      {/* Nombre del timer editable */}
      <div className="text-center">
        {isEditingName ? (
          <div className="flex items-center gap-2 justify-center">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") handleCancelEditName();
              }}
              className="flex-1 max-w-[150px] text-sm bg-dark-primary text-white px-2 py-1 rounded border border-orange focus:outline-none"
              placeholder="Nombre del timer"
              autoFocus
            />
            <button
              onClick={handleSaveName}
              className="text-green-500 hover:text-green-400"
            >
              <Check size={16} />
            </button>
            <button
              onClick={handleCancelEditName}
              className="text-red-500 hover:text-red-400"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleStartEditName}
            className="text-gray-400 hover:text-white text-sm flex items-center gap-1 mx-auto"
          >
            {name || "Sin nombre"}
            <Edit2 size={12} />
          </button>
        )}
      </div>

      {/* Display del tiempo */}
      <div className="text-center">
        <div className="text-5xl font-bold text-white mb-2">
          {formatTime(displayTime)}
        </div>
        <p className="text-sm text-gray-400">{getModeLabel()}</p>

        {/* Barra de progreso */}
        <div className="w-full bg-dark-tertiary rounded-full h-2 mt-4">
          <div
            className="bg-orange h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controles */}
      <div className="flex gap-2 justify-center">
        <Button onClick={handleToggleRunning} size="sm">
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
        </Button>
        <Button onClick={handleReset} variant="ghost" size="sm">
          <RotateCcw size={16} />
        </Button>
        <Button
          onClick={() => setShowSoundModal(true)}
          variant="ghost"
          size="sm"
        >
          <Volume2 size={16} />
        </Button>
        <Button
          onClick={
            notificationPermission === "granted"
              ? undefined
              : requestNotificationPermission
          }
          variant="ghost"
          size="sm"
          title={
            notificationPermission === "granted"
              ? "Notificaciones activas"
              : "Activar notificaciones"
          }
        >
          {notificationPermission === "granted" ? (
            <Bell size={16} className="text-green-500" />
          ) : (
            <BellOff size={16} />
          )}
        </Button>
      </div>

      {/* Modos */}
      <div className="grid grid-cols-4 gap-2">
        {["pomodoro", "short", "long", "custom"].map((m) => (
          <button
            key={m}
            onClick={() =>
              m === "custom" ? setShowCustomModal(true) : handleModeChange(m)
            }
            className={`
              py-2 px-3 rounded text-xs font-medium transition-colors
              ${
                mode === m
                  ? "bg-orange text-white"
                  : "bg-dark-tertiary text-gray-400 hover:bg-dark-tertiary/80"
              }
            `}
          >
            {m === "pomodoro"
              ? "🍅"
              : m === "short"
              ? "☕"
              : m === "long"
              ? "🌙"
              : "⏱️"}
          </button>
        ))}
      </div>

      {/* Modal de tiempo personalizado */}
      <Modal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        title="Tiempo Personalizado"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCustomModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCustomTime}>Aplicar</Button>
          </>
        }
      >
        <Input
          type="number"
          label="Minutos"
          value={localCustomMinutes}
          onChange={(e) => setLocalCustomMinutes(e.target.value)}
          min="1"
          max="180"
          placeholder="Ej: 30"
        />
      </Modal>
    </div>
  );
}
