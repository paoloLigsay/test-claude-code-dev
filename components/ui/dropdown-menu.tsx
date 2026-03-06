import type { ReactNode } from "react";

type DropdownMenuProps = {
  children: ReactNode;
  onMouseLeave?: () => void;
};

export function DropdownMenu({ children, onMouseLeave }: DropdownMenuProps) {
  return (
    <div
      className="absolute right-0 top-6 z-10 min-w-[160px] rounded-xl border border-neutral-700 bg-neutral-800 py-1 shadow-lg shadow-black/30"
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}

type MenuItemProps = {
  icon?: ReactNode;
  children: ReactNode;
  variant?: "default" | "destructive";
  onClick: () => void;
};

export function MenuItem({ icon, children, variant = "default", onClick }: MenuItemProps) {
  const colorClass =
    variant === "destructive"
      ? "text-red-400 hover:bg-red-500/10"
      : "text-neutral-300 hover:bg-white/5";

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm transition-colors ${colorClass}`}
    >
      {icon}
      {children}
    </button>
  );
}
