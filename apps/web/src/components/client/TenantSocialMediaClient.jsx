"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Button from "@/components/ui/Button";
import InfoCard from "@/components/details/InfoCard";
import InfoItem from "@/components/details/InfoItem";
import DataTableSearchEmpty from "@/components/tables/core/DataTableSearchEmpty";
import PageSkeleton from "@/components/details/PageSkeleton";
import TenantSocialMediaModal from "@/components/modals/TenantSocialMediaModal";

import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Share2,
  Edit,
} from "lucide-react";

import {
  useTenantSocialMedia,
  useUpsertTenantSocialMedia,
} from "@/hooks/useTenantSocialMedia";

import {
  setTenantSocialMedia,
  clearTenantSocialMedia,
} from "@/store/tenantSocialMediaSlice";

import { toast } from "@/lib/toast";
import { PERMISSIONS } from "@/lib/permissionKeys";
import { permissionChecker } from "@/lib/permissionCheker";

export default function TenantSocialMediaClient() {
  const dispatch = useDispatch();
  const social = useSelector(
    (state) => state.tenantSocialMedia.currentSocialMedia,
  );

  const [openModal, setOpenModal] = useState(false);

  const perms = useSelector((s) => s.auth.user?.permissions);
  const can = (perm) => permissionChecker(perms, perm?.resource, perm?.action);

  const canCreateSocial = can(PERMISSIONS.SOCIAL_MEDIA.CREATE);
  const canUpdateSocial = can(PERMISSIONS.SOCIAL_MEDIA.UPDATE);

  const { data, isLoading, refetch } = useTenantSocialMedia();
  const { mutate, isPending } = useUpsertTenantSocialMedia();
  const openSocialModal = () => {
    setOpenModal(true);
  };
  useEffect(() => {
    if (data?.data) dispatch(setTenantSocialMedia(data.data));
    else dispatch(clearTenantSocialMedia());
  }, [data, dispatch]);

  const handleSubmit = (payload, setError) => {
    mutate(payload, {
      onSuccess: (res) => {
        dispatch(setTenantSocialMedia(res.data));
        setOpenModal(false);
        toast.success("Social media links updated");
        refetch();
      },
      onError: (err) =>
        setError("root", {
          message: err.message || "Failed to update social links",
        }),
    });
  };

  if (isLoading && !social) return <PageSkeleton />;

  return (
    <>
      {/* HEADER */}
      <div className="mb-8 flex justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Social Media</h1>
          <p className="text-muted-foreground">
            Manage tenant social media presence
          </p>
        </div>

        {((!social && canCreateSocial) || (social && canUpdateSocial)) && (
          <Button icon={Edit} onClick={() => setOpenModal(true)}>
            {social ? "Edit Links" : "Add Links"}
          </Button>
        )}
      </div>

      {social ? (
        <InfoCard icon={Share2} title="Social Profiles">
          <div className="space-y-2">
            {social.facebookUrl && (
              <InfoItem
                label="Facebook"
                value={social.facebookUrl}
                icon={Facebook}
                onClick={() => window.open(social.facebookUrl, "_blank")}
              />
            )}

            {social.twitterUrl && (
              <InfoItem
                label="Twitter / X"
                value={social.twitterUrl}
                icon={Twitter}
                onClick={() => window.open(social.twitterUrl, "_blank")}
              />
            )}

            {social.instagramUrl && (
              <InfoItem
                label="Instagram"
                value={social.instagramUrl}
                icon={Instagram}
                onClick={() => window.open(social.instagramUrl, "_blank")}
              />
            )}

            {social.linkedInUrl && (
              <InfoItem
                label="LinkedIn"
                value={social.linkedInUrl}
                icon={Linkedin}
                onClick={() => window.open(social.linkedInUrl, "_blank")}
              />
            )}

            {social.youtubeUrl && (
              <InfoItem
                label="YouTube"
                value={social.youtubeUrl}
                icon={Youtube}
                onClick={() => window.open(social.youtubeUrl, "_blank")}
              />
            )}
          </div>
        </InfoCard>
      ) : (
        <DataTableSearchEmpty
          isEmpty
          emptyTitle="No social media links"
          emptyDescription="Add social links to show on tenant pages"
          emptyAction={
            canCreateSocial && (
              <Button icon={Share2} onClick={openSocialModal}>
                Add Social Links
              </Button>
            )
          }
        />
      )}

      {openModal && (
        <TenantSocialMediaModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onSubmit={handleSubmit}
          isPending={isPending}
          initialData={social}
        />
      )}
    </>
  );
}
