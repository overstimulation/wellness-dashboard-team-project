"use client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);

  // Removed automatic timeout: user must drag the gif upwards to dismiss.
  // Dismiss when the user drags the gif up past a threshold.

  const handleDragEnd = (
    _: any,
    info: { offset: { x: number; y: number } }
  ) => {
    const threshold = -120; // pixels: negative = upwards
    if (info?.offset?.y <= threshold) {
      setShowIntro(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-900 font-sans overflow-hidden transition-colors duration-300">
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50"
          >
            <motion.img
              src="/welcome.gif"
              alt="Welcome"
              className="w-64 h-64 touch-none"
              drag="y"
              dragElastic={0.2}
              dragConstraints={{ top: -400, bottom: 0 }}
              onDragEnd={handleDragEnd}
              whileTap={{ scale: 0.98 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
          Wellness Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">Zadbaj o swoje samopoczucie 🌿</p>

        <Link
          href="/login"
          className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 transition"
        >
          Zaloguj się
        </Link>
      </div>
    </main>
  );
}
