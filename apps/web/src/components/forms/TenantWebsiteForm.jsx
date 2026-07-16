"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, ImageIcon } from "lucide-react";
import Image from "next/image";

import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import TextareaField from "@/components/ui/TextareaField";

export default function TenantWebsiteForm({
  initialData = null,
  isPending,
  onSubmit,
}) {
  const [logoPreview, setLogoPreview] = useState(initialData?.logoUrl || null);
  const [faviconPreview, setFaviconPreview] = useState(
    initialData?.favIconUrl || null,
  );

  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      brandName: "",
      tagLine: "",
      primaryColor: "#f59e0a",
      secondaryColor: "#262626",
      supportEmail: "",
      supportPhone: "",
      ...initialData,
    },
  });

  /* ================= SUBMIT ================= */
  const onFormSubmit = (data) => {
    clearErrors();

    if (!data.brandName?.trim()) {
      setError("brandName", { message: "Brand name is required" });
      return;
    }

    const formData = new FormData();

    formData.append("brandName", data.brandName ?? "");
    formData.append("tagLine", data.tagLine ?? "");
    formData.append("primaryColor", data.primaryColor ?? "");
    formData.append("secondaryColor", data.secondaryColor ?? "");
    formData.append("supportEmail", data.supportEmail ?? "");
    formData.append("supportPhone", data.supportPhone ?? "");

    if (data.logo?.[0]) formData.append("logo", data.logo[0]);
    if (data.favicon?.[0]) formData.append("favicon", data.favicon[0]);

    onSubmit(formData, setError);
  };

  return (
    <>
      {errors?.root && (
        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm">{errors.root.message}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* ================= LOGO ================= */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Logo</label>

          <div className="flex items-center gap-4">
            {logoPreview ? (
              <Image
                src={logoPreview}
                alt="Logo Preview"
                width={64}
                height={64}
                className="h-16 w-16 object-contain border rounded"
              />
            ) : (
              <div className="h-16 w-16 flex items-center justify-center bg-muted rounded">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}

            <InputField
              type="file"
              name="logo"
              accept="image/*"
              register={register}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setLogoPreview(URL.createObjectURL(file));
              }}
              error={errors.logo}
            />
          </div>
        </div>

        {/* ================= FAVICON ================= */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Favicon</label>

          <div className="flex items-center gap-4">
            {faviconPreview ? (
              <Image
                src={faviconPreview}
                alt="Favicon Preview"
                width={32}
                height={32}
                className="h-10 w-10 object-contain border rounded"
              />
            ) : (
              <div className="h-10 w-10 flex items-center justify-center bg-muted rounded">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            )}

            <InputField
              type="file"
              name="favicon"
              accept="image/*"
              register={register}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setFaviconPreview(URL.createObjectURL(file));
              }}
              error={errors.favicon}
            />
          </div>
        </div>

        {/* ================= BRAND INFO ================= */}
        <InputField
          label="Brand Name"
          name="brandName"
          register={register}
          required
          error={errors.brandName}
        />

        <TextareaField
          label="Tag Line"
          name="tagLine"
          register={register}
          error={errors.tagLine}
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Primary Color"
            name="primaryColor"
            type="color"
            register={register}
          />
          <InputField
            label="Secondary Color"
            name="secondaryColor"
            type="color"
            register={register}
          />
        </div>

        <InputField
          label="Support Email"
          name="supportEmail"
          register={register}
          error={errors.supportEmail}
        />

        <InputField
          label="Support Phone"
          name="supportPhone"
          register={register}
          error={errors.supportPhone}
        />

        <Button type="submit" loading={isPending} className="w-full">
          Save Branding Settings
        </Button>
      </form>
    </>
  );
}
