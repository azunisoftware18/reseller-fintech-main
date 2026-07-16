"use client";

import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import Button from "../ui/Button";
import { Landmark, X, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "@/lib/toast";
import PayoutForm from "../forms/PayoutForm";

export default function PayoutModal({
  open,
  onClose,
  userId,
  payout = null,
  readOnly = false,
}) {
  useLockBodyScroll(open);
  const [copiedField, setCopiedField] = useState(null);

  if (!open) return null;

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton = ({ text, field }) => (
    <button
      onClick={() => handleCopy(text, field)}
      className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors inline-flex"
      title={`Copy ${field}`}
    >
      {copiedField === field ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4 text-gray-400" />
      )}
    </button>
  );

  const InfoRow = ({ label, value, copyable = false, copyField = "" }) => (
    <div className="flex justify-between items-start py-3 border-b border-border last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center ml-4">
        <span className="text-sm text-foreground break-all text-right max-w-md">
          {value || "-"}
        </span>
        {copyable && value && <CopyButton text={value} field={copyField} />}
      </div>
    </div>
  );

  const Section = ({ title, children }) => (
    <div className="mb-6">
      <h3 className="text-md font-semibold text-foreground mb-3 pb-2 border-b border-border">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800";
      case "REFUNDED":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // For view mode - display payout details
  if (readOnly && payout) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="relative bg-linear-to-r from-primary to-primary/80 px-6 py-8 border-b border-border">
            <div className="absolute right-4 top-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary-foreground/20 rounded-full ring-2 ring-primary-foreground/30">
                  <Landmark className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-primary-foreground mb-2">
                Payout Details
              </h2>

              <p className="text-primary-foreground/90 text-sm">
                View payout transaction details
              </p>
            </div>
          </div>

          <div className="p-6 bg-card">
            {/* Status Badge */}
            <div className="mb-6 flex justify-between items-center">
              <div>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    payout.status,
                  )}`}
                >
                  {payout.status}
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                ID: {payout.id?.slice(0, 8)}...
              </span>
            </div>

            {/* Transaction Information */}
            <Section title="Transaction Information">
              <InfoRow
                label="Transaction ID"
                value={payout.txnId}
                copyable
                copyField="Transaction ID"
              />
              <InfoRow label="Amount" value={`₹${payout.amount}`} />
              <InfoRow label="Net Amount" value={`₹${payout.netAmount}`} />
              <InfoRow label="Mode" value={payout.mode} />
              <InfoRow label="Service" value={payout.serviceName || "payout"} />
              <InfoRow label="Provider" value={payout.providerName || "-"} />
            </Section>

            {/* Beneficiary Details */}
            <Section title="Beneficiary Details">
              <InfoRow
                label="Beneficiary Name"
                value={payout.beneficiaryName}
              />
              <InfoRow
                label="Account Number"
                value={payout.beneficiaryAccount}
                copyable
                copyField="Account Number"
              />
              <InfoRow
                label="IFSC Code"
                value={payout.beneficiaryIfsc}
                copyable
                copyField="IFSC Code"
              />
            </Section>

            {/* Pricing Details */}
            <Section title="Pricing Details">
              <InfoRow
                label="Commission"
                value={`₹${payout.commission || 0}`}
              />
              <InfoRow label="TDS" value={`₹${payout.tds || 0}`} />
              <InfoRow label="GST" value={`₹${payout.gst || 0}`} />
            </Section>

            {/* Timeline */}
            <Section title="Timeline">
              <InfoRow
                label="Initiated At"
                value={
                  payout.initiatedAt
                    ? new Date(payout.initiatedAt).toLocaleString()
                    : "-"
                }
              />
              <InfoRow
                label="Completed At"
                value={
                  payout.completedAt
                    ? new Date(payout.completedAt).toLocaleString()
                    : "-"
                }
              />
            </Section>

            {/* Provider Reference */}
            {payout.providerReference && (
              <Section title="Provider Information">
                <InfoRow
                  label="Provider Reference"
                  value={payout.providerReference}
                  copyable
                  copyField="Provider Reference"
                />
              </Section>
            )}

            {/* Close Button */}
            <div className="mt-8 pt-4 border-t border-border flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For create/edit mode - show form
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="relative bg-linear-to-r from-primary to-primary/80 px-6 py-8 border-b border-border">
          <div className="absolute right-4 top-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary-foreground/20 rounded-full ring-2 ring-primary-foreground/30">
                <Landmark className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-primary-foreground mb-2">
              {payout ? "Edit Payout" : "Initiate Payout"}
            </h2>

            <p className="text-primary-foreground/90 text-sm">
              {payout
                ? "Update payout information"
                : "Initiate a new bank payout to beneficiary"}
            </p>
          </div>
        </div>

        <div className="p-6 bg-card">
          {/* { You'll need to import and use PayoutForm here } */}
          {
            <PayoutForm
              userId={userId}
              payout={payout}
              readOnly={false}
              onSuccess={onClose}
            />
          }
        </div>
      </div>
    </div>
  );
}
