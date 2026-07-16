// components/settings/SettingsAccordion.jsx
"use client";

import { useState } from "react";

import TenantWebsiteClient from "@/components/client/TenantWebsiteClient";
import TenantSocialMediaClient from "@/components/client/TenantSocialMediaClient";

import { Palette, Share2 } from "lucide-react";
import CollapsibleSection from "@/components/CollapsibleSection.jsx";
import ClientGuard from "./ClientGuard";
import { PERMISSIONS } from "@/lib/permissionKeys";

export default function SettingsAccordion() {
  const [openKey, setOpenKey] = useState(null);

  const toggle = (key) => {
    setOpenKey((prev) => (prev === key ? null : key));
  };

  return (
    <div className="space-y-6">
      <ClientGuard anyOf={[PERMISSIONS.WEBSITE.READ]}>
        <CollapsibleSection
          title="Branding"
          description="Manage brand identity and support information"
          icon={Palette}
          isOpen={openKey === "branding"}
          onToggle={() => toggle("branding")}
        >
          <TenantWebsiteClient />
        </CollapsibleSection>
      </ClientGuard>

      <ClientGuard anyOf={[PERMISSIONS.SOCIAL_MEDIA.READ]}>
        <CollapsibleSection
          title="Social Media"
          description="Manage public social media links"
          icon={Share2}
          isOpen={openKey === "social"}
          onToggle={() => toggle("social")}
        >
          <TenantSocialMediaClient />
        </CollapsibleSection>
      </ClientGuard>
    </div>
  );
}
