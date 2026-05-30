"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Today" },
  { href: "/summary", label: "Summary" },
  { href: "/history", label: "History" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-10 flex flex-col gap-2 text-sm text-text-secondary">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "rounded-xl px-3 py-2 transition",
              isActive
                ? "bg-black text-white"
                : "text-text-secondary hover:bg-black/5"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
