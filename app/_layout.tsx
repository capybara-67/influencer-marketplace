import { Stack, router, useSegments } from "expo-router";
import { useEffect } from "react";
import { LoadingState } from "../components/LoadingState";
import { SetupRequired } from "../components/SetupRequired";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import { hasSupabaseConfig } from "../lib/supabase";

export default function RootLayout() {
  if (!hasSupabaseConfig) {
    return <SetupRequired />;
  }

  return (
    <AuthProvider>
      <RootStack />
    </AuthProvider>
  );
}

function RootStack() {
  const segments = useSegments();
  const { session, loading } = useAuth();
  const inAuthScreen = segments[0] === "auth";

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!session && !inAuthScreen) {
      router.replace("/auth");
      return;
    }

    if (session && inAuthScreen) {
      router.replace("/offers");
    }
  }, [inAuthScreen, loading, session]);

  if (loading) {
    return <LoadingState message="Checking your session..." />;
  }

  if ((!session && !inAuthScreen) || (session && inAuthScreen)) {
    return <LoadingState message="Opening marketplace..." />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#F7F5F2" },
        headerShadowVisible: false,
        headerTintColor: "#1E2430",
        contentStyle: { backgroundColor: "#F7F5F2" }
      }}
    />
  );
}
