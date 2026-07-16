// components/modals/TransactionViewModal.jsx
"use client";

import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import Button from "../ui/Button";
import { Receipt, X, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "@/lib/toast";

export default function TransactionViewModal({ open, onClose, transaction }) {
  useLockBodyScroll(open);
  const [copiedField, setCopiedField] = useState(null);

  if (!open || !transaction) return null;

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

  // Parse serviceData if it's a string
  const serviceData =
    typeof transaction.serviceData === "string"
      ? JSON.parse(transaction.serviceData || "{}")
      : transaction.serviceData || {};

  // Parse pricing if it's a string
  const pricing =
    typeof transaction.pricing === "string"
      ? JSON.parse(transaction.pricing || "{}")
      : transaction.pricing || {};

  const getStatusColor = (status) => {
    switch (status) {
      case "SUCCESS":
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "FAILED":
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "PENDING":
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header Section with Gradient */}
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
                <Receipt className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-primary-foreground mb-2">
              Transaction Details
            </h2>

            <p className="text-primary-foreground/90 text-sm">
              View complete transaction information
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 bg-card">
          {/* Status Badge */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  transaction.status,
                )}`}
              >
                {transaction.status}
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              ID: {transaction.id?.slice(0, 8)}...
            </span>
          </div>

          {/* Basic Information */}
          <Section title="Basic Information">
            <InfoRow
              label="Transaction ID"
              value={transaction.txnId}
              copyable
              copyField="Transaction ID"
            />
            <InfoRow
              label="Amount"
              value={`₹${Number(transaction.amount).toFixed(2)}`}
            />
            <InfoRow
              label="Net Amount"
              value={`₹${Number(transaction.netAmount).toFixed(2)}`}
            />
            <InfoRow
              label="Service Type"
              value={
                transaction.service?.serviceName || transaction.serviceType
              }
            />
          </Section>

          {/* User Information */}
          <Section title="User Information">
            <InfoRow
              label="Name"
              value={`${transaction.user?.firstName || ""} ${transaction.user?.lastName || ""}`.trim()}
            />
            <InfoRow
              label="Email"
              value={transaction.user?.email}
              copyable
              copyField="Email"
            />
            <InfoRow
              label="Mobile Number"
              value={transaction.user?.mobileNumber}
              copyable
              copyField="Mobile Number"
            />
            <InfoRow
              label="Role"
              value={transaction.role?.roleName || transaction.role?.roleCode}
            />
          </Section>

          {/* Beneficiary Details */}
          {serviceData && Object.keys(serviceData).length > 0 && (
            <Section title="Beneficiary Details">
              <InfoRow
                label="Account Number"
                value={serviceData.beneficiaryAccount}
                copyable
                copyField="Account Number"
              />
              <InfoRow
                label="IFSC Code"
                value={serviceData.beneficiaryIfsc}
                copyable
                copyField="IFSC Code"
              />
              <InfoRow
                label="Beneficiary Name"
                value={serviceData.beneficiaryName}
              />
              <InfoRow label="Mode" value={serviceData.mode} />
              <InfoRow label="Remarks" value={serviceData.remarks || "-"} />
              {serviceData.orgTransactionId && (
                <InfoRow
                  label="Organization Transaction ID"
                  value={serviceData.orgTransactionId}
                  copyable
                  copyField="Org Transaction ID"
                />
              )}
            </Section>
          )}

          {/* Pricing Details */}
          {pricing && Object.keys(pricing).length > 0 && (
            <Section title="Pricing Details">
              <InfoRow
                label="Base Amount"
                value={`₹${Number(pricing.baseAmount || 0).toFixed(2)}`}
              />
              <InfoRow
                label="Commission"
                value={`₹${Number(pricing.commission || 0).toFixed(2)}`}
              />
              <InfoRow
                label="TDS"
                value={`₹${Number(pricing.tds || 0).toFixed(2)}`}
              />
              <InfoRow
                label="GST"
                value={`₹${Number(pricing.gst || 0).toFixed(2)}`}
              />
              {pricing.providerMargin !== undefined && (
                <InfoRow
                  label="Provider Margin"
                  value={`₹${Number(pricing.providerMargin || 0).toFixed(2)}`}
                />
              )}
            </Section>
          )}

          {/* Timeline */}
          <Section title="Timeline">
            <InfoRow
              label="Initiated At"
              value={
                transaction.initiatedAt
                  ? new Date(transaction.initiatedAt).toLocaleString()
                  : "-"
              }
            />
            <InfoRow
              label="Completed At"
              value={
                transaction.completedAt
                  ? new Date(transaction.completedAt).toLocaleString()
                  : "-"
              }
            />
            <InfoRow
              label="Processed At"
              value={
                transaction.processedAt
                  ? new Date(transaction.processedAt).toLocaleString()
                  : "-"
              }
            />
          </Section>

          {/* Provider Information */}
          {(transaction.providerReference || transaction.providerResponse) && (
            <Section title="Provider Information">
              {transaction.providerReference && (
                <InfoRow
                  label="Provider Reference"
                  value={transaction.providerReference}
                  copyable
                  copyField="Provider Reference"
                />
              )}
              {transaction.providerResponse && (
                <InfoRow
                  label="Provider Response"
                  value={
                    typeof transaction.providerResponse === "string"
                      ? transaction.providerResponse
                      : JSON.stringify(transaction.providerResponse, null, 2)
                  }
                />
              )}
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
