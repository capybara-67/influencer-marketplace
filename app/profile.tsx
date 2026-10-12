import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { LoadingState } from "../components/LoadingState";
import { Screen } from "../components/Screen";
import { AppButton, AppInput, Card, MutedText, SectionTitle } from "../components/ui";
import { supabase } from "../lib/supabase";

export default function ProfileScreen() {
  const [role, setRole] = useState<"business" | "influencer" | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    if (!supabase) {
      setLoadingProfile(false);
      return;
    }

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Missing user session");
      }

      const nextRole = (user.user_metadata?.role as "business" | "influencer" | undefined) ?? "influencer";
      const metadataName = user.user_metadata?.full_name ?? "";
      setRole(nextRole);

      if (nextRole === "business") {
        const { data, error } = await supabase
          .from("business_profiles")
          .select("business_name, description")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        setName(data?.business_name ?? metadataName);
        setBio(data?.description ?? "");
        return;
      }

      const { data, error } = await supabase
        .from("influencer_profiles")
        .select("display_name, bio, instagram_handle, tiktok_handle")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      setName(data?.display_name ?? metadataName);
      setBio(data?.bio ?? "");
      setInstagram(data?.instagram_handle ?? "");
      setTiktok(data?.tiktok_handle ?? "");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load profile";
      Alert.alert("Error", message);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handleSave() {
    const nextName = name.trim();

    if (!nextName) {
      Alert.alert("Missing name", role === "business" ? "Enter a business name." : "Enter a display name.");
      return;
    }

    setLoading(true);

    try {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user || !role) {
        throw new Error("Missing user session");
      }

      if (role === "business") {
        const { error } = await supabase.from("business_profiles").upsert({
          user_id: user.id,
          business_name: nextName,
          description: bio.trim() || null
        });

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from("influencer_profiles").upsert({
          user_id: user.id,
          display_name: nextName,
          bio: bio.trim() || null,
          instagram_handle: instagram.trim() || null,
          tiktok_handle: tiktok.trim() || null
        });

        if (error) {
          throw error;
        }
      }

      Alert.alert("Saved", "Profile updated.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save profile";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }

  if (loadingProfile) {
    return <LoadingState message="Loading profile..." />;
  }

  return (
    <Screen scroll>
      <SectionTitle>{role === "business" ? "Business profile" : "Influencer profile"}</SectionTitle>
      <MutedText>{role === "business" ? "Add the basics so influencers trust the offer." : "Add manual social handles only."}</MutedText>

      <Card>
        <AppInput
          label={role === "business" ? "Business name" : "Display name"}
          value={name}
          onChangeText={setName}
          placeholder={role === "business" ? "Cafe name" : "Creator name"}
        />
        <AppInput label="Bio" value={bio} onChangeText={setBio} placeholder="Short description" multiline />
        {role === "influencer" ? (
          <>
            <AppInput label="Instagram handle" value={instagram} onChangeText={setInstagram} placeholder="@creator" />
            <AppInput label="TikTok handle" value={tiktok} onChangeText={setTiktok} placeholder="@creator" />
          </>
        ) : null}
        <AppButton label={loading ? "Saving..." : "Save profile"} onPress={handleSave} disabled={loading} />
      </Card>
    </Screen>
  );
}
