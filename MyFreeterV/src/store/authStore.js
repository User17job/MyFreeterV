// src/store/authStore.js - MEJORADO
import { create } from "zustand";
import { supabase, handleSupabaseError } from "@/lib/supabase";

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,
  error: null,
  isInitialized: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      set({
        user: data.user,
        session: data.session,
        loading: false,
        error: null,
      });
      return data;
    } catch (error) {
      const errorMsg = handleSupabaseError(error, "signIn");
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  signUp: async (email, password, metadata = {}) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });
      if (error) throw error;
      set({ loading: false, error: null });
      return data;
    } catch (error) {
      const errorMsg = handleSupabaseError(error, "signUp");
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      set({
        user: null,
        session: null,
        loading: false,
        error: null,
        isInitialized: false,
      });
    } catch (error) {
      const errorMsg = handleSupabaseError(error, "signOut");
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  initialize: async () => {
    // Evitar reinicialización
    if (get().isInitialized) {
      console.log("⚠️ Auth ya inicializado");
      return;
    }

    set({ loading: true, error: null });

    try {
      console.log("🔐 Inicializando autenticación...");

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      set({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null,
        isInitialized: true,
      });

      console.log("✅ Auth inicializado:", session?.user?.email || "No user");

      // Escuchar cambios de autenticación
      supabase.auth.onAuthStateChange((_event, session) => {
        console.log("🔄 Auth state cambió:", _event);
        set({
          user: session?.user ?? null,
          session,
          loading: false,
        });
      });
    } catch (error) {
      console.error("❌ Error inicializando auth:", error);
      const errorMsg = handleSupabaseError(error, "initialize");
      set({
        user: null,
        session: null,
        loading: false,
        error: errorMsg,
        isInitialized: true, // Marcar como inicializado incluso con error
      });
    }
  },

  clearError: () => set({ error: null }),
}));
