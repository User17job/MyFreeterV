// src/hooks/useAuth.js
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const { user, session, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return { user, session, loading };
}
