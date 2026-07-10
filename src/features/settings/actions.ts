"use server";

import { revalidatePath } from "next/cache";

import {
  createErrorResult,
  createSuccessResult,
  type ActionResult,
} from "@/lib/errors/safe-action-result";
import { createClient } from "@/lib/supabase/server";

export type ProfileSettingsState = ActionResult<{
  displayName: string;
  message: string;
}>;

const DISPLAY_NAME_MAX_LENGTH = 80;

function normalizeDisplayName(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function getGoogleDisplayName(userMetadata: Record<string, unknown>): string {
  const fullName = userMetadata.full_name;
  const name = userMetadata.name;

  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  return "";
}

function getFallbackName(email?: string | null): string {
  const localPart = email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();

  if (!localPart) {
    return "CVMatch user";
  }

  return localPart
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

export async function updateProfileDisplayNameAction(
  _previousState: ProfileSettingsState,
  formData: FormData
): Promise<ProfileSettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return createErrorResult({
      code: "UNAUTHORIZED",
      message: "You need to sign in again.",
    });
  }

  const intent = formData.get("intent");
  const displayName =
    intent === "google"
      ? getGoogleDisplayName(user.user_metadata) || getFallbackName(user.email)
      : normalizeDisplayName(formData.get("displayName"));

  if (displayName.length < 2) {
    return createErrorResult({
      code: "INVALID_DISPLAY_NAME",
      message: "Use at least 2 characters for your display name.",
    });
  }

  if (displayName.length > DISPLAY_NAME_MAX_LENGTH) {
    return createErrorResult({
      code: "INVALID_DISPLAY_NAME",
      message: "Keep your display name under 80 characters.",
    });
  }

  const avatarUrl =
    typeof user.user_metadata.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    full_name: displayName,
    avatar_url: avatarUrl,
  });

  if (error) {
    return createErrorResult({
      code: "DATABASE_WRITE_FAILED",
      message: "Your profile could not be updated. Please try again.",
    });
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return createSuccessResult({
    displayName,
    message: "Profile name updated.",
  });
}
