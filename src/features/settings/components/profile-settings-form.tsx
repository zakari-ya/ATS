"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, RotateCcw, Save } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateProfileDisplayNameAction,
  type ProfileSettingsState,
} from "@/features/settings/actions";

type ProfileSettingsFormProps = {
  defaultDisplayName: string;
  googleDisplayName: string | null;
  email: string;
};

const initialState: ProfileSettingsState = {
  ok: true,
  data: {
    displayName: "",
    message: "",
  },
};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      name="intent"
      value="save"
      disabled={pending}
      className="h-11 rounded-xl bg-[#183f3a] px-4 text-white hover:bg-[#1f4d47]"
    >
      <Save className="size-4" aria-hidden="true" />
      {pending ? "Saving" : "Save name"}
    </Button>
  );
}

function GoogleNameButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      name="intent"
      value="google"
      variant="outline"
      disabled={pending || disabled}
      className="h-11 rounded-xl border-[rgba(31,77,71,0.14)] bg-white text-[#183f3a] hover:bg-[#eef4f2]"
    >
      <RotateCcw className="size-4" aria-hidden="true" />
      Use Google name
    </Button>
  );
}

export function ProfileSettingsForm({
  defaultDisplayName,
  googleDisplayName,
  email,
}: ProfileSettingsFormProps) {
  const [state, formAction] = useActionState(
    updateProfileDisplayNameAction,
    initialState
  );
  const currentDisplayName =
    state.ok && state.data.displayName ? state.data.displayName : defaultDisplayName;

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="displayName" className="text-[#183f3a]">
          Display name
        </Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={currentDisplayName}
          maxLength={80}
          autoComplete="name"
          className="h-12 rounded-xl border-[rgba(31,77,71,0.14)] bg-[#f8f7f3] text-[#183f3a]"
        />
        <p className="text-sm leading-6 text-[#66736f]">
          This name appears on your dashboard. Your login email stays{" "}
          <span className="font-medium text-[#365a54]">{email}</span>.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <SaveButton />
        <GoogleNameButton disabled={!googleDisplayName} />
      </div>

      {googleDisplayName ? (
        <p className="text-xs leading-5 text-[#66736f]">
          Google account name available: {googleDisplayName}
        </p>
      ) : null}

      {!state.ok ? (
        <Alert className="border-[#f0c8c8] bg-[#fff7f7] text-[#8a2d2d]">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Profile update failed</AlertTitle>
          <AlertDescription className="text-[#8a2d2d]">
            {state.error.message}
          </AlertDescription>
        </Alert>
      ) : state.data.message ? (
        <Alert className="border-[#b9dec9] bg-[#effaf4] text-[#17623a]">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          <AlertTitle>Profile updated</AlertTitle>
          <AlertDescription className="text-[#276948]">
            {state.data.message}
          </AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
