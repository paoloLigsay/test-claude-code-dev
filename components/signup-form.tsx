"use client";

import { useActionState } from "react";
import { signUp } from "@/app/auth/actions";
import Link from "next/link";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

type State = { error: string } | null;

export function SignUpForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => {
      const result = await signUp(formData);
      return result ?? null;
    },
    null
  );

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-neutral-400">
          Email
        </label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="password"
          className="text-sm font-medium text-neutral-400"
        >
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
        />
      </div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <Button type="submit" variant="primary" size="lg" disabled={pending}>
        {pending ? "Signing up..." : "Sign up"}
      </Button>
      <p className="text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="text-brand hover:text-brand-hover">
          Sign in
        </Link>
      </p>
    </form>
  );
}
