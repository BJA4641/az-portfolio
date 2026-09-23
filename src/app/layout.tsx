import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { TenantNav } from "@/components/tenant-nav";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "AZ Portfolio",
  description: "Real estate portfolio management dashboard"
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {session ? (
            <div className="flex min-h-screen">
              {role === "TENANT" ? <TenantNav /> : <Nav />}
              <main className="flex-1 overflow-y-auto p-8">{children}</main>
            </div>
          ) : (
            children
          )}
        </Providers>
      </body>
    </html>
  );
}
