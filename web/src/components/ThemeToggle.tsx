"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("pdfumi_theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      applyTheme(stored);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial = prefersDark ? "dark" : "light";
      setTheme(initial);
      applyTheme(initial);
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("pdfumi_theme")) {
        const next = e.matches ? "dark" : "light";
        setTheme(next);
        applyTheme(next);
      }
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  function applyTheme(target: "light" | "dark") {
    if (target === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("pdfumi_theme", next);
    applyTheme(next);
  }

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full glass-pill flex items-center justify-center opacity-60" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      title={theme === "dark" ? "Mode Terang" : "Mode Gelap"}
      className="relative flex h-9 w-9 items-center justify-center rounded-full glass-pill text-[color:var(--ink)]/80 hover:text-[color:var(--accent)] hover:scale-105 transition-all shadow-xs cursor-pointer"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-amber-300 transition-transform duration-300 rotate-0 hover:rotate-90" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
