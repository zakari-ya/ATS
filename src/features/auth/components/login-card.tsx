"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
    <div className="rounded-[1.7rem] border border-[#1f4d47]/10 bg-white/82 p-4 shadow-[0_30px_90px_-58px_rgba(24,63,58,0.75)] backdrop-blur sm:rounded-[2rem] sm:p-7">
      <div className="space-y-5 sm:space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#66736f] transition-colors hover:text-[#183f3a]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to home
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Image
              src="/cvmatch-logo-navbar.png"
              alt="CVMatch logo"
              width={56}
              height={56}
              className="size-10 object-contain sm:size-12"
              priority
            />
            <span
              className="truncate text-[1.65rem] font-semibold tracking-tight text-[#1f4d47] sm:text-2xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              CVMatch
            </span>
          </div>
          <span className="rounded-full border border-[#1f4d47]/10 bg-[#e6f0ee] px-3 py-1 text-[11px] font-medium text-[#365a54] sm:text-xs">
            Google OAuth
          </span>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#66736f] sm:text-sm sm:tracking-[0.2em]">
            Private scan account
          </p>
          <h1
            className="text-[2.2rem] leading-[0.96] tracking-tight text-[#183f3a] sm:text-[2.85rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Welcome to CVMatch
          </h1>
          <p className="text-sm leading-6 text-[#66736f] sm:text-base sm:leading-7">
            Continue with Google to scan your CV, review job-specific gaps, and
            keep your results connected to your account.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4 sm:mt-7 sm:space-y-5">
        {errorMessage ? (
          <Alert variant="destructive" className="rounded-2xl">
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
          className="h-12 w-full rounded-full bg-[#1f4d47] text-sm text-white shadow-[0_18px_40px_-24px_rgba(24,63,58,0.7)] hover:bg-[#183f3a] sm:h-13"
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

        <div className="rounded-[1.3rem] bg-[#e6f0ee]/72 p-3.5 sm:rounded-2xl sm:p-4">
          <p className="flex items-start gap-2 text-sm leading-6 text-[#365a54]">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#1f4d47]" aria-hidden="true" />
            <span>
              Your scans stay private to your account. CVMatch gives ATS-style
              feedback, not a hiring decision.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
