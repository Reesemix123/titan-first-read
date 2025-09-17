import Link from "next/link";

export default function Home() {
  return (
    <main className="bg-white">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-semibold text-gray-900 mb-6 tracking-tight">
            Football Coaching
            <span className="block text-indigo-600">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Organize your teams, manage playbooks, analyze game film, and track performance all in one place.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link
              href="/setup"
              className="px-8 py-4 bg-indigo-600 text-white font-medium text-lg rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/film"
              className="px-8 py-4 border border-gray-300 text-gray-700 font-medium text-lg rounded-lg hover:bg-gray-50 transition-colors"
            >
              Browse Film
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-3xl font-semibold text-gray-900 text-center mb-16">
            Everything you need to coach effectively
          </h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Team Management</h3>
              <p className="text-gray-600 leading-relaxed">
                Organize multiple teams, set colors and levels, and manage your coaching staff all in one place.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Game Film</h3>
              <p className="text-gray-600 leading-relaxed">
                Upload, organize, and analyze game footage. Create games and associate videos for easy review.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Digital Playbook</h3>
              <p className="text-gray-600 leading-relaxed">
                Upload playbook PDFs and create digital plays with auto-generated codes for easy organization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto text-center px-8">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">
            Ready to elevate your coaching?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join coaches who are already using Titan First Read to organize their teams and improve their game.
          </p>
          <Link
            href="/setup"
            className="px-8 py-4 bg-indigo-600 text-white font-medium text-lg rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Start Building Your Team
          </Link>
        </div>
      </section>
    </main>
  );
}