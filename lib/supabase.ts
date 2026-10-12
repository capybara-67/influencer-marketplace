import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined) ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const ExpoSecureStorageAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key)
};

const WebStorageAdapter = {
  getItem: (key: string) => Promise.resolve(typeof window === "undefined" ? null : window.localStorage.getItem(key)),
  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, value);
    }

    return Promise.resolve();
  },
  removeItem: (key: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key);
    }

    return Promise.resolve();
  }
};

const SupabaseStorageAdapter = Platform.OS === "web" ? WebStorageAdapter : ExpoSecureStorageAdapter;

function isPlaceholder(value: string | undefined) {
  if (!value) {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized.includes("paste_your") ||
    normalized.includes("your-project.supabase.co") ||
    normalized === "your-anon-key" ||
    normalized === "your_supabase_anon_key" ||
    normalized === "your_supabase_url"
  );
}

function isValidHttpUrl(value: string | undefined) {
  if (isPlaceholder(value)) {
    return false;
  }

  try {
    const url = new URL(value as string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidAnonKey(value: string | undefined) {
  if (isPlaceholder(value)) {
    return false;
  }

  return (value as string).trim().length > 20;
}

export const hasSupabaseConfig = isValidHttpUrl(supabaseUrl) && isValidAnonKey(supabaseAnonKey);
export const supabaseConfigError = hasSupabaseConfig
  ? null
  : "Supabase is not configured. Update .env with a real project URL and anon key.";

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
    auth: {
        storage: SupabaseStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    })
  : null;
