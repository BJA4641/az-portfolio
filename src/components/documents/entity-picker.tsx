"use client";

import { useMemo, useState } from "react";

type Option = { id: string; label: string };

export function EntityPicker({ entities }: { entities: Record<string, Option[]> }) {
  const types = Object.keys(entities);
  const [type, setType] = useState(types[0] ?? "");
  const options = entities[type] ?? [];
  const [entityId, setEntityId] = useState(options[0]?.id ?? "");

  const label = useMemo(() => options.find((o) => o.id === entityId)?.label ?? "", [options, entityId]);

  return (
    <>
      <select
        name="entityType"
        value={type}
        onChange={(e) => {
          setType(e.target.value);
          setEntityId(entities[e.target.value]?.[0]?.id ?? "");
        }}
        className="input"
      >
        {types.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <select name="entityId" value={entityId} onChange={(e) => setEntityId(e.target.value)} className="input">
        {options.length === 0 && <option value="">No records yet</option>}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <input type="hidden" name="entityLabel" value={label} />
    </>
  );
}
