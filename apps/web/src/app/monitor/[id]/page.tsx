"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TerminalView } from "@/components/terminal";
import { api } from "@/lib/api";

export default function MonitorPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("deskport_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const url = api.getWsUrl(`/api/sessions/${sessionId}/monitor`);
      setWsUrl(url);
    } catch {
      setError("Failed to construct WebSocket URL.");
    }
  }, [sessionId, router]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1117]">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <button
            onClick={() => router.push("/sessions")}
            className="mt-4 text-sm text-primary hover:underline cursor-pointer"
          >
            Back to sessions
          </button>
        </div>
      </div>
    );
  }

  if (!wsUrl) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1117]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      <TerminalView sessionId={sessionId} wsUrl={wsUrl} readOnly={true} />
    </div>
  );
}
