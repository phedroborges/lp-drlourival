"use client";

import { useState, useTransition } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "", label: "Sem leitura", variant: "neutral", dot: "bg-muted-foreground/40" },
  { value: "verde", label: "Apoio consolidado", variant: "verde", dot: "bg-[var(--verde)]" },
  { value: "amarelo", label: "Em aproximação", variant: "amarelo", dot: "bg-[var(--amarelo)]" },
  { value: "vermelho", label: "Resistência", variant: "vermelho", dot: "bg-[var(--vermelho)]" },
];

/**
 * Badge compacto (estado atual) que abre um popover com as opções ao clicar —
 * substitui o ToggleGroup de 4 botões sempre abertos.
 */
export default function TemperaturePicker({ value = "", onSave }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const current = OPTIONS.find((option) => option.value === value) || OPTIONS[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60"
            disabled={pending}
          >
            <Badge variant={current.variant}>
              <i className={cn("inline-block size-1.5 rounded-full", current.dot)} aria-hidden="true" />
              {current.label}
            </Badge>
            {pending ? <Spinner className="size-3" /> : null}
          </button>
        }
      />
      <PopoverContent className="w-auto p-1">
        <div className="flex flex-col gap-0.5">
          {OPTIONS.map((option) => (
            <button
              key={option.value || "none"}
              type="button"
              className="flex items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-muted"
              onClick={() => {
                setOpen(false);
                if (option.value === value) return;
                startTransition(() => onSave(option.value));
              }}
            >
              <Badge variant={option.variant}>
                <i className={cn("inline-block size-1.5 rounded-full", option.dot)} aria-hidden="true" />
                {option.label}
              </Badge>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
