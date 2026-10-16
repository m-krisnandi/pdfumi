"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { AUTH_CHANGE_EVENT, isSignedIn } from "@/lib/apiKey";
import { Sparkles, User } from "lucide-react";

export function AccountNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function sync() {
      setSignedIn(isSignedIn());
      setReady(true);
    }
    sync();
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const onAccount = pathname === "/account" || pathname.startsWith("/account/");

  if (!ready) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-block h-8 w-16 rounded-full bg-zinc-200/50 dark:bg-white/5 animate-pulse" />
      </div>
    );
  }

  if (signedIn) {
    return (
      <div className="flex items-center gap-2.5">
        <Link
          href="/pricing"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-teal-500 to-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-90 transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Get Pro</span>
        </Link>
        <Link
          href="/account"
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
            onAccount
              ? "bg-teal-500/15 text-teal-600 dark:text-teal-400"
              : "border border-zinc-200 dark:border-white/10 bg-white/60 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-teal-500"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>{t("account")}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/account#sign-in"
        className="rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-zinc-900/5 dark:hover:bg-white/10 transition cursor-pointer"
      >
        {t("signIn")}
      </Link>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-1.5 text-xs font-bold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Get Pro</span>
      </Link>
    </div>
  );
}
