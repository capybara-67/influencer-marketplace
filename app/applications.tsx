import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { LoadingState } from "../components/LoadingState";
import { Screen } from "../components/Screen";
import { AppButton, Card, MutedText, SectionTitle } from "../components/ui";
import { supabase } from "../lib/supabase";
import { ApplicationRecord } from "../lib/types";
import { updateApplicationStatus } from "../lib/api";

export default function ApplicationsScreen() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    void loadApplications();
  }, []);

  async function loadApplications() {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      setRole(user.user_metadata?.role ?? null);

      if (user.user_metadata?.role === "business") {
        const { data, error } = await supabase
          .from("applications")
          .select(
            "id, offer_id, influencer_id, status, pitch, created_at, influencer_profiles(display_name, instagram_handle, tiktok_handle), offers!inner(business_id)"
          )
          .eq("offers.business_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        setApplications(
          ((data ?? []).map((item) => ({
            ...item,
            influencer_profiles: Array.isArray(item.influencer_profiles)
              ? (item.influencer_profiles[0] ?? null)
              : item.influencer_profiles
          })) as unknown as ApplicationRecord[])
        );
        return;
      }

      const { data, error } = await supabase
        .from("applications")
        .select("id, offer_id, influencer_id, status, pitch, created_at")
        .eq("influencer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setApplications((data ?? []) as unknown as ApplicationRecord[]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load applications";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: "accepted" | "rejected") {
    setUpdatingId(id);

    try {
      await updateApplicationStatus(id, status);
      await loadApplications();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update application";
      Alert.alert("Error", message);
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return <LoadingState message="Loading applications..." />;
  }

  return (
    <Screen scroll>
      <SectionTitle>Applications</SectionTitle>
      <MutedText>{role === "business" ? "Review incoming applicants." : "Track your application status."}</MutedText>

      {applications.map((application) => (
        <Card key={application.id}>
          <Text style={styles.status}>Status: {application.status}</Text>
          {role === "business" ? (
            <View style={styles.infoBlock}>
              <Text style={styles.name}>{application.influencer_profiles?.display_name ?? "Influencer"}</Text>
              <MutedText>
                {application.influencer_profiles?.instagram_handle || application.influencer_profiles?.tiktok_handle || "No handles"}
              </MutedText>
              {application.pitch ? <Text style={styles.pitch}>{application.pitch}</Text> : null}
              <View style={styles.actions}>
                <AppButton
                  label={updatingId === application.id ? "Updating..." : "Accept"}
                  onPress={() => handleStatusChange(application.id, "accepted")}
                  disabled={updatingId === application.id}
                />
                <AppButton
                  label="Reject"
                  variant="danger"
                  onPress={() => handleStatusChange(application.id, "rejected")}
                  disabled={updatingId === application.id}
                />
              </View>
            </View>
          ) : (
            <MutedText>We will update this after the business reviews your profile.</MutedText>
          )}
        </Card>
      ))}

      {!applications.length ? <MutedText>No applications yet.</MutedText> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: {
    fontWeight: "700",
    color: "#1E2430"
  },
  infoBlock: {
    gap: 10
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E2430"
  },
  pitch: {
    color: "#4C433A",
    lineHeight: 20
  },
  actions: {
    gap: 8
  }
});
