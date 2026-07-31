"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Modal({ title, eyebrow, children, onClose, wide = false }) {
  useEffect(() => {
    function closeOnEscape(event) { if (event.key === "Escape") onClose(); }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal-card${wide ? " wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <div>{eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}<h2>{title}</h2></div>
          <Button variant="ghost" size="icon" aria-label="Fechar" onClick={onClose}><X /></Button>
        </header>
        {children}
      </section>
    </div>
  );
}
