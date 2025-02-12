"use client";

import { AuthHeader } from "@/components/auth/auth-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Mail } from "lucide-react";

export default function VerifyPage() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <AuthHeader />
      <Card className="w-[350px]">
        <CardHeader className="items-center justify-center space-y-1">
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>We&apos;ve sent you a verification email</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Mail className="h-10 w-10" />
          </div>
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Please check your email for a verification link. Click the link to verify your account and sign in. The
              link will expire in 24 hours.
            </p>
            <p className="pb-4 text-sm text-muted-foreground">
              If you don&apos;t see the email, check your spam folder.
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Back to login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
