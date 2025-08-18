"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <section className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5">
      <h1 className="mb-2 text-2xl font-bold text-indigo-700">Login</h1>
      <p className="mb-6 text-gray-700">
        Sign in via magic link. Enter your email and check your inbox.
      </p>

      {sent ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          Magic link sent to <span className="font-semibold">{email}</span>. Please check your email.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
            Send magic link
          </button>
        </form>
      )}
    </section>
  );
}
