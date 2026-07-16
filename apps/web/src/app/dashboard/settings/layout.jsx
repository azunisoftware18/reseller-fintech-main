"use client";

import TabsNav from "@/components/details/TabsNav";
import { permissionChecker } from "@/lib/permissionCheker";
import { PERMISSIONS } from "@/lib/permissionKeys";
import { Settings, Server, Globe, Mail } from "lucide-react";
import { useSelector } from "react-redux";

export default function SettingsLayout({ children }) {
  const perms = useSelector((s) => s.auth.user?.permissions);
  const can = (perm) => permissionChecker(perms, perm?.resource, perm?.action);

  const canGeneral =
    can(PERMISSIONS.WEBSITE.READ) || can(PERMISSIONS.SOCIAL_MEDIA.READ);
  const canServer = can(PERMISSIONS.SERVER.READ);
  const canDomain = can(PERMISSIONS.DOMAIN.READ);
  const canSMTP = can(PERMISSIONS.SMTP.READ);

  const tabs = [
    canGeneral && {
      label: "General",
      value: "general",
      icon: Settings,
    },
    canServer && {
      label: "Server",
      value: "server",
      icon: Server,
    },
    canDomain && {
      label: "Domain",
      value: "domain",
      icon: Globe,
    },
    canSMTP && {
      label: "SMTP",
      value: "smtp",
      icon: Mail,
    },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage system configuration and services
        </p>
      </div>

      <TabsNav tabs={tabs} basePath="/dashboard/settings" />

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
