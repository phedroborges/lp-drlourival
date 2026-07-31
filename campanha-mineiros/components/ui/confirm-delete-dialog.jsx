"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * Substitui os confirm() nativos do app. Uso com trigger (mais comum):
 *   <ConfirmDeleteDialog trigger={<Button variant="destructive">Excluir</Button>} onConfirm={...} />
 * Uso controlado (ex.: disparado de dentro de um DropdownMenu):
 *   <ConfirmDeleteDialog open={open} onOpenChange={setOpen} onConfirm={...} />
 */
export function ConfirmDeleteDialog({
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  title = "Tem certeza?",
  description,
  confirmLabel = "Excluir",
  onConfirm,
}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChangeProp ?? setOpenState;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger ? <AlertDialogTrigger render={trigger} /> : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
