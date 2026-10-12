import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { LoadingState } from "../components/LoadingState";
import { Screen } from "../components/Screen";
import { AppButton, AppInput, Card, MutedText, SectionTitle } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { signIn, signUpWithRole } from "../lib/api";
import { UserRole } from "../lib/types";

export default function AuthScreen() {
  const { session, error: sessionError } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [role, setRole] = useState<UserRole>("business");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (loading) return;
    const nextEmail = email.trim().toLowerCase();
    const nextFullName = fullName.trim();

    if (!nextEmail || !password.trim()) {
      Alert.alert("Missing details", "Enter your email and password.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Password too short", "Use at least 6 characters.");
      return;
    }

    if (mode === "signup" && !nextFullName) {
      Alert.alert("Missing name", "Enter your name before creating an account.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        await signUpWithRole(nextEmail, password, role, nextFullName);
        Alert.alert("Account created", "Check your email if confirmation is enabled, then log in.");
        setMode("login");
      } else {
        await signIn(nextEmail, password);
        router.replace("/offers");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      Alert.alert("Auth error", message);
    } finally {
      setLoading(false);
    }
  }

  if (session) {
    return <LoadingState message="Opening marketplace..." />;
  }

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <SectionTitle>Local brand deals, fast.</SectionTitle>
        <MutedText>Businesses post simple offers. Influencers apply in a few taps.</MutedText>
      </View>

      {sessionError ? <Text accessibilityRole="alert">Could not restore the previous session. Please log in again.</Text> : null}
      <Card>
        <View style={styles.toggleRow}>
          <Pressable onPress={() => setMode("signup")} style={[styles.toggle, mode === "signup" && styles.active]}>
            <Text style={styles.toggleText}>Sign up</Text>
          </Pressable>
          <Pressable onPress={() => setMode("login")} style={[styles.toggle, mode === "login" && styles.active]}>
            <Text style={styles.toggleText}>Log in</Text>
          </Pressable>
        </View>

        {mode === "signup" ? (
          <>
            <AppInput label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
            <Text style={styles.roleLabel}>Choose role</Text>
            <View style={styles.roleRow}>
              <Pressable onPress={() => setRole("business")} style={[styles.roleChip, role === "business" && styles.roleChipActive]}>
                <Text>Business</Text>
              </Pressable>
              <Pressable
                onPress={() => setRole("influencer")}
                style={[styles.roleChip, role === "influencer" && styles.roleChipActive]}
              >
                <Text>Influencer</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        <AppInput label="Email" value={email} onChangeText={setEmail} placeholder="name@example.com" />
        <AppInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Minimum 6 characters"
          secureTextEntry
        />
        <AppButton
          label={loading ? "Please wait..." : mode === "signup" ? "Create account" : "Log in"}
          onPress={handleSubmit}
          disabled={loading}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 8,
    paddingTop: 32
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#EEE8E1",
    borderRadius: 14,
    padding: 4
  },
  toggle: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10
  },
  active: {
    backgroundColor: "#FFFFFF"
  },
  toggleText: {
    fontWeight: "600",
    color: "#1E2430"
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#332B22"
  },
  roleRow: {
    flexDirection: "row",
    gap: 10
  },
  roleChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D9D0C7",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#FFF"
  },
  roleChipActive: {
    borderColor: "#1F5EFF",
    backgroundColor: "#E8F0FF"
  }
});
