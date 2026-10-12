import { Screen } from "./Screen";
import { Card, MutedText, SectionTitle } from "./ui";

export function SetupRequired() {
  return (
    <Screen scroll>
      <SectionTitle>Supabase Setup Required</SectionTitle>
      <Card>
        <MutedText>To view the app, update the local `.env` file with your real Supabase project values.</MutedText>
        <MutedText>1. Open `.env` in the project root.</MutedText>
        <MutedText>2. Replace `PASTE_YOUR_URL_HERE` with `https://your-project.supabase.co`.</MutedText>
        <MutedText>3. Replace `PASTE_YOUR_KEY_HERE` with your Supabase anon key.</MutedText>
        <MutedText>4. Save the file.</MutedText>
        <MutedText>5. Stop Expo and run `npm run start -- --clear`.</MutedText>
      </Card>
    </Screen>
  );
}
