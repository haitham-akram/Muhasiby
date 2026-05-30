"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      className="rounded-xl bg-black px-4 py-2 text-sm text-white"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Logout
    </button>
  );
}
