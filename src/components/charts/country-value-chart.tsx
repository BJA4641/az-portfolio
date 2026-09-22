"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SEQUENTIAL_BLUE, CHROME } from "@/lib/colors";

export function CountryValueChart({
  data
}: {
  data: { country: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke={CHROME.gridline} />
        <XAxis
          type="number"
          axisLine={false}
          tickLine={false}
          tick={{ fill: CHROME.mutedInk, fontSize: 12 }}
          tickFormatter={(v) => `$${Intl.NumberFormat("en-US", { notation: "compact" }).format(v)}`}
        />
        <YAxis
          type="category"
          dataKey="country"
          axisLine={{ stroke: CHROME.baseline }}
          tickLine={false}
          tick={{ fill: CHROME.mutedInk, fontSize: 12 }}
          width={90}
        />
        <Tooltip
          cursor={{ fill: "rgba(11,11,11,0.04)" }}
          formatter={(v: number) => [`$${v.toLocaleString()}`, "Portfolio value"]}
          contentStyle={{ borderRadius: 8, borderColor: CHROME.gridline, fontSize: 12 }}
        />
        <Bar dataKey="value" fill={SEQUENTIAL_BLUE[450]} radius={[0, 4, 4, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
