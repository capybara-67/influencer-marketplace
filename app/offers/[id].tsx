import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LoadingState } from "../../components/LoadingState";
import { Screen } from "../../components/Screen";
import { AppButton, AppInput, Card, MutedText, SectionTitle } from "../../components/ui";
import { applyToOffer, deleteOffer } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import { ApplicationStatus, Offer } from "../../lib/types";

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const offerId = Array.isArray(id) ? id[0] : id;
  const [offer, setOffer] = useState<Offer | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus | null>(null);
  const [pitch, setPitch] = useState("");
  const [loadingOffer, setLoadingOffer] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoadingOffer(false);
      return;
    }

    void loadOffer();
    void loadCurrentUser();
  }, [offerId]);

  async function loadOffer() {
    if (!supabase || !offerId) {
      setErrorMessage("Offer not found.");
      setLoadingOffer(false);
      return;
    }

    setLoadingOffer(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from("offers")
        .select("id, business_id, title, description, compensation, location, status, created_at, business_profiles(business_name)")
        .eq("id", offerId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        setErrorMessage("This offer does not exist or is no longer available.");
        return;
      }

      setOffer({
        ...(data as Record<string, unknown>),
        business_profiles: Array.isArray(data.business_profiles) ? (data.business_profiles[0] ?? null) : data.business_profiles
      } as Offer);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load offer";
      setErrorMessage(message);
    } finally {
      setLoadingOffer(false);
    }
  }

  async function loadCurrentUser() {
    if (!supabase || !offerId) {
      return;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    const nextRole = user?.user_metadata?.role ?? null;
    setRole(nextRole);
    setUserId(user?.id ?? null);

    if (!user || nextRole !== "influencer") {
      return;
    }

    const { data } = await supabase
      .from("applications")
      .select("status")
      .eq("offer_id", offerId)
      .eq("influencer_id", user.id)
      .maybeSingle();

    setApplicationStatus((data?.status as ApplicationStatus | undefined) ?? null);
  }

  async function handleApply() {
    if (!userId || !offer || role !== "influencer") {
      return;
    }

    setSubmitting(true);
    try {
      await applyToOffer({
        offer_id: offer.id,
        influencer_id: userId,
        pitch: pitch.trim() || undefined
      });
      setApplicationStatus("pending");
      Alert.alert("Applied", "Your application was submitted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to apply";
      Alert.alert("Error", message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!offer) {
      return;
    }

    Alert.alert("Delete offer?", "This removes the offer and its applications.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void confirmDelete() }
    ]);
  }

  async function confirmDelete() {
    if (!offer) {
      return;
    }

    try {
      await deleteOffer(offer.id);
      Alert.alert("Deleted", "Offer removed.");
      router.replace("/offers");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete offer";
      Alert.alert("Error", message);
    }
  }

  if (loadingOffer) {
    return <LoadingState message="Loading offer..." />;
  }

  if (errorMessage || !offer) {
    return (
      <Screen scroll>
        <SectionTitle>Offer unavailable</SectionTitle>
        <Card>
          <MutedText>{errorMessage ?? "This offer could not be loaded."}</MutedText>
          <AppButton label="Back to offers" variant="secondary" onPress={() => router.replace("/offers")} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <SectionTitle>{offer.title}</SectionTitle>
      <Card>
        <MutedText>{offer.business_profiles?.business_name ?? "Business"}</MutedText>
        <Text style={styles.location}>{offer.location ?? "Ulaanbaatar"}</Text>
        <Text style={styles.description}>{offer.description}</Text>
        <Text style={styles.compensation}>{offer.compensation ?? "Product exchange"}</Text>
      </Card>

      {role === "influencer" && applicationStatus ? (
        <Card>
          <Text style={styles.status}>Application: {applicationStatus}</Text>
          <MutedText>You have already applied to this offer.</MutedText>
        </Card>
      ) : null}

      {role === "influencer" && !applicationStatus ? (
        <Card>
          <AppInput label="Pitch" value={pitch} onChangeText={setPitch} placeholder="Why are you a good fit?" multiline />
          <AppButton label={submitting ? "Applying..." : "Apply to offer"} onPress={handleApply} disabled={submitting} />
        </Card>
      ) : null}

      {role === "business" && userId === offer.business_id ? (
        <View style={styles.actions}>
          <AppButton label="Edit offer" variant="secondary" onPress={() => router.push({ pathname: "/offers/create", params: { offerId: offer.id } })} />
          <AppButton label="Delete offer" variant="danger" onPress={handleDelete} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: {
    fontWeight: "700",
    color: "#1E2430"
  },
  location: {
    fontSize: 14,
    color: "#6C6258"
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#2E2A26"
  },
  compensation: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F5EFF"
  },
  actions: {
    gap: 10
  }
});
