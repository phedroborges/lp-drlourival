"use client";

import { useTransition } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Spinner } from "@/components/ui/spinner";

const OPTIONS = [
  { value: "", label: "Sem leitura", on: "data-[state=on]:bg-muted data-[state=on]:text-foreground" },
  { value: "verde", label: "Verde", on: "data-[state=on]:bg-[var(--verde-soft)] data-[state=on]:text-[#176d3e]" },
  { value: "amarelo", label: "Amarelo", on: "data-[state=on]:bg-[var(--amarelo-soft)] data-[state=on]:text-[#836400]" },
  { value: "vermelho", label: "Vermelho", on: "data-[state=on]:bg-[var(--vermelho-soft)] data-[state=on]:text-[#a42e20]" },
];

/** Estado de temperatura política sempre visível, 1 clique pra trocar (substitui o quick-tag-select). */
export default function TemperatureToggle({ value = "", onSave, size = "sm" }) {
  const [pending, startTransition] = useTransition();

  return (
    <span className="inline-flex items-center gap-1.5">
      <ToggleGroup
        size={size}
        value={[value]}
        onValueChange={(next) => {
          const picked = next.find((item) => item !== value);
          if (picked === undefined) return;
          startTransition(() => onSave(picked));
        }}
      >
        {OPTIONS.map((option) => (
          <ToggleGroupItem
            key={option.value || "none"}
            value={option.value}
            className={option.on}
            disabled={pending}
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {pending ? <Spinner className="size-3" /> : null}
    </span>
  );
}
