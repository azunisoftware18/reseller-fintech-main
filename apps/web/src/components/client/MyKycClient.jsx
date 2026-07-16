"use client";

import { useEffect } from "react";

import KycStatusView from "@/components/forms/KycStatusView";

import { toast } from "@/lib/toast";
import { useSelector } from "react-redux";
import { useKycStatus } from "@/hooks/useKyc";

export default function MyKycClient() {
  const currentUser = useSelector((s) => s.auth.user);

  const {
    data: myKycData,
    isLoading: myKycLoading,
    refetch: refetchMyKyc,
    error: myKycError,
  } = useKycStatus(currentUser?.user?.id);

  useEffect(() => {
    if (myKycError) {
      toast.error(myKycError?.message || "Failed to load KYC status");
    }
  }, [myKycError]);

  return (
    <>
      {/* My KYC Content */}
      <KycStatusView
        kycData={myKycData?.data}
        isLoading={myKycLoading}
        onRefresh={refetchMyKyc}
      />
    </>
  );
}
