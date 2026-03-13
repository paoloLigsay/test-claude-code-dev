import type { ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "./icon-button";

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function Modal({ title, onClose, children, footer }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-xl border border-neutral-700 bg-neutral-800 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-700 px-4 py-3">
          <h3 className="text-sm font-medium text-neutral-200">{title}</h3>
          <IconButton onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="px-4 py-3">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-neutral-700 px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
