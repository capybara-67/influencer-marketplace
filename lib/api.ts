import { supabase } from "./supabase";
import { ApplicationStatus, UserRole } from "./types";

function getSupabaseClient() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add your real values to .env and restart Expo.");
  }

  return supabase;
}

export async function signUpWithRole(email: string, password: string, role: UserRole, fullName: string) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name: fullName
      }
    }
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchOffers() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("offers")
    .select("id, business_id, title, description, compensation, location, status, created_at, business_profiles(business_name)")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function createOffer(payload: {
  business_id: string;
  title: string;
  description: string;
  compensation?: string | null;
  location?: string | null;
}) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("offers").insert(payload).select().single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateOffer(
  offerId: string,
  payload: {
    title: string;
    description: string;
    compensation?: string | null;
    location?: string | null;
  }
) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("offers").update(payload).eq("id", offerId).select().single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteOffer(offerId: string) {
  const client = getSupabaseClient();
  const { error } = await client.from("offers").delete().eq("id", offerId);

  if (error) {
    throw error;
  }
}

export async function applyToOffer(payload: { offer_id: string; influencer_id: string; pitch?: string }) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("applications").insert(payload).select().single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateApplicationStatus(applicationId: string, status: ApplicationStatus) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("applications")
    .update({ status })
    .eq("id", applicationId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
