import { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Profile = {
  avatar_url: string | null;
  full_name: string;
};

type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
  profile: Profile | null;
  refreshProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: {
    full_name?: string;
    avatar_url?: string;
  }) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  profile: null,
  refreshProfile: async () => {},
  updateProfile: async () => {},
  updatePassword: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setIsLoading(false));
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // get profile
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("avatar_url, full_name")
      .eq("id", userId)
      .single();

    if (!error) setProfile(data);
  };

  const refreshProfile = async (userId: string) => {
    await fetchProfile(userId);
  };

  // 🔹 Update user profile fields (like full_name) in Supabase table
  const updateProfile = async (updates: {
    full_name?: string;
    avatar_url?: string;
  }) => {
    if (!session?.user) throw new Error("No active session found.");

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", session.user.id);

    if (error) throw error;

    // Refresh local profile state
    await fetchProfile(session.user.id);
  };

  // 🔹 Update user password using Supabase Auth
  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        profile,
        refreshProfile,
        updateProfile,
        updatePassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
