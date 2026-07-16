"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RefreshCw, Layers } from "lucide-react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import QuickStats from "@/components/QuickStats";
import PlatformServicesTable from "@/components/tables/PlatformServicesTable";
import PlatformServiceModal from "@/components/modals/PlatformServiceModal";

import {
  useCreateService,
  useServices,
  useUpdateService,
} from "@/hooks/useAdminServices";

import { setPlatformServices } from "@/store/platformServiceSlice";
import { toast } from "@/lib/toast";
import { permissionChecker } from "@/lib/permissionCheker";
import { PERMISSIONS } from "@/lib/permissionKeys";
import { useTenantServices } from "@/hooks/useTenantServices";
import { ADMIN_ROLE } from "@/lib/constants";

export default function PlatformServicesClient() {
  const dispatch = useDispatch();
  const router = useRouter();
  const perms = useSelector((s) => s.auth.user?.permissions);

  const [openModal, setOpenModal] = useState(false);
  const [editingData, setEditingData] = useState(null);

  const user = useSelector((s) => s.auth.user);

  const isAdmin = user?.role?.roleCode === ADMIN_ROLE;

  // Always call hooks
  const adminServices = useServices();
  const tenantServices = useTenantServices();

  // Decide which data to use
  const servicesData = isAdmin ? adminServices : tenantServices;

  const { data: services = [], isLoading, error, refetch } = servicesData;

  const { mutate: createService, isPending: creating } = useCreateService();
  const { mutate: updateService, isPending: updating } = useUpdateService();

  useEffect(() => {
    dispatch(setPlatformServices(services));
  }, [services, dispatch]);

  useEffect(() => {
    if (error) toast.error(error.message);
  }, [error]);

  const can = (perm) => permissionChecker(perms, perm?.resource, perm?.action);

  const canCreate = can(PERMISSIONS.API_INTEGRATION_SERVICES.CREATE);
  const canEdit = can(PERMISSIONS.API_INTEGRATION_SERVICES.UPDATE);

  const handleSubmit = (payload, setError) => {
    const action = editingData ? updateService : createService;

    action(editingData ? { id: editingData.id, payload } : payload, {
      onSuccess: () => {
        toast.success(editingData ? "Service Updated" : "Service Created");
        refetch();
        setOpenModal(false);
        setEditingData(null);
      },
      onError: (err) => setError("root", { message: err.message }),
    });
  };

  const exportServices = () => {
    const csv = [
      ["ID", "Code", "Name", "Active"],
      ...services.map((s) => [s.id, s.code, s.name, s.isActive]),
    ]
      .map((r) => r.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "platform_services.csv";
    a.click();
  };

  return (
    <>
      <div className="mb-6 flex justify-end">
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
            title: "Total Services",
            value: services.length,
            icon: Layers,
          },
        ]}
      />

      <PlatformServicesTable
        data={services}
        loading={isLoading}
        onAdd={
          canCreate
            ? () => {
                setEditingData(null);
                setOpenModal(true);
              }
            : undefined
        }
        onEdit={
          canEdit
            ? (row) => {
                setEditingData(row);
                setOpenModal(true);
              }
            : undefined
        }
        onExport={exportServices}
      />

      <PlatformServiceModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditingData(null);
        }}
        initialData={editingData}
        onSubmitService={handleSubmit}
        isPending={creating || updating}
      />
    </>
  );
}
