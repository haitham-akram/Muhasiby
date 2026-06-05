"use client";

import { signOut } from "next-auth/react";
import { useLanguage } from "@/app/providers";

export default function LogoutButton() {
  const { t } = useLanguage();
  return (
    <button
      className="rounded-xl bg-black px-4 py-2 text-sm text-white"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      {t('nav.logout')}
    </button>
  );
}
