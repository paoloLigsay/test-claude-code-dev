import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold text-neutral-200">Sign in</h1>
        {message && (
          <p className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm text-green-400">
            {message}
          </p>
        )}
        <LoginForm />
      </div>
    </div>
  );
}
