"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

// Envoltorio con la misma firma que el Modal original (title, children,
// onClose, wide), pero construido sobre el Dialog real de shadcn/Radix:
// mismo comportamiento de foco/teclado/Escape que antes, ahora resuelto
// por Radix en vez de código propio.
export default function Modal({ title, children, onClose, wide = false }) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className={wide ? "sm:max-w-2xl" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
