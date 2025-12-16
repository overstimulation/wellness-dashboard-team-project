"use client";

import { useEffect, useState } from "react";
import { Moon, SunMoon } from "lucide-react";

// Key used in localStorage
const STORAGE_KEY = "wellnessDarkMode";

export default function ThemeToggle() {
  // Start with a deterministic value during SSR to avoid hydration mismatch.
  // We'll read localStorage and prefers-color-scheme only on the client after mount.
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // After mount, read persisted theme or OS preference and apply it.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let preferDark = false;
      if (stored !== null) preferDark = stored === "true";
      else if (window.matchMedia)
        preferDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(preferDark);
      setMounted(true);
    } catch (e) {
      // ignore
      setMounted(true);
    }
  }, []);

  // Apply theme to document root whenever isDark changes (client-only)
  useEffect(() => {
    if (!mounted) return;
    try {
      if (isDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      localStorage.setItem(STORAGE_KEY, isDark ? "true" : "false");
    } catch (e) {
      // ignore
    }
  }, [isDark, mounted]);

  // Sync across tabs (client-only)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setIsDark(e.newValue === "true");
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setIsDark((s) => !s)}
      className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
    >
      {/* Use Moon icon for dark, SunMoon for light to indicate toggle.
          To avoid hydration mismatch we render the same default icon on the
          server/client initial render (isDark=false) and allow the client to
          update after mount. */}
      {isDark ? <SunMoon size={20} /> : <Moon size={20} />}
    </button>
  );
}
