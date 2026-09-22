import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/delete-button";
import { formatMoney } from "@/lib/format";
import { createEmployee, deleteEmployee, toggleEmployeeActive } from "./actions";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const employees = await db.employee.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Employees" subtitle={`${employees.length} staff managing the portfolio`} />

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">Add employee</h2>
        <form action={createEmployee} className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          <input name="name" required placeholder="Name" className="input col-span-2" />
          <input name="role" required placeholder="Role" className="input" />
          <input name="country" required placeholder="Country" className="input" />
          <input name="email" type="email" placeholder="Email" className="input" />
          <input name="phone" placeholder="Phone" className="input" />
          <input type="number" step="0.01" name="salary" placeholder="Salary" className="input" />
          <input name="currency" defaultValue="USD" className="input" />
          <input type="date" name="hireDate" className="input" />
          <button type="submit" className="rounded-lg bg-brand-950 px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
            Add
          </button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Salary</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="table-row-hover border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 font-medium">
                  {e.name}
                  <p className="text-xs text-[var(--text-muted)]">{e.email}</p>
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{e.role}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{e.country}</td>
                <td className="px-4 py-3 tabular-nums">{e.salary ? formatMoney(e.salary, e.currency) : "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      e.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {e.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <form action={toggleEmployeeActive.bind(null, e.id, !e.active)}>
                      <button type="submit" className="text-xs font-medium text-brand-700 hover:underline">
                        {e.active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                    <DeleteButton action={deleteEmployee} id={e.id} />
                  </div>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  No employees yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
