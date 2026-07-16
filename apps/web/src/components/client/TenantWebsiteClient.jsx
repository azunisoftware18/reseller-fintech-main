"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Button from "@/components/ui/Button";
import InfoCard from "@/components/details/InfoCard";
import InfoItem from "@/components/details/InfoItem";
import DataTableSearchEmpty from "@/components/tables/core/DataTableSearchEmpty";
import PageSkeleton from "@/components/details/PageSkeleton";
import TenantWebsiteModal from "@/components/modals/TenantWebsiteModal";

import { Palette, Edit, Mail, Phone, Type, Quote } from "lucide-react";

import {
  useTenantWebsite,
  useUpsertTenantWebsite,
  useWebsite,
} from "@/hooks/useTenantWebsite";

import {
  clearTenantWebsite,
  setTenantWebsite,
} from "@/store/tenantWebsiteSlice";
import Image from "next/image";
import ImagePreviewModal from "../ImagePreviewModal";
import { toast } from "@/lib/toast";
import { PERMISSIONS } from "@/lib/permissionKeys";
import { permissionChecker } from "@/lib/permissionCheker";

export default function TenantWebsiteClient() {
  const dispatch = useDispatch();
  const website = useWebsite();

  const [openModal, setOpenModal] = useState(false);

  const { data, isLoading } = useTenantWebsite();
  const { mutate, isPending } = useUpsertTenantWebsite();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const perms = useSelector((s) => s.auth.user?.permissions);
  const can = (perm) => permissionChecker(perms, perm?.resource, perm?.action);

  const canViewBranding = can(PERMISSIONS.WEBSITE.READ);
  const canEditBranding = can(PERMISSIONS.WEBSITE.UPDATE);
  const canCreateBranding = can(PERMISSIONS.WEBSITE.CREATE);

  const handleImagePreview = (url) => {
    setPreviewImage(url);
    setPreviewOpen(true);
  };

  useEffect(() => {
    if (data?.data) dispatch(setTenantWebsite(data.data));
    else dispatch(clearTenantWebsite());
  }, [data, dispatch]);

  const handleSubmit = (formData, setError) => {
    mutate(formData, {
      onSuccess: (res) => {
        dispatch(setTenantWebsite(res.data));
        toast.success("Branding updated successfully");
        setOpenModal(false);
      },
      onError: (err) => {
        if (err?.type === "FIELD") {
          err.errors.forEach(({ field, message }) =>
            setError(field, { message }),
          );
          return;
        }
        setError("root", { message: err?.message });
      },
    });
  };

  if (isLoading && !website) return <PageSkeleton />;

  return (
    <>
      {/* ===== HEADER ===== */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Branding Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your tenant identity, visuals and support details
          </p>
        </div>

        {((!website && canCreateBranding) || (website && canEditBranding)) && (
          <Button icon={Edit} onClick={() => setOpenModal(true)}>
            {website ? "Edit Branding" : "Setup Branding"}
          </Button>
        )}
      </div>

      {/* ===== LOGO + FAVICON SECTION ===== */}
      {(website?.logoUrl || website?.favIconUrl) && (
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          {website.logoUrl && (
            <div
              onClick={() => handleImagePreview(website.logoUrl)}
              className="group cursor-pointer rounded-xl border bg-card p-5 flex items-center gap-4 hover:shadow-md transition"
            >
              <div className="h-16 w-16 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
                <Image
                  src={website.logoUrl}
                  alt="Logo"
                  width={64}
                  height={64}
                  className="object-contain group-hover:scale-105 transition"
                />
              </div>
              <div>
                <p className="font-medium">Brand Logo</p>
                <p className="text-xs text-muted-foreground">
                  Click to preview full size
                </p>
              </div>
            </div>
          )}

          {website.favIconUrl && (
            <div
              onClick={() => handleImagePreview(website.favIconUrl)}
              className="group cursor-pointer rounded-xl border bg-card p-5 flex items-center gap-4 hover:shadow-md transition"
            >
              <div className="h-12 w-12 rounded border bg-muted flex items-center justify-center overflow-hidden">
                <Image
                  src={website.favIconUrl}
                  alt="Favicon"
                  width={32}
                  height={32}
                  className="object-contain group-hover:scale-110 transition"
                />
              </div>
              <div>
                <p className="font-medium">Favicon</p>
                <p className="text-xs text-muted-foreground">
                  Used in browser tabs
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== BRAND INFO CARD ===== */}
      {website ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT MAIN INFO */}
          <InfoCard
            icon={Palette}
            title="Brand Information"
            className="lg:col-span-2"
          >
            <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 w-full">
              <InfoItem
                label="Brand Name"
                value={website.brandName}
                icon={Type}
              />
              <InfoItem
                label="Tag Line"
                value={website.tagLine || "—"}
                icon={Quote}
              />
              <InfoItem
                label="Support Email"
                value={website.supportEmail || "—"}
                icon={Mail}
                onClick={
                  website.supportEmail
                    ? () =>
                        window.open(`mailto:${website.supportEmail}`, "_blank")
                    : undefined
                }
              />
              <InfoItem
                label="Support Phone"
                value={website.supportPhone || "—"}
                icon={Phone}
                onClick={
                  website.supportPhone
                    ? () => window.open(`tel:${website.supportPhone}`, "_blank")
                    : undefined
                }
              />
            </div>
          </InfoCard>

          <InfoCard
            icon={Palette}
            title="Brand Colors"
            className="lg:col-span-1 h-fit"
          >
            <div className="space-y-3">
              <InfoItem
                label="Primary"
                value={website.primaryColor}
                icon={Type}
              />
              <InfoItem
                label="Secondary"
                value={website.secondaryColor}
                icon={Type}
              />
            </div>
          </InfoCard>
        </div>
      ) : (
        <DataTableSearchEmpty
          isEmpty
          emptyTitle="Branding not configured"
          emptyDescription="Set up your brand identity, logo and support details"
          emptyAction={
            canCreateBranding && (
              <Button icon={Palette} onClick={() => setOpenModal(true)}>
                Setup Branding
              </Button>
            )
          }
        />
      )}

      {/* ===== MODAL ===== */}
      {openModal && (
        <TenantWebsiteModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onSubmit={handleSubmit}
          isPending={isPending}
          initialData={website}
        />
      )}

      <ImagePreviewModal
        open={previewOpen}
        image={previewImage}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
