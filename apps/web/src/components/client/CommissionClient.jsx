"use client";

import { useState } from "react";
import { RefreshCw, Percent, Users, ShieldCheck } from "lucide-react";
import {
  useCommissionList,
  useCreateCommission,
  useUpdateCommission,
} from "@/hooks/useCommission";

import CommissionTable from "@/components/tables/CommissionTable";
import CommissionModal from "@/components/modals/CommissionModal";
import QuickStats from "@/components/QuickStats";
import Button from "@/components/ui/Button";
import { useDebounce } from "@/hooks/useDebounce";

export default function CommissionClient() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const [openModal, setOpenModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const debouncedSearch = useDebounce(search, 400);
  const perPage = 10;

  const { data, isLoading, refetch } = useCommissionList({
    type: typeFilter,
    page,
    limit: perPage,
    search: debouncedSearch,
  });

  const commissions = data?.data || [];
  const meta = data?.meta || {};

  const createCommission = useCreateCommission();
  const updateCommission = useUpdateCommission();

  const isEditing = Boolean(editingRule);
  const { mutate, isPending } = isEditing ? updateCommission : createCommission;

  const stats = [
    {
      title: "Total Rules",
      value: meta.total ?? 0,
      icon: Percent,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "User Rules",
      value: commissions.filter((c) => c.scope === "USER").length,
      icon: Users,
      iconColor: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Role Rules",
      value: commissions.filter((c) => c.scope === "ROLE").length,
      icon: ShieldCheck,
      iconColor: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  const handleAddRule = () => {
    setEditingRule(null);
    setOpenModal(true);
  };

  const handleEditRule = (rule) => {
    // Transform the rule data for the form
    setEditingRule({
      id: rule.id,
      scope: rule.scope,
      targetUserId: rule.targetUserId,
      roleId: rule.roleId,
      serviceProviderMappingId: rule.serviceProviderMappingId,
      mode: rule.mode,
      type: rule.type,
      value: rule.value,
      applyGST: rule.applyGST === 1 || rule.applyGST === true,
      gstPercent: parseFloat(rule.gstPercent) || 0,
      applyTDS: rule.applyTDS === 1 || rule.applyTDS === true,
      tdsPercent: parseFloat(rule.tdsPercent) || 0,
      supportsSlab: rule.supportsSlab === 1 || rule.supportsSlab === true,
      slabs:
        rule.slabs?.map((slab) => ({
          minAmount: Number(slab.minAmount),
          maxAmount: Number(slab.maxAmount),
          value: Number(slab.value),
        })) || [],
      isActive: rule.isActive === 1 || rule.isActive === true,
    });
    setOpenModal(true);
  };

  const handleSubmitRule = (payload, setFormError) => {
    // Prepare mutation data based on whether we're creating or updating
    const mutationData = isEditing ? { id: editingRule.id, payload } : payload;

    mutate(mutationData, {
      onSuccess: () => {
        refetch();
        setOpenModal(false);
        setEditingRule(null);
      },
      onError: (err) => {
        if (err.errors && Array.isArray(err.errors)) {
          // Map each API error to the form field
          err.errors.forEach((apiError) => {
            setFormError(apiError.field, {
              type: "manual",
              message: apiError.message,
            });
          });

          if (err.message) {
            setFormError("root", {
              type: "manual",
              message: err.message,
            });
          }
        } else {
          setFormError("root", {
            type: "manual",
            message: err?.message || "Failed to save commission rule",
          });
        }
      },
    });
  };

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Commission Management</h1>
          <p className="text-muted-foreground">
            Control commission rules across users and roles
          </p>
        </div>

        <Button
          onClick={refetch}
          loading={isLoading}
          variant="outline"
          icon={RefreshCw}
        >
          Refresh
        </Button>
      </div>

      <QuickStats stats={stats} />

      <CommissionTable
        commissions={commissions}
        total={meta.total ?? 0}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        search={search}
        onSearch={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={(v) => {
          setTypeFilter(v);
          setPage(1);
        }}
        onAdd={handleAddRule}
        onEdit={handleEditRule}
      />

      {openModal && (
        <CommissionModal
          open={openModal}
          onClose={() => {
            setOpenModal(false);
            setEditingRule(null);
          }}
          onSubmit={handleSubmitRule}
          isEditing={isEditing}
          isPending={isPending}
          initialData={editingRule}
        />
      )}
    </>
  );
}
