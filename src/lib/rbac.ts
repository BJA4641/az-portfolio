import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export class ForbiddenError extends Error {}

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getSessionRole(): Promise<string | undefined> {
  const session = await getServerSession(authOptions);
  return (session?.user as { role?: string } | undefined)?.role;
}

/** The lease a TENANT session is scoped to, or undefined for non-tenants. */
export async function getSessionLeaseId(): Promise<string | undefined> {
  const session = await getServerSession(authOptions);
  return (session?.user as { leaseId?: string } | undefined)?.leaseId;
}

export async function requireOwner() {
  const role = await getSessionRole();
  if (role !== "OWNER") {
    throw new ForbiddenError("Only the portfolio owner can delete records.");
  }
}

export async function requireTenant(): Promise<string> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; leaseId?: string } | undefined;
  if (user?.role !== "TENANT" || !user.leaseId) {
    throw new ForbiddenError("Tenant portal access only.");
  }
  return user.leaseId;
}
