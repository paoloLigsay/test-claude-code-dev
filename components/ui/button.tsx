import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";

const variantStyles = {
  default:
    "bg-neutral-700 text-neutral-200 hover:bg-neutral-600 border border-neutral-600",
  primary:
    "bg-brand text-white hover:bg-brand-hover",
  ghost:
    "text-neutral-400 hover:text-neutral-200 hover:bg-white/5",
  destructive:
    "text-red-400 hover:text-red-300 hover:bg-red-500/10",
} as const;

const sizeStyles = {
  sm: "px-2 py-1 text-xs gap-1.5",
  md: "px-3 py-1.5 text-sm gap-2",
  lg: "px-4 py-2 text-sm gap-2",
} as const;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  icon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "default", size = "md", icon, children, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {icon}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
