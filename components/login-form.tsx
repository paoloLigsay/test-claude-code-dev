"use client";

import { useActionState, useState } from "react";
import { signIn } from "@/app/auth/actions";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

type State = { error: string } | null;

export function LoginForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => {
      const result = await signIn(formData);
      return result ?? null;
    },
    null
  );

  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setGoogleLoading(false);
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Button
        type="button"
        variant="default"
        size="lg"
        disabled={googleLoading}
        onClick={handleGoogleSignIn}
        className="w-full"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {googleLoading ? "Redirecting..." : "Continue with Google"}
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-700" />
        <span className="text-xs text-neutral-500">or</span>
        <div className="h-px flex-1 bg-neutral-700" />
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="email"
            className="text-sm font-medium text-neutral-400"
          >
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
          <Input id="password" name="password" type="password" required />
        </div>
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        <Button type="submit" variant="primary" size="lg" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </Button>
        <p className="text-center text-sm text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-brand hover:text-brand-hover">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
