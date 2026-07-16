"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RefreshCw, Wrench } from "lucide-react";

import Button from "@/components/ui/Button";
import QuickStats from "@/components/QuickStats";
import OperatorMapsTable from "@/components/tables/OperatorMapsTable";

import { useOperatorMaps, useUpsertOperatorMap } from "@/hooks/useRecharge";

import { permissionChecker } from "@/lib/permissionCheker";
import { PERMISSIONS } from "@/lib/permissionKeys";
import { toast } from "@/lib/toast";
import { useMappings } from "@/hooks/useAdminServices";
import OperatorMapModal from "../modals/OperatorMapModal";

export default function OperatorMapsClient() {
  const [open, setOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [directionFilter, setDirectionFilter] = useState(""); // 👈 Add filter state

  const { data: serviceProviderMappings = [] } = useMappings();

  // 👈 Pass filter to hook
  const {
    data = [],
    isLoading,
    refetch,
  } = useOperatorMaps(directionFilter ? { direction: directionFilter } : {});
  const { mutate: upsertMap, isPending } = useUpsertOperatorMap();

  const perms = useSelector((s) => s.auth.user?.permissions);
  const can = (perm) => permissionChecker(perms, perm.resource, perm.action);

  const canCreate = can(
    PERMISSIONS.RECHARGE_ADMIN_OPERATORS.CREATE,
  );
  const canUpdate = can(
    PERMISSIONS.RECHARGE_ADMIN_OPERATORS.UPDATE,
  );

  const handleSubmit = (payload, setError) => {
    upsertMap(payload, {
      onSuccess: () => {
        toast.success("Operator Mapping Saved");
        setOpen(false);
        setEditingData(null);
      },
      onError: (err) => setError("root", { message: err.message }),
    });
  };

  return (
    <>
      <div className="mb-6 flex justify-end gap-3">
        <Button
          icon={RefreshCw}
          variant="outline"
          loading={isLoading}
          onClick={refetch}
        >
          Refresh
        </Button>
      </div>

      <QuickStats
        stats={[
          {
            title: "Total Operator Maps",
            value: data.length,
            icon: Wrench,
          },
        ]}
      />

      <OperatorMapsTable
        data={data}
        onAdd={
          canCreate
            ? () => {
                setEditingData(null);
                setOpen(true);
              }
            : undefined
        }
        onEdit={
          canUpdate
            ? (row) => {
                setEditingData(row);
                setOpen(true);
              }
            : undefined
        }
      />

      <OperatorMapModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingData(null);
        }}
        initialData={editingData}
        onSubmit={handleSubmit}
        isPending={isPending}
        serviceProviderMappings={serviceProviderMappings}
      />
    </>
  );
}
