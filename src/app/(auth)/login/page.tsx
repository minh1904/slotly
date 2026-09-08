import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/home");
  }

  return (
    <>
      <h1 className="font-semibold text-2xl">Welcome back</h1>
      <p className="mt-2 text-muted-foreground text-sm">
        Log in to your Slotly account to manage your availability and bookings.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-muted-foreground text-sm">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Sign up
        </Link>
      </p>
    </>
  );
}
