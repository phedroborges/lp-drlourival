"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const TRIGGER_CLASS =
  "inline-flex max-w-full items-center gap-1.5 rounded px-1 -mx-1 text-left outline-none transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60";

/** Clique no texto -> Popover com Input/Textarea -> salva no Enter/blur. */
export function EditableText({
  value,
  placeholder = "—",
  onSave,
  className,
  type = "text",
  multiline = false,
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [pending, startTransition] = useTransition();
  const fieldRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      fieldRef.current?.focus();
      fieldRef.current?.select?.();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  function commit(next) {
    setOpen(false);
    const trimmed = next.trim();
    if (trimmed === (value ?? "")) return;
    startTransition(() => {
      onSave(trimmed);
    });
  }

  const Field = multiline ? Textarea : Input;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDraft(value ?? "");
          setOpen(true);
        } else {
          commit(draft);
        }
      }}
    >
      <PopoverTrigger
        render={
          <button
            type="button"
            data-slot="editable-field-trigger"
            className={cn(TRIGGER_CLASS, className)}
            disabled={pending}
          >
            <span className={cn(!value && "text-muted-foreground")}>{value || placeholder}</span>
            {pending ? <Spinner className="size-3" /> : null}
          </button>
        }
      />
      <PopoverContent className="w-64 p-2">
        <Field
          ref={fieldRef}
          type={multiline ? undefined : type}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !multiline) commit(draft);
            if (event.key === "Escape") setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

/** Valor exibido como texto -> clique abre um Select (shadcn) já posicionado no lugar. */
export function EditableSelect({
  value,
  options,
  placeholder = "Selecionar",
  onSave,
  className,
  triggerClassName,
}) {
  const [pending, startTransition] = useTransition();
  const current = options.find((option) => option.value === value);

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Select
        value={value ?? ""}
        onValueChange={(next) => {
          if (next === (value ?? "")) return;
          startTransition(() => onSave(next));
        }}
      >
        <SelectTrigger
          size="sm"
          disabled={pending}
          className={cn(
            "h-auto w-fit gap-1 border-none bg-transparent px-1 py-0.5 text-inherit shadow-none hover:bg-muted disabled:opacity-60",
            triggerClassName
          )}
        >
          <SelectValue placeholder={placeholder}>{current?.label ?? placeholder}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending ? <Spinner className="size-3" /> : null}
    </span>
  );
}
