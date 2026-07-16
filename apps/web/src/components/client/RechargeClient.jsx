"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RefreshCw, Clock, CheckCircle, XCircle, Search } from "lucide-react"; // Add Search icon

import QuickStats from "@/components/QuickStats";
import Button from "@/components/ui/Button";
import RechargeTransactionTable from "../tables/RechargeTransactionTable";
import RechargeModal from "../modals/RechargeModal";

import { permissionChecker } from "@/lib/permissionCheker";
import { PERMISSIONS } from "@/lib/permissionKeys";
import { toast } from "@/lib/toast";
import {
  useRechargeHistory,
  useInitiateRecharge,
  useRechargePlans,
  useOperatorMaps,
  useCircleMaps,
  useCheckStatus, // Import the new hook
} from "@/hooks/useRecharge";
import { Layers } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RechargeClient() {
  const [modalOpen, setModalOpen] = useState(false);
  const [plans, setPlans] = useState([]);

  const router = useRouter();

  const [formValues, setFormValues] = useState({
    operatorCode: "",
    circleCode: "",
    mobileNumber: "",
  });

  /* ================= HISTORY ================= */

  const { data: transactions = [], isLoading, refetch } = useRechargeHistory();

  /* ================= RECHARGE OPERATORS ================= */

  const { data: planOperatorMaps = [] } = useOperatorMaps({
    direction: "PLAN_FETCH",
  });

  /* ================= INITIATE ================= */

  const { mutate: initiateRecharge, isPending: initiating } =
    useInitiateRecharge();

  /* ================= CHECK STATUS ================= */

  const { mutate: checkStatus, isPending: checkingStatus } = useCheckStatus();

  /* ================= ADMIN MAP DATA ================= */

  const { data: circleMaps = [] } = useCircleMaps({
    direction: "PLAN_FETCH",
  });

  /* ================= PLANS & OFFERS ================= */

  const { mutateAsync: fetchPlans, isPending: plansLoading } =
    useRechargePlans();

  /* ================= PERMISSIONS ================= */

  const perms = useSelector((s) => s.auth.user?.permissions);
  const can = (perm) => permissionChecker(perms, perm.resource, perm.action);

  const canCreate = can(PERMISSIONS.RECHARGE.CREATE);
  const canCreateAdmin =
    can(PERMISSIONS.RECHARGE_ADMIN_OPERATORS.CREATE) ||
    can(PERMISSIONS.RECHARGE_ADMIN_CIRCLES.CREATE);

  const total = transactions.length;
  const pending = transactions.filter((t) => t?.status === "PENDING").length;
  const success = transactions.filter((t) => t?.status === "SUCCESS").length;
  const failed = transactions.filter((t) => t?.status === "FAILED").length;

  /* ================= HANDLERS ================= */

  const handleCreateSubmit = (payload, setError) => {
    initiateRecharge(payload, {
      onSuccess: () => {
        toast.success("Recharge initiated");
        setModalOpen(false);
        setPlans([]);
      },
      onError: (err) => setError("root", { message: err.message }),
    });
  };

  const handleFetchPlans = async (params) => {
    try {
      const response = await fetchPlans(params);
      const fetchedPlans =
        response?.data?.data?.plans || response?.plans || response || [];
      setPlans(fetchedPlans);
      return fetchedPlans;
    } catch (error) {
      console.error("Fetch plans error:", error);
      throw error;
    }
  };

  // Check Status Handler
  const handleCheckStatus = (row) => {
    // Only allow check status for PENDING/PROCESSING transactions
    if (row.status !== "PENDING" && row.status !== "PROCESSING") {
      toast.info(`Status is already ${row.status}`);
      return;
    }

    checkStatus(row.txnId, {
      onSuccess: (data) => {
        toast.success(`Status updated: ${data.status}`);
        refetch(); // Refresh the history to show updated status
      },
      onError: (err) => {
        toast.error(err.message || "Failed to check status");
      },
    });
  };

  // Define extra actions for the table
  const extraActions = [
    {
      label: "Check Status",
      icon: Search,
      onClick: handleCheckStatus,
      // Only show for pending/processing transactions
      show: (row) => row.status === "PENDING" || row.status === "PROCESSING",
      loading: checkingStatus,
    },
  ];

  // Modal close handler jo plans reset karega
  const handleCloseModal = () => {
    setModalOpen(false);
    setPlans([]); // Reset plans when modal closes
  };

  return (
    <>
      {/* HEADER */}
      <div className="mb-6 flex justify-end gap-3">
        <Button
          icon={RefreshCw}
          variant="outline"
          loading={isLoading}
          onClick={refetch}
        >
          Refresh
        </Button>

        {canCreateAdmin && (
          <Button
            variant="outline"
            icon={Layers}
            onClick={() => {
              router.push("/dashboard/recharge/admin");
            }}
          >
            Manage
          </Button>
        )}
      </div>

      {/* STATS */}
      <QuickStats
        stats={[
          {
            title: "Total",
            value: total,
            icon: RefreshCw,
            iconColor: "text-primary",
            bgColor: "bg-primary/10",
          },
          {
            title: "Pending",
            value: pending,
            icon: Clock,
            iconColor: "text-warning",
            bgColor: "bg-warning/10",
          },
          {
            title: "Success",
            value: success,
            icon: CheckCircle,
            iconColor: "text-success",
            bgColor: "bg-success/10",
            isPositive: true,
          },
          {
            title: "Failed",
            value: failed,
            icon: XCircle,
            iconColor: "text-destructive",
            bgColor: "bg-destructive/10",
            isPositive: false,
          },
        ]}
      />

      {/* TABLE */}
      <RechargeTransactionTable
        data={transactions}
        onAdd={
          canCreate
            ? () => {
                setModalOpen(true);
              }
            : undefined
        }
        onExtraActions={extraActions}
      />

      {/* MODAL */}
      <RechargeModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateSubmit}
        isPending={initiating}
        plans={plans}
        planOperatorMaps={planOperatorMaps}
        circleMaps={circleMaps}
        onFieldChange={setFormValues}
        fetchPlans={handleFetchPlans}
        plansLoading={plansLoading}
      />
    </>
  );
}
