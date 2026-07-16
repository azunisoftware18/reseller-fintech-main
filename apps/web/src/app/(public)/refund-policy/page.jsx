"use client";
import PublicPageWrapper from "@/components/public/PublicPageWrapper";
import { AlertCircle } from "lucide-react";

export default function RefundPolicy() {
  return (
    <PublicPageWrapper
      title="Refund Policy"
      subtitle="Guidelines regarding transaction reversals and refund eligibility."
    >
      <div className="flex items-start gap-4 p-6 bg-amber-50 border border-amber-100 rounded-2xl mb-8 not-prose">
        <AlertCircle className="text-amber-600 shrink-0" size={24} />
        <div>
          <h4 className="font-bold text-amber-900">Important Notice</h4>
          <p className="text-sm text-amber-800">
            Due to the nature of real-time financial transfers, completed
            transactions are generally non-reversible.
          </p>
        </div>
      </div>

      <h2>1. Eligibility for Refunds</h2>
      <p>Refunds may be processed under the following specific conditions:</p>
      <ul>
        <li>Duplicate transactions caused by a technical system error.</li>
        <li>
          Unauthorized transactions where a breach is confirmed by our security
          team.
        </li>
        <li>
          Failed service delivery where funds were debited but not settled.
        </li>
      </ul>

      <h2>2. Process</h2>
      <p>
        To request a refund, please contact our support team with the
        Transaction Hash/ID. Requests must be submitted within 48 hours of the
        transaction.
      </p>
    </PublicPageWrapper>
  );
}
