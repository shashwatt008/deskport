import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const ALLOWED_ORIGINS = [
  "https://deskporthq.web.app",
  "https://deskporthq.firebaseapp.com",
  "http://localhost:3000",
];

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { email } = req.body || {};
  const trimmed = (email || "").toLowerCase().trim();

  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return res.status(400).json({ success: false, error: "Please enter a valid email address." });
  }

  try {
    const { error } = await supabase.from("waitlist").insert({ email: trimmed });

    if (error) {
      if (error.code === "23505") {
        return res.status(200).json({ success: true });
      }
      console.error("Supabase error:", JSON.stringify(error));
      return res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
    }

    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
}
