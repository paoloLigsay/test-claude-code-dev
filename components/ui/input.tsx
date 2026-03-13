import { type InputHTMLAttributes, forwardRef } from "react";

const sizeStyles = {
  sm: "px-1.5 py-0.5 text-sm",
  md: "px-3 py-2 text-sm",
} as const;

type Props = InputHTMLAttributes<HTMLInputElement> & {
  inputSize?: keyof typeof sizeStyles;
};

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ inputSize = "md", className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full rounded-lg border border-neutral-600 bg-neutral-800 text-neutral-200 transition-colors placeholder:text-neutral-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand ${sizeStyles[inputSize]} ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
