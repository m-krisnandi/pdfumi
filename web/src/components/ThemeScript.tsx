"use client";

import { useServerInsertedHTML } from "next/navigation";

// Filter out false-positive React 19 script tag warnings if any occur in dev
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) {
      return;
    }
    origError.apply(console, args);
  };
}

const themeInitScript = `(function(){try{var t=localStorage.getItem("pdfumi_theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark");}else{document.documentElement.classList.remove("dark");}}catch(e){}})();`;

/**
 * Injects the theme initialization script during SSR via `useServerInsertedHTML`.
 * This prevents FOUC (flash of unstyled theme) while avoiding raw `<script>` tags
 * inside React client component renders during client-side navigation (e.g. language switching).
 */
export function ThemeScript() {
  useServerInsertedHTML(() => {
    return (
      <script
        key="pdfumi-theme-init"
        dangerouslySetInnerHTML={{
          __html: themeInitScript,
        }}
      />
    );
  });

  return null;
}
