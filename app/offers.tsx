import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../components/Screen";
import { AppButton, Card, MutedText, SectionTitle } from "../components/ui";
import { fetchOffers } from "../lib/api";
import { supabase } from "../lib/supabase";
import { Offer } from "../lib/types";

export default function OffersScreen() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    void loadOffers();

    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setRole(data.user?.user_metadata?.role ?? null);
    });
  }, []);

  async function loadOffers() {
    setLoading(true);

    try {
      const data = await fetchOffers();
      setOffers(
        ((data ?? []).map((item) => ({
          ...item,
          business_profiles: Array.isArray(item.business_profiles) ? (item.business_profiles[0] ?? null) : item.business_profiles
        })) as unknown as Offer[])
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load offers";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <SectionTitle>Offers</SectionTitle>
          <MutedText>Open brand collaborations near you.</MutedText>
        </View>
        <AppButton label="Menu" variant="secondary" onPress={() => router.push("/menu")} />
        {role === "business" ? <AppButton label="New offer" onPress={() => router.push("/offers/create")} /> : null}
      </View>

      <FlatList
        data={offers}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadOffers}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: "/offers/[id]", params: { id: item.id } })}>
            <Card>
              <Text style={styles.title}>{item.title}</Text>
              <MutedText>{item.business_profiles?.business_name ?? "Business"}</MutedText>
              <MutedText>{item.location ?? "Ulaanbaatar"}</MutedText>
              <Text numberOfLines={2} style={styles.body}>
                {item.description}
              </Text>
              <Text style={styles.compensation}>{item.compensation ?? "Product exchange"}</Text>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={!loading ? <MutedText>No open offers yet.</MutedText> : null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 12
  },
  list: {
    gap: 12,
    paddingBottom: 24
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E2430"
  },
  body: {
    color: "#4C433A",
    lineHeight: 20
  },
  compensation: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F5EFF"
  }
});
