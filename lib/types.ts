export type UserRole = "business" | "influencer";

export type Offer = {
  id: string;
  business_id: string;
  title: string;
  description: string;
  compensation: string | null;
  location: string | null;
  status: "open" | "closed";
  created_at: string;
  business_profiles?: {
    business_name: string;
  } | null;
};

export type ApplicationStatus = "pending" | "accepted" | "rejected" | "completed";

export type ApplicationRecord = {
  id: string;
  offer_id: string;
  influencer_id: string;
  status: ApplicationStatus;
  pitch: string | null;
  created_at: string;
  influencer_profiles?: {
    display_name: string;
    instagram_handle: string | null;
    tiktok_handle: string | null;
  } | null;
};
