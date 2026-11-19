"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export function Realtime() {
  const router = useRouter();
  useEffect(() => {
    const sb = createClient();
    const ch = sb.channel("admin-notifs").on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => router.refresh()).subscribe();
    return () => { sb.removeChannel(ch); };
  }, [router]);
  return null;
}
