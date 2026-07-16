"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  Key,
  Settings,
  Ban,
  Edit,
  Building2,
  User,
} from "lucide-react";

import Button from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/lib/toast";

import InfoCard from "@/components/details/InfoCard";
import InfoItem from "@/components/details/InfoItem";
import CopyableInfoItem from "@/components/details/CopyableInfoItem";
import QuickActionsCard from "@/components/details/QuickActionsCard";

import { clearUser, setUser } from "@/store/userSlice";
import { useUserById } from "@/hooks/useUser";
import PageSkeleton from "@/components/details/PageSkeleton";
import ImagePreviewModal from "@/components/ImagePreviewModal";

export default function Page() {
  const router = useRouter();
  const { id } = useParams();
  const dispatch = useDispatch();

  const [previewOpen, setPreviewOpen] = useState(false);

  const user = useSelector((state) => state.user.currentUser);
  const { data, isLoading } = useUserById(id);

  useEffect(() => {
    if (!user && data?.data) {
      dispatch(setUser(data.data));
    }
  }, [user, data, dispatch]);

  /* redirect if not found */
  useEffect(() => {
    if (!user && !isLoading && !data?.data) {
      router.replace("/dashboard/users");
    }
  }, [user, isLoading, data, router]);

  useEffect(() => {
    return () => dispatch(clearUser());
  }, [dispatch]);

  if (isLoading || !user) return <PageSkeleton />;

  const copy = (value, label) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  return (
    <>
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4 mb-6">
          {user.profilePictureUrl ? (
            <button
              onClick={() => setPreviewOpen(true)}
              className="relative group"
            >
              <img
                src={user.profilePictureUrl}
                alt="Profile"
                className="h-16 w-16 rounded-full border object-cover"
              />
            </button>
          ) : (
            <div className="h-16 w-16 rounded-full border flex items-center justify-center bg-muted">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          <div>
            <h1 className="text-2xl font-semibold">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">{user.userNumber}</p>
          </div>
        </div>

        <Button
          variant="outline"
          icon={ArrowLeft}
          onClick={() => router.push("/dashboard/user-management/users")}
        >
          Back to users
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          <InfoCard icon={Users} title="Basic Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                label="User Name"
                value={`${user.firstName} ${user.lastName}`}
                icon={Users}
              />
              <InfoItem
                label="User Number"
                value={user.userNumber}
                icon={Key}
              />
              <InfoItem label="Status" value={user.userStatus} icon={Ban} />
              <InfoItem
                label="Tenant"
                value={user.tenantName}
                icon={Building2}
              />
              <InfoItem
                label="Tenant Number"
                value={user.tenantNumber}
                icon={Building2}
              />
            </div>
          </InfoCard>

          <InfoCard icon={Mail} title="Contact Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                label="Email"
                value={user.email}
                icon={Mail}
                onClick={() => window.open(`mailto:${user.email}`)}
              />
              <InfoItem
                label="Mobile"
                value={user.mobileNumber}
                icon={Phone}
                onClick={() => window.open(`tel:${user.mobileNumber}`)}
              />
            </div>
          </InfoCard>

          <InfoCard icon={Settings} title="System Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CopyableInfoItem
                label="User ID"
                value={user.id}
                icon={Key}
                onCopy={() => copy(user.id, "user ID")}
              />
              <InfoItem
                label="Created At"
                value={formatDateTime(user.createdAt)}
                icon={Settings}
              />
              {user.actionReason && (
                <InfoItem
                  label="Action Reason"
                  value={user.actionReason}
                  icon={Settings}
                />
              )}
            </div>
          </InfoCard>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <QuickActionsCard
            title="Quick Actions"
            actions={[
              {
                label: "Send Email",
                icon: Mail,
                onClick: () => window.open(`mailto:${user.email}`),
              },
              {
                label: "Copy Email",
                icon: Key,
                onClick: () => copy(user.email, "Email"),
              },
              {
                label: "Edit User",
                icon: Edit,
                onClick: () => router.push("/dashboard/user-management/users"),
              },
            ]}
          />
        </div>
      </div>
      <ImagePreviewModal
        open={previewOpen}
        image={user.profilePictureUrl}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
