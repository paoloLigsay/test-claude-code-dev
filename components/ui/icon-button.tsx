import { type ButtonHTMLAttributes, forwardRef } from "react";

const variantStyles = {
  ghost: "text-neutral-500 hover:text-neutral-300 hover:bg-white/5",
  destructive: "text-neutral-500 hover:text-red-400 hover:bg-red-500/10",
} as const;

const sizeStyles = {
  sm: "w-6 h-6",
  md: "w-7 h-7",
} as const;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
};

export const IconButton = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "ghost", size = "sm", className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-lg transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      />
    );
  }
);

IconButton.displayName = "IconButton";
