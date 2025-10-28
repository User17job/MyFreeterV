import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";

export function LoginForm({ onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = useAuthStore((state) => state.signIn);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      // No necesitas navigate ni onSuccess
      // App.jsx detectará el cambio de user y redirigirá automáticamente
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={loading}
      >
        {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-sm text-orange-brown hover:opacity-80 transition-opacity"
        >
          ¿No tienes cuenta? Regístrate
        </button>
      </div>
    </form>
  );
}
