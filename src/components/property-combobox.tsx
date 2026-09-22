"use client";

import { useMemo, useState } from "react";

type PropertyOption = { id: string; name: string; country: string };

export function PropertyCombobox({
  properties,
  name,
  defaultValue,
  required,
  placeholder = "Search properties..."
}: {
  properties: PropertyOption[];
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const defaultProperty = properties.find((p) => p.id === defaultValue);
  const [query, setQuery] = useState(
    defaultProperty ? `${defaultProperty.name} — ${defaultProperty.country}` : ""
  );
  const [selectedId, setSelectedId] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    if (!query) return properties.slice(0, 8);
    const q = query.toLowerCase();
    return properties
      .filter((p) => p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, properties]);

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selectedId} required={required} />
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        className="input w-full"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedId("");
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-[var(--border)] bg-white shadow-lg">
          {matches.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                onClick={() => {
                  setSelectedId(p.id);
                  setQuery(`${p.name} — ${p.country}`);
                  setOpen(false);
                }}
              >
                {p.name} <span className="text-[var(--text-muted)]">— {p.country}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
