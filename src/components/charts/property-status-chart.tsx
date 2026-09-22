"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORICAL, CHROME } from "@/lib/colors";

const STATUS_ORDER = [
  { key: "OWNED", label: "Owned", color: CATEGORICAL.blue },
  { key: "FOR_SALE", label: "For Sale", color: CATEGORICAL.orange },
  { key: "SOLD", label: "Sold", color: CATEGORICAL.aqua }
];

export function PropertyStatusChart({ counts }: { counts: Record<string, number> }) {
  const data = STATUS_ORDER.map((s) => ({
    name: s.label,
    count: counts[s.key] ?? 0,
    color: s.color
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={CHROME.gridline} />
          <XAxis
            dataKey="name"
            axisLine={{ stroke: CHROME.baseline }}
            tickLine={false}
            tick={{ fill: CHROME.mutedInk, fontSize: 12 }}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: CHROME.mutedInk, fontSize: 12 }}
            width={28}
          />
          <Tooltip
            cursor={{ fill: "rgba(11,11,11,0.04)" }}
            contentStyle={{ borderRadius: 8, borderColor: CHROME.gridline, fontSize: 12 }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={56}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex gap-4 text-xs text-[var(--text-muted)]">
        {STATUS_ORDER.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: s.color }}
            />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
