// src/components/widgets/SoundSettings.jsx
import { useState, useRef } from "react";
import { Volume2, VolumeX, Play } from "lucide-react";
import { useTimerStore } from "@/store/timerStore";

export function SoundSettings() {
  const { soundSettings, updateSoundSettings } = useTimerStore();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const tones = [
    {
      id: "tone1",
      label: "🔔 Campana Suave",
      description: "Tono clásico y relajante",
    },
    {
      id: "tone2",
      label: "⏰ Alarma Digital",
      description: "Tono moderno y claro",
    },
    { id: "tone3", label: "🎵 Melodía Alegre", description: "Tono energético" },
    {
      id: "none",
      label: "🔇 Sin sonido",
      description: "Solo notificación visual",
    },
  ];

  const handleToneChange = (toneId) => {
    updateSoundSettings({ selectedTone: toneId });
  };

  const handleVolumeChange = (e) => {
    const volume = parseFloat(e.target.value);
    updateSoundSettings({ volume });
  };

  const handleRepeatChange = (e) => {
    const repeat = parseInt(e.target.value);
    updateSoundSettings({ repeat });
  };

  const previewSound = (toneId) => {
    if (toneId === "none" || isPlaying) return;

    setIsPlaying(true);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    audioRef.current = new Audio(`/tones/${toneId}.mp3`);
    audioRef.current.volume = soundSettings.volume;

    audioRef.current
      .play()
      .then(() => {
        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
      })
      .catch((err) => {
        console.error("Error al reproducir:", err);
        setIsPlaying(false);
        alert(
          "Error al cargar el sonido. Verifica que el archivo existe en /public/tones/"
        );
      });
  };

  return (
    <div className="space-y-4">
      {/* Selección de tono */}
      <div>
        <label className="text-sm font-medium text-white block mb-2">
          Tono de Alarma
        </label>
        <div className="space-y-2">
          {tones.map((tone) => (
            <button
              key={tone.id}
              onClick={() => handleToneChange(tone.id)}
              className={`w-full p-3 rounded-lg border transition-all ${
                soundSettings.selectedTone === tone.id
                  ? "bg-orange/20 border-orange text-white"
                  : "bg-dark-tertiary border-gray-700 text-gray-300 hover:border-gray-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="font-medium">{tone.label}</div>
                  <div className="text-xs text-gray-400">
                    {tone.description}
                  </div>
                </div>
                {tone.id !== "none" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      previewSound(tone.id);
                    }}
                    disabled={isPlaying}
                    className="p-2 hover:bg-dark-secondary rounded transition-colors disabled:opacity-50"
                    title="Reproducir muestra"
                  >
                    <Play size={16} />
                  </button>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Control de volumen */}
      {soundSettings.selectedTone !== "none" && (
        <>
          <div>
            <label className="text-sm font-medium text-white block mb-2 flex items-center gap-2">
              {soundSettings.volume > 0 ? (
                <Volume2 size={16} />
              ) : (
                <VolumeX size={16} />
              )}
              Volumen: {Math.round(soundSettings.volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={soundSettings.volume}
              onChange={handleVolumeChange}
              className="w-full accent-orange"
            />
          </div>

          {/* Repeticiones */}
          <div>
            <label className="text-sm font-medium text-white block mb-2">
              Repetir sonido: {soundSettings.repeat}{" "}
              {soundSettings.repeat === 1 ? "vez" : "veces"}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={soundSettings.repeat}
              onChange={handleRepeatChange}
              className="w-full accent-orange"
            />
          </div>
        </>
      )}
    </div>
  );
}
