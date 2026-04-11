"use server";

import { supabaseServer } from "@/lib/supabase-server";

export async function joinWaitlist(email: string): Promise<{ success: boolean; error?: string }> {
  const trimmed = email.toLowerCase().trim();

  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  try {
    const { error } = await supabaseServer
      .from("waitlist")
      .insert({ email: trimmed });

    if (error) {
      if (error.code === "23505") {
        return { success: true }; // already on list
      }
      return { success: false, error: "Something went wrong. Please try again." };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
