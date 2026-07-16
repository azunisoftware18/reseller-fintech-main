"use client";

import { useForm } from "react-hook-form";
import { AlertCircle, Share2 } from "lucide-react";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";

export default function TenantSocialMediaForm({
  initialData = null,
  isPending,
  onSubmit,
}) {
  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      facebookUrl: "",
      twitterUrl: "",
      instagramUrl: "",
      linkedInUrl: "",
      youtubeUrl: "",
      ...initialData,
    },
  });

  const onFormSubmit = (data) => {
    clearErrors();

    // at least one link optional → no hard validation
    onSubmit(data, setError);
  };

  return (
    <>
      {errors?.root && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 mb-6">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm">{errors.root.message}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <InputField
          label="Facebook URL"
          name="facebookUrl"
          placeholder="https://facebook.com/yourpage"
          register={register}
          error={errors.facebookUrl}
        />

        <InputField
          label="Twitter / X URL"
          name="twitterUrl"
          placeholder="https://twitter.com/yourhandle"
          register={register}
          error={errors.twitterUrl}
        />

        <InputField
          label="Instagram URL"
          name="instagramUrl"
          placeholder="https://instagram.com/yourpage"
          register={register}
          error={errors.instagramUrl}
        />

        <InputField
          label="LinkedIn URL"
          name="linkedInUrl"
          placeholder="https://linkedin.com/company/yourcompany"
          register={register}
          error={errors.linkedInUrl}
        />

        <InputField
          label="YouTube URL"
          name="youtubeUrl"
          placeholder="https://youtube.com/@yourchannel"
          register={register}
          error={errors.youtubeUrl}
        />

        <Button
          type="submit"
          loading={isPending}
          className="w-full"
        >
          Save Social Media Links
        </Button>

        <div className="pt-4 border-t border-border text-center">
          <div className="flex justify-center gap-1 text-muted-foreground">
            <Share2 className="h-3 w-3" />
            <p className="text-xs">
              Social links appear on tenant public pages
            </p>
          </div>
        </div>
      </form>
    </>
  );
}
