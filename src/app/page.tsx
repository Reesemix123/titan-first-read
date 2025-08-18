import Link from "next/link";

export default function Home() {
  // (Optional) temp check for your envs
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("Supabase Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-4xl font-bold text-indigo-700 mb-6">Welcome to Titan 🚀</h1>
      <p className="text-gray-700 mb-6">Choose a page to visit:</p>
      <div className="flex gap-4">
        <Link
          href="/about"
          className="px-5 py-3 rounded-lg bg-indigo-600 text-white shadow hover:bg-indigo-700 transition"
        >
          About
        </Link>
        <Link
          href="/contact"
          className="px-5 py-3 rounded-lg bg-emerald-600 text-white shadow hover:bg-emerald-700 transition"
        >
          Contact
        </Link>
      </div>
    </main>
  );
}
