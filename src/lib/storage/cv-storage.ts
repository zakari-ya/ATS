import "server-only";

import type { createClient } from "@/lib/supabase/server";
export { buildCvStoragePath } from "@/lib/security/file-rules";

export const CV_UPLOAD_BUCKET = "cv-uploads";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type CvStorageDeleteResult =
  | {
      ok: true;
      cleanupWarning: false;
    }
  | {
      ok: true;
      cleanupWarning: true;
      message: string;
    }
  | {
      ok: false;
      errorCode: "STORAGE_DELETE_FAILED";
      message: string;
    };

export async function deleteCvUploadFromStorage({
  supabase,
  storagePath,
}: {
  supabase: ServerSupabaseClient;
  storagePath: string | null;
}): Promise<CvStorageDeleteResult> {
  if (!storagePath) {
    return {
      ok: true,
      cleanupWarning: false,
    };
  }

  const { error } = await supabase.storage
    .from(CV_UPLOAD_BUCKET)
    .remove([storagePath]);

  if (!error) {
    return {
      ok: true,
      cleanupWarning: false,
    };
  }

  if (isMissingStorageObjectError(error.message)) {
    return {
      ok: true,
      cleanupWarning: false,
    };
  }

  return {
    ok: true,
    cleanupWarning: true,
    message: "The scan was deleted, but the file cleanup needs to be retried.",
  };
}

function isMissingStorageObjectError(message: string): boolean {
  const normalizedMessage = message.toLowerCase();

  return (
    normalizedMessage.includes("not found") ||
    normalizedMessage.includes("no rows found") ||
    normalizedMessage.includes("does not exist")
  );
}
