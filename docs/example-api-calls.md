# Example API Calls

```ts
import {
  applyToOffer,
  createOffer,
  deleteOffer,
  fetchOffers,
  signIn,
  signUpWithRole,
  updateApplicationStatus,
  updateOffer
} from "../lib/api";

await signUpWithRole("biz@example.com", "secret123", "business", "Nomad Coffee");
await signIn("creator@example.com", "secret123");

const offers = await fetchOffers();

await createOffer({
  business_id: "business-user-id",
  title: "Free lunch for Instagram reel",
  description: "Visit our cafe and post one reel plus two story frames.",
  compensation: "Free lunch for 2",
  location: "Ulaanbaatar"
});

await updateOffer("offer-id", {
  title: "Updated offer title",
  description: "Updated description",
  compensation: "Free lunch + 30,000 MNT",
  location: "Ulaanbaatar"
});

await applyToOffer({
  offer_id: "offer-id",
  influencer_id: "influencer-user-id",
  pitch: "I create food content for Ulaanbaatar students."
});

await updateApplicationStatus("application-id", "accepted");
await deleteOffer("offer-id");
```
