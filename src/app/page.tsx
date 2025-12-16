"use client";

import Link from "next/link";
import BackgroundEmojis from "@/components/BackgroundEmojis";

export default function Home() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-950 font-sans overflow-hidden transition-colors duration-300">
      <BackgroundEmojis />

      <div className="relative z-10 p-8 md:p-12 text-center rounded-2xl bg-white/30 dark:bg-black/30 backdrop-blur-md shadow-xl border border-white/20 dark:border-white/10 max-w-lg mx-4">
        <h1 className="text-5xl font-extrabold text-blue-600 dark:text-blue-400 mb-4 tracking-tight drop-shadow-sm">
          Wellness Dashboard
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-200 mb-8 font-medium">
          Take care of your well-being 🌿
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 rounded-full bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800 transition-all shadow-lg backdrop-blur-sm transform hover:-translate-y-0.5"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}
