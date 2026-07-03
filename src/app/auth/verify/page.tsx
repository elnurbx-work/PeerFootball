import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";
import { verifyEmailToken } from "@/server/services/auth.service";

type VerifyPageProps = {
  searchParams: Promise<{
    email?: string | string[];
    token?: string | string[];
  }>;
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const email = firstParam(params.email);
  const token = firstParam(params.token);
  const verified = email && token ? await verifyEmailToken(email, token) : false;

  return (
    <section className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-md bg-secondary">
            {verified ? (
              <CheckCircle2 className="h-6 w-6 text-primary" />
            ) : (
              <XCircle className="h-6 w-6 text-destructive" />
            )}
          </div>
          <CardTitle>{verified ? "Email verified" : "Verification failed"}</CardTitle>
          <CardDescription>
            {verified
              ? "Your FanPitch account is ready. You can sign in now."
              : "This verification link is invalid or expired."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {verified ? (
            <Button asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
          ) : (
            <ResendVerificationForm />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
