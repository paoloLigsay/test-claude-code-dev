import { SignUpForm } from "@/components/signup-form";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold text-neutral-200">
          Create an account
        </h1>
        <SignUpForm />
      </div>
    </div>
  );
}
