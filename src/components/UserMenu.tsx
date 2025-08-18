"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function UserMenu() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="flex items-center gap-3">
      {email && <span className="text-sm text-gray-700">{email}</span>}
      <button onClick={signOut} className="rounded-md border px-3 py-1.5 text-sm hover:border-indigo-400 hover:text-indigo-600">
        Sign out
      </button>
    </div>
  );
}
