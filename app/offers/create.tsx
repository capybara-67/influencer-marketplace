import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LoadingState } from "../../components/LoadingState";
import { Screen } from "../../components/Screen";
import { AppButton, AppInput, Card, MutedText, SectionTitle } from "../../components/ui";
import { createOffer, updateOffer } from "../../lib/api";
import { supabase } from "../../lib/supabase";

export default function CreateOfferScreen() {
  const { offerId } = useLocalSearchParams<{ offerId?: string }>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [compensation, setCompensation] = useState("");
  const [location, setLocation] = useState("Ulaanbaatar");
  const [loading, setLoading] = useState(false);
  const [loadingOffer, setLoadingOffer] = useState(Boolean(offerId));

  useEffect(() => {
    if (!offerId || !supabase) {
      setLoadingOffer(false);
      return;
    }

    void loadExistingOffer();
  }, [offerId]);

  async function loadExistingOffer() {
    if (!offerId || !supabase) {
      setLoadingOffer(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("offers")
        .select("title, description, compensation, location")
        .eq("id", offerId)
        .single();

      if (error || !data) {
        Alert.alert("Error", error?.message ?? "Offer not found.");
        router.replace("/offers");
        return;
      }

      setTitle(data.title ?? "");
      setDescription(data.description ?? "");
      setCompensation(data.compensation ?? "");
      setLocation(data.location ?? "Ulaanbaatar");
    } finally {
      setLoadingOffer(false);
    }
  }

  async function handleCreate() {
    const nextTitle = title.trim();
    const nextDescription = description.trim();

    if (!nextTitle || !nextDescription) {
      Alert.alert("Missing details", "Add a title and description before publishing.");
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

      if (!user) {
        throw new Error("You need to log in.");
      }

      if (user.user_metadata?.role !== "business") {
        throw new Error("Only business accounts can publish offers.");
      }

      const payload = {
        title: nextTitle,
        description: nextDescription,
        compensation: compensation.trim() || null,
        location: location.trim() || "Ulaanbaatar"
      };

      if (offerId) {
        await updateOffer(offerId, payload);
      } else {
        await createOffer({
          business_id: user.id,
          ...payload
        });
      }

      Alert.alert(offerId ? "Offer updated" : "Offer created", offerId ? "Your changes were saved." : "Your collaboration offer is now live.");
      router.replace("/offers");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create offer";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }

  if (loadingOffer) {
    return <LoadingState message="Loading offer..." />;
  }

  return (
    <Screen scroll>
      <SectionTitle>{offerId ? "Edit Offer" : "Create Offer"}</SectionTitle>
      <MutedText>Keep the post simple so influencers can decide quickly.</MutedText>

      <Card>
        <AppInput label="Title" value={title} onChangeText={setTitle} placeholder="Free dinner for TikTok review" />
        <AppInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="What the influencer should post and what they will receive"
          multiline
        />
        <AppInput label="Compensation" value={compensation} onChangeText={setCompensation} placeholder="Free meal + 20,000 MNT" />
        <AppInput label="Location" value={location} onChangeText={setLocation} placeholder="Ulaanbaatar" />
        <AppButton label={loading ? "Saving..." : offerId ? "Save changes" : "Publish offer"} onPress={handleCreate} disabled={loading} />
      </Card>
    </Screen>
  );
}
