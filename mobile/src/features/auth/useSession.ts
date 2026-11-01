import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { mapAuthErrorMessage } from "./validation";

export type UserProfile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
};

type SessionState = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isInitialized: boolean;
  isLoadingProfile: boolean;
  profileError: string | null;
  initialize: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<UserProfile | null>;
  setProfile: (profile: UserProfile | null) => void;
  signOut: () => Promise<void>;
};

let authListenerSubscribed = false;

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isInitialized: false,
  isLoadingProfile: false,
  profileError: null,

  setProfile: (profile) => {
    set({ profile, profileError: null });
  },

  fetchProfile: async (userId: string) => {
    if (!supabase) {
      set({ profile: null, isLoadingProfile: false });
      return null;
    }

    set({ isLoadingProfile: true, profileError: null });
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, created_at, updated_at")
        .eq("id", userId)
        .maybeSingle<UserProfile>();

      if (error) {
        set({
          profileError: mapAuthErrorMessage(error),
          isLoadingProfile: false,
        });
        return null;
      }

      set({
        profile: data ?? null,
        profileError: null,
        isLoadingProfile: false,
      });
      return data ?? null;
    } catch (e) {
      set({
        profileError: mapAuthErrorMessage(e),
        isLoadingProfile: false,
      });
      return null;
    }
  },

  initialize: async () => {
    if (!supabase) {
      set({
        session: null,
        user: null,
        profile: null,
        isInitialized: true,
        isLoadingProfile: false,
      });
      return;
    }

    if (!authListenerSubscribed) {
      authListenerSubscribed = true;
      supabase.auth.onAuthStateChange((_event, nextSession) => {
        const nextUser = nextSession?.user ?? null;
        const prevUserId = get().user?.id ?? null;

        set({
          session: nextSession,
          user: nextUser,
        });

        if (!nextUser) {
          set({
            profile: null,
            isLoadingProfile: false,
            profileError: null,
          });
          return;
        }

        if (nextUser.id !== prevUserId || get().profile === null) {
          void get().fetchProfile(nextUser.id);
        }
      });
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      set({ session, user });

      if (user) {
        await get().fetchProfile(user.id);
      } else {
        set({ profile: null, isLoadingProfile: false });
      }
    } catch (e) {
      set({
        profileError: mapAuthErrorMessage(e),
        isLoadingProfile: false,
      });
    } finally {
      set({ isInitialized: true });
    }
  },

  signOut: async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    set({
      session: null,
      user: null,
      profile: null,
      isLoadingProfile: false,
      profileError: null,
    });
  },
}));

export const useSession = useSessionStore;
