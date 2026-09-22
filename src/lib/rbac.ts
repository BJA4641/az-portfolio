import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export class ForbiddenError extends Error {}

export async function requireOwner() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "OWNER") {
    throw new ForbiddenError("Only the portfolio owner can delete records.");
  }
}
