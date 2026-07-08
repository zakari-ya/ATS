"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

function GoogleMark() {
  return (
    <span
      aria-hidden="true"
      className="flex size-5 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#171412]"
    >
      G
    </span>
  );
}

export function LoginCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleGoogleLogin() {
    setErrorMessage("");
    setIsLoading(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setIsLoading(false);
      setErrorMessage("Google sign-in could not start. Try again in a moment.");
      return;
    }

    if (data.url) {
      window.location.assign(data.url);
      return;
    }

    setIsLoading(false);
    setErrorMessage("Google sign-in could not start. Try again in a moment.");
  }

  return (
    <Card className="border-[#ded6c9] bg-white/90 p-2 shadow-2xl shadow-stone-900/10 backdrop-blur">
      <CardHeader className="space-y-5 px-5 pt-5 sm:px-7 sm:pt-7">
        <div className="flex items-center justify-between">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[#171412] text-white shadow-lg shadow-stone-900/15">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <span className="rounded-full border border-[#ded6c9] bg-[#f7f4ef] px-3 py-1 text-xs font-medium text-[#6d6255]">
            Google OAuth
          </span>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#9a7841]">
            CV Match Desk
          </p>
          <CardTitle className="text-3xl font-semibold tracking-tight text-[#171412]">
            Sign in to your review workspace
          </CardTitle>
          <CardDescription className="text-base leading-7 text-[#6d6255]">
            Upload your CV and compare it with any job post before applying.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-5 pb-5 sm:px-7 sm:pb-7">
        {errorMessage ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertTitle>Google sign-in could not start</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="button"
          size="lg"
          disabled={isLoading}
          onClick={handleGoogleLogin}
          className="h-12 w-full rounded-xl bg-[#171412] text-white shadow-lg shadow-stone-900/15 hover:bg-[#2a251f]"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Opening Google
            </>
          ) : (
            <>
              <GoogleMark />
              Continue with Google
              <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </Button>

        <p className="text-center text-sm leading-6 text-[#6d6255]">
          This is an ATS-style CV match analysis for CV readiness, not a hiring
          decision.
        </p>
      </CardContent>
    </Card>
  );
}
