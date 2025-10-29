import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card } from "@/components/ui/Card";

export function Login() {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-16 w-16 object-contain"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <h1 className="text-3xl font-bold text-white">MyFreeterV</h1>
          </div>
          <p className="text-gray-400">
            Tu centro de control personal en la nube
          </p>
        </div>

        <Card className="p-6">
          {showRegister ? (
            <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
          ) : (
            <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
          )}
        </Card>

        <p className="text-center text-xs text-gray-500 mt-6">
          MyFreeterV © 2025 - All Rights Reserve.
        </p>
      </div>
    </div>
  );
}
