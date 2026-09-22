"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  country: z.string().min(1),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  salary: z.coerce.number().optional().nullable(),
  currency: z.string().min(1),
  hireDate: z.string().optional().nullable(),
  active: z.coerce.boolean().optional()
});

export async function createEmployee(formData: FormData) {
  const data = schema.parse({
    name: formData.get("name"),
    role: formData.get("role"),
    country: formData.get("country"),
    email: formData.get("email") || null,
    phone: formData.get("phone") || null,
    salary: formData.get("salary") || null,
    currency: formData.get("currency"),
    hireDate: formData.get("hireDate") || null
  });
  await db.employee.create({
    data: { ...data, hireDate: data.hireDate ? new Date(data.hireDate) : null }
  });
  revalidatePath("/employees");
}

export async function toggleEmployeeActive(id: string, active: boolean) {
  await db.employee.update({ where: { id }, data: { active } });
  revalidatePath("/employees");
}

export async function deleteEmployee(formData: FormData) {
  const id = formData.get("id") as string;
  await db.employee.delete({ where: { id } });
  revalidatePath("/employees");
}
