"use client";

import { CheckCircle2, Clock, XCircle } from "lucide-react";

const STATUS_CONFIG = {
  VERIFIED: {
    icon: CheckCircle2,
    title: "KYC Verified Successfully",
    message:
      "Your identity verification is complete. You now have full access to your dashboard.",
    color: "text-green-600",
    bg: "bg-green-50",
  },

  UNDER_REVIEW: {
    icon: Clock,
    title: "KYC Under Review",
    message:
      "Your KYC has been submitted successfully. It will be reviewed and verified within 24 hours.",
    subMessage:
      "You will receive a notification once the verification process is completed.",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },

  REJECTED: {
    icon: XCircle,
    title: "KYC Rejected",
    message:
      "Unfortunately, your KYC submission was rejected. Please review your details and resubmit.",
    color: "text-red-600",
    bg: "bg-red-50",
  },
};

export default function KycStatusResult({ status, rejectionReason }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.UNDER_REVIEW;
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className={`text-center p-8 rounded-2xl shadow-md max-w-md w-full ${config.bg}`}
      >
        <Icon className={`mx-auto h-14 w-14 ${config.color}`} />

        <h2 className={`mt-4 text-xl font-semibold ${config.color}`}>
          {config.title}
        </h2>

        <p className="text-sm text-gray-700 mt-3">{config.message}</p>

        {config.subMessage && (
          <p className="text-xs text-gray-500 mt-2">{config.subMessage}</p>
        )}

        {status === "REJECTED" && rejectionReason && (
          <div className="mt-4 text-xs text-red-500">
            Reason: {rejectionReason}
          </div>
        )}
      </div>
    </div>
  );
}
