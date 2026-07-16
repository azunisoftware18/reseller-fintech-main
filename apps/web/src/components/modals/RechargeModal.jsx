"use client";

import { X, Zap } from "lucide-react";
import Button from "../ui/Button";
import RechargeForm from "../forms/RechargeForm";

export default function RechargeModal({
  open,
  onClose,
  onSubmit,
  isPending,
  plans,
  planOperatorMaps = [],
  circleMaps = [],
  onFieldChange,
  fetchPlans,
  plansLoading,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4 z-50">
      <div className="bg-card border rounded-lg w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="bg-primary px-6 py-6 relative shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X />
          </Button>

          <div className="flex gap-3 text-primary-foreground">
            <Zap />
            <h2 className="text-xl font-bold">New Recharge</h2>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto flex-1">
          <RechargeForm
            onSubmit={onSubmit}
            isPending={isPending}
            plans={plans}
            planOperatorMaps={planOperatorMaps}
            circleMaps={circleMaps}
            onFieldChange={onFieldChange}
            fetchPlans={fetchPlans}
            plansLoading={plansLoading}
          />
        </div>
      </div>
    </div>
  );
}
