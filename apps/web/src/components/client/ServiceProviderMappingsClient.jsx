"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RefreshCw, Link, X, Layers, Plus } from "lucide-react";

import Button from "@/components/ui/Button";
import QuickStats from "@/components/QuickStats";

import { toast } from "@/lib/toast";
import { permissionChecker } from "@/lib/permissionCheker";
import { PERMISSIONS } from "@/lib/permissionKeys";
import {
  useMappings,
  useCreateMapping,
  useUpdateMapping,
  useHardDeleteMapping,
  useProviders,
  useServices,
} from "@/hooks/useAdminServices";

import ServiceProviderMappingModal from "../modals/ServiceProviderMappingModal";
import ServiceProviderMappingsTable from "@/components/tables/ServiceProviderMappingsTable";

export default function ServiceProviderMappingsClient() {
  const perms = useSelector((s) => s.auth.user?.permissions);
  const can = (perm) => permissionChecker(perms, perm.resource, perm.action);

  const [openModal, setOpenModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    serviceId: "",
    providerId: "",
    mode: "",
    isActive: "",
    page: 1,
    limit: 20,
  });

  // Fetch mappings data
  const {
    data: mappingsData,
    isLoading,
    error,
    refetch,
  } = useMappings(filters);

  const mappings = mappingsData?.data || [];
  const meta = mappingsData?.meta || {};

  // Fetch services and providers for dropdowns
  const { data: servicesList = [] } = useServices();
  const { data: providersList = [] } = useProviders();

  // Mutations
  const { mutate: createMapping, isPending: isCreating } = useCreateMapping();
  const { mutate: updateMapping, isPending: isUpdating } = useUpdateMapping();
  const { mutate: deleteMapping, isPending: isDeleting } =
    useHardDeleteMapping();

  useEffect(() => {
    if (error) toast.error(error.message);
  }, [error]);

  const canCreate = can(PERMISSIONS.SERVICE_PROVIDER_MAPPINGS.CREATE);
  const canUpdate = can(PERMISSIONS.SERVICE_PROVIDER_MAPPINGS.UPDATE);
  const canDelete = can(PERMISSIONS.SERVICE_PROVIDER_MAPPINGS.DELETE);

  const handleSubmit = (data, setError) => {
    if (editingMapping) {
      updateMapping(
        { id: editingMapping.id, payload: data },
        {
          onSuccess: () => {
            toast.success("Mapping updated successfully");
            setOpenModal(false);
            setEditingMapping(null);
          },
          onError: (err) => setError("root", { message: err.message }),
        },
      );
    } else {
      createMapping(data, {
        onSuccess: () => {
          toast.success("Mapping created successfully");
          setOpenModal(false);
        },
        onError: (err) => setError("root", { message: err.message }),
      });
    }
  };

  const handleEdit = (row) => {
    setEditingMapping(row);
    setOpenModal(true);
  };

  const handleDelete = (row) => {
    if (
      confirm(
        `Are you sure you want to delete mapping for ${row.serviceName} - ${row.providerName}?`,
      )
    ) {
      deleteMapping(row.id, {
        onSuccess: () => toast.success("Mapping deleted successfully"),
        onError: (err) => toast.error(err.message),
      });
    }
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleLimitChange = (newLimit) => {
    setFilters({ ...filters, limit: newLimit, page: 1 });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  // Calculate stats
  const activeMappings = mappings.filter((m) => m.isActive).length;
  const inactiveMappings = mappings.filter((m) => !m.isActive).length;

  return (
    <>
      <div className="mb-6 flex justify-end items-center">
        <Button
          icon={RefreshCw}
          variant="outline"
          loading={isLoading}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </div>

      <QuickStats
        stats={[
          {
            title: "Total Mappings",
            value: meta.total || 0,
            icon: Link,
          },
          {
            title: "Active Mappings",
            value: activeMappings,
            icon: Link,
          },
          {
            title: "Inactive Mappings",
            value: inactiveMappings,
            icon: Link,
          },
        ]}
      />

      <ServiceProviderMappingsTable
        data={mappings}
        loading={isLoading}
        meta={meta}
        onAdd={
          canCreate
            ? () => {
                setEditingMapping(null);
                setOpenModal(true);
              }
            : undefined
        }
        onEdit={canUpdate ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        currentPage={filters.page}
        currentLimit={filters.limit}
      />

      <ServiceProviderMappingModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditingMapping(null);
        }}
        onSubmit={handleSubmit}
        isPending={isCreating || isUpdating}
        editingMapping={editingMapping}
        servicesList={servicesList}
        providersList={providersList}
      />
    </>
  );
}
