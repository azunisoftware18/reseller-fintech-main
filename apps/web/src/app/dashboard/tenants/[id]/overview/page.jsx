"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  Users,
  Key,
  Mail,
  Phone,
  Ban,
  Settings,
} from "lucide-react";

import Button from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/lib/toast";

/* reusable view components */
import InfoCard from "@/components/details/InfoCard";
import InfoItem from "@/components/details/InfoItem";
import CopyableInfoItem from "@/components/details/CopyableInfoItem";
import QuickActionsCard from "@/components/details/QuickActionsCard";
import { useSelector } from "react-redux";
import { Edit } from "lucide-react";
import TenantModal from "@/components/modals/TenantModal";
import { useDispatch } from "react-redux";
import { setTenant } from "@/store/tenantSlice";

export default function TenantViewPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const tenant = useSelector((state) => state.tenant.currentTenant);

  const [openModal, setOpenModal] = useState(false);

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-card border rounded-xl p-8 text-center">
          <Ban className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h2 className="text-xl font-semibold mb-2">Tenant not found</h2>
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => router.push("/dashboard/tenants")}
          >
            Back to Tenants
          </Button>
        </div>
      </div>
    );
  }

  /* ================= HELPERS ================= */
  const copy = (value, label) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  /* ================= RENDER ================= */
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          <InfoCard icon={Building2} title="Basic Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                label="Tenant Name"
                value={tenant.tenantName}
                icon={Users}
              />
              <InfoItem
                label="Legal Name"
                value={tenant.tenantLegalName}
                icon={Users}
              />
              <InfoItem
                label="Tenant Type"
                value={tenant.tenantType}
                icon={Users}
              />
              <InfoItem
                label="User Type"
                value={tenant.userType}
                icon={Users}
              />
            </div>
          </InfoCard>

          <InfoCard icon={Mail} title="Contact Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                label="Email"
                value={tenant.tenantEmail}
                icon={Mail}
                onClick={() => window.open(`mailto:${tenant.tenantEmail}`)}
              />
              <InfoItem
                label="Mobile"
                value={tenant.tenantMobileNumber}
                icon={Phone}
                onClick={() => window.open(`tel:${tenant.tenantMobileNumber}`)}
              />
              <InfoItem
                label="WhatsApp"
                value={tenant.tenantWhatsapp}
                icon={Phone}
              />
            </div>
          </InfoCard>

          <InfoCard icon={Settings} title="System Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CopyableInfoItem
                label="Tenant ID"
                value={tenant.id}
                icon={Key}
                onCopy={() => copy(tenant.id, "Tenant ID")}
              />
              <CopyableInfoItem
                label="Tenant Number"
                value={tenant.tenantNumber}
                icon={Key}
                onCopy={() => copy(tenant.tenantNumber, "Tenant Number")}
              />
              <InfoItem
                label="Created At"
                value={formatDateTime(tenant.createdAt)}
                icon={Settings}
              />
              <InfoItem
                label="Updated At"
                value={formatDateTime(tenant.updatedAt)}
                icon={Settings}
              />
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
                onClick: () => window.open(`mailto:${tenant.tenantEmail}`),
              },
              {
                label: "Edit Tenant",
                icon: Edit,
                onClick: () => {
                  dispatch(setTenant(tenant));
                  router.push("/dashboard/tenants");
                },
              },
            ]}
          />
        </div>
      </div>
      {openModal && (
        <TenantModal
          open={openModal}
          onClose={() => {
            setOpenModal(false);
            setEditingTenant(null);
          }}
          onSubmit={handleSubmitTenant}
          isEditing={isEditing}
          isPending={isEditing ? isUpdating : isCreating}
          initialData={editingTenant}
          currentUser=""
        />
      )}
    </>
  );
}
