"use client";

import { useSelector } from "react-redux";

import {
  Users,
  Mail,
  Phone,
  Key,
  Settings,
  Wallet,
  ShieldCheck,
  Building2,
} from "lucide-react";

import InfoCard from "@/components/details/InfoCard";
import InfoItem from "@/components/details/InfoItem";
import CopyableInfoItem from "@/components/details/CopyableInfoItem";
import PageSkeleton from "@/components/details/PageSkeleton";

export default function Page() {
  const me = useSelector((state) => state.auth.user);

  if (!me) return <PageSkeleton />;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT SIDE */}
      <div className="lg:col-span-2 space-y-6">
        {/* USER INFO */}
        <InfoCard icon={Users} title="User Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem
              label="Full Name"
              value={`${me.user.firstName} ${me.user.lastName}`}
              icon={Users}
            />
            <InfoItem
              label="User Number"
              value={me.user.userNumber}
              icon={Key}
            />
            <InfoItem label="Email" value={me.user.email} icon={Mail} />
            <InfoItem
              label="Mobile"
              value={me.user.mobileNumber}
              icon={Phone}
            />
            <InfoItem
              label="KYC Verified"
              value={me.user.isKycVerified ? "YES" : "NO"}
              icon={ShieldCheck}
            />
          </div>
        </InfoCard>

        {/* ROLE */}
        <InfoCard icon={ShieldCheck} title="Role & Access">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="Role Name" value={me.role.roleName} icon={Users} />
            <InfoItem label="Role Code" value={me.role.roleCode} icon={Key} />
            <InfoItem
              label="Role Level"
              value={me.role.roleLevel}
              icon={Settings}
            />
            <InfoItem
              label="System Role"
              value={me.role.isSystem ? "YES" : "NO"}
              icon={Settings}
            />
          </div>
        </InfoCard>

        {/* TENANT */}
        <InfoCard icon={Building2} title="Tenant Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem
              label="Tenant Name"
              value={me.tenant.tenantName}
              icon={Building2}
            />
            <InfoItem
              label="Tenant Number"
              value={me.tenant.tenantNumber}
              icon={Key}
            />
            <InfoItem
              label="Tenant Email"
              value={me.tenant.tenantEmail}
              icon={Mail}
            />
            <InfoItem
              label="WhatsApp"
              value={me.tenant.tenantWhatsapp}
              icon={Phone}
            />
            <InfoItem
              label="Tenant Type"
              value={me.tenant.tenantType}
              icon={Users}
            />
            <InfoItem
              label="User Type"
              value={me.tenant.userType}
              icon={Users}
            />
          </div>
        </InfoCard>
      </div>

      {/* RIGHT SIDE */}
      <div className="space-y-6">
        {/* WALLET */}
        {me.type !== "EMPLOYEE" && (
          <InfoCard icon={Wallet} title="Wallet">
            <div className="space-y-3">
              <InfoItem
                label="Balance"
                value={`₹ ${me.wallet.balance}`}
                icon={Wallet}
              />
              <InfoItem
                label="Blocked Amount"
                value={`₹ ${me.wallet.blockedAmount}`}
                icon={Wallet}
              />
              <InfoItem
                label="Wallet Status"
                value={me.wallet.status}
                icon={Settings}
              />
            </div>
          </InfoCard>
        )}

        {/* SYSTEM */}
        <InfoCard icon={Settings} title="System">
          <div className="space-y-3">
            <CopyableInfoItem label="User ID" value={me.user.id} icon={Key} />
            <CopyableInfoItem
              label="Tenant ID"
              value={me.tenant.id}
              icon={Key}
            />
          </div>
        </InfoCard>
      </div>
    </div>
  );
}
