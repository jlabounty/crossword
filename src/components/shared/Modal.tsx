import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) dialog.showModal();
    else dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="bg-[#1b4332] text-white rounded-xl p-6 shadow-2xl border border-white/20 max-w-sm w-full backdrop:bg-black/60"
      onClose={onClose}
    >
      {title && <h2 className="text-lg font-bold mb-4">{title}</h2>}
      {children}
    </dialog>
  );
}
