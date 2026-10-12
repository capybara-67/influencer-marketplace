import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../components/Screen";
import { AppButton, Card, MutedText, SectionTitle } from "../components/ui";
import { supabase } from "../lib/supabase";

export default function MenuScreen() {
  async function handleLogout() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    router.replace("/auth");
  }

  return (
    <Screen>
      <SectionTitle>Menu</SectionTitle>
      <Card>
        <View style={{ gap: 10 }}>
          <AppButton label="Offers" onPress={() => router.push("/offers")} />
          <AppButton label="Applications" variant="secondary" onPress={() => router.push("/applications")} />
          <AppButton label="Profile" variant="secondary" onPress={() => router.push("/profile")} />
          <AppButton label="Log out" variant="danger" onPress={handleLogout} />
        </View>
      </Card>
      <MutedText>Minimal MVP navigation for quick mobile use.</MutedText>
    </Screen>
  );
}
