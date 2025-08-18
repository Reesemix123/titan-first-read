import Link from "next/link";

export default function About() {
  return (
    <section className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-lg ring-1 ring-black/5">
      <h1 className="mb-4 text-3xl font-bold text-indigo-700">About Us</h1>
      <p className="mb-6 text-gray-700">
        This is the About page. You can tell visitors more about your project here.
      </p>
      <Link href="/" className="text-indigo-600 underline underline-offset-2 hover:text-indigo-700">
        ← Back to Home
      </Link>
    </section>
  );
}
