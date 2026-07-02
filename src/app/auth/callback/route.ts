import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

const DEFAULT_REDIRECT_PATH = "/dashboard";
const AUTH_CALLBACK_ERROR_PATH = "/login?error=auth_callback_failed";

function isSafeInternalRedirect(path: string | null): path is string {
  return Boolean(path && path.startsWith("/") && !path.startsWith("//"));
}

function getRedirectUrl(requestUrl: URL): URL {
  const nextPath = requestUrl.searchParams.get("next");
  const redirectPath = isSafeInternalRedirect(nextPath)
    ? nextPath
    : DEFAULT_REDIRECT_PATH;

  return new URL(redirectPath, requestUrl.origin);
}

function getErrorRedirectUrl(requestUrl: URL): URL {
  return new URL(AUTH_CALLBACK_ERROR_PATH, requestUrl.origin);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(getErrorRedirectUrl(requestUrl));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(getErrorRedirectUrl(requestUrl));
  }

  return NextResponse.redirect(getRedirectUrl(requestUrl));
}
