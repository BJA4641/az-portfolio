"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/alerts", label: "Alerts" },
  { href: "/properties", label: "Properties" },
  { href: "/leases", label: "Leases & Rent" },
  { href: "/maintenance", label: "Maintenance" },
  { href: "/sales", label: "Sales & Brokers" },
  { href: "/taxes", label: "Taxes & Fees" },
  { href: "/employees", label: "Employees" }
];

export function Nav() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col justify-between border-r border-[var(--border)] bg-brand-950 text-white">
      <div>
        <div className="flex items-center gap-2 px-5 py-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-brand-950">
            AZ
          </div>
          <span className="text-lg font-semibold">AZ Portfolio</span>
        </div>
        <nav className="flex flex-col gap-0.5 px-3">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mx-3 mb-5 rounded-lg px-3 py-2 text-left text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
      >
        Sign out
      </button>
    </aside>
  );
}
