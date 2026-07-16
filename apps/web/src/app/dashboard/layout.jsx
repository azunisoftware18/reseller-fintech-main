"use client";

import { useMemo, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import DashboardNavbar from "@/components/DashboardNavbar";
import Sidebar from "@/components/Sidebar";
import { useMe } from "@/hooks/useAuth";

const MIN_BALANCE = 100;

const ROUTES = {
  DASHBOARD: "/dashboard",
  KYC_SUBMIT: "/dashboard/kyc/request",
  FUND_REQUEST: "/dashboard/fund/request",
};

const FULLSCREEN_PAGES = [ROUTES.KYC_SUBMIT, ROUTES.FUND_REQUEST];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const { data: meData, isLoading: meLoading } = useMe();

  const userData = meData?.data;
  const userType = userData?.type; // "EMPLOYEE" | "AGENT" etc.
  const isKycVerified = userData?.user?.isKycVerified;
  const walletBalance = userData?.wallet?.balance ?? 0;

  const complianceState = useMemo(() => {
    if (meLoading) return "LOADING";
    // Employee ke liye KYC/Fund required nahi hai
    if (userType === "EMPLOYEE") return "OK";
    if (isKycVerified) return "OK";
    if (walletBalance < MIN_BALANCE) return "FUND";
    return "KYC";
  }, [isKycVerified, walletBalance, meLoading, userType]);

  const isFullscreenPage = FULLSCREEN_PAGES.some((route) =>
    pathname?.startsWith(route),
  );

  const getRedirectPath = (state, currentPath) => {
    if (state === "KYC" && !currentPath.startsWith(ROUTES.KYC_SUBMIT)) {
      return ROUTES.KYC_SUBMIT;
    }
    if (state === "FUND" && !currentPath.startsWith(ROUTES.FUND_REQUEST)) {
      return ROUTES.FUND_REQUEST;
    }
    if (state === "OK" && isFullscreenPage) {
      return ROUTES.DASHBOARD;
    }
    return null;
  };

  useEffect(() => {
    if (complianceState === "LOADING") return;

    const redirectPath = getRedirectPath(complianceState, pathname || "");
    if (redirectPath) {
      router.replace(redirectPath);
    }
  }, [complianceState, pathname, router, isFullscreenPage]);

  if (complianceState === "LOADING") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (isFullscreenPage) {
    return (
      <div className="min-h-screen bg-background">
        <main className="min-h-screen">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-card z-40">
        <Sidebar />
      </aside>

      <div className="ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30">
          <DashboardNavbar />
        </header>

        <main className="flex-1 bg-gradient-secondry p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
