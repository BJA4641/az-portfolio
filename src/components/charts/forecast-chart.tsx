"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SEQUENTIAL_BLUE, CHROME } from "@/lib/colors";
import { formatMoney } from "@/lib/format";

export function ForecastChart({
  data,
  valueLabel,
  currency
}: {
  data: { year: number; value: number }[];
  valueLabel: string;
  currency: string;
}) {
  const formatValue = (v: number) => formatMoney(v, currency);
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={CHROME.gridline} />
        <XAxis
          dataKey="year"
          tickFormatter={(y) => `Yr ${y}`}
          axisLine={{ stroke: CHROME.baseline }}
          tickLine={false}
          tick={{ fill: CHROME.mutedInk, fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: CHROME.mutedInk, fontSize: 12 }}
          tickFormatter={(v) => formatValue(v)}
          width={64}
        />
        <Tooltip
          formatter={(v: number) => [formatValue(v), valueLabel]}
          labelFormatter={(y) => `Year ${y}`}
          contentStyle={{ borderRadius: 8, borderColor: CHROME.gridline, fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={SEQUENTIAL_BLUE[450]}
          strokeWidth={2}
          dot={{ r: 4, fill: SEQUENTIAL_BLUE[450] }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
