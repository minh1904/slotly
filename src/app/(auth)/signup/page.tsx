import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SignupForm } from "@/features/auth/components/signup-form";
import { auth } from "@/lib/auth";

export default async function SignupPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/");
  }

  return (
    <>
      <h1 className="font-semibold text-2xl">Create your account</h1>
      <p className="mt-2 text-muted-foreground text-sm">
        Sign up for Slotly to start managing your availability and bookings.
      </p>
      <div className="mt-8">
        <SignupForm />
      </div>
      <p className="mt-6 text-center text-muted-foreground text-sm">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Log in
        </Link>
      </p>
    </>
  );
}
