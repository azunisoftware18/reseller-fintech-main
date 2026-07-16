"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Users, CheckCircle, Ban, UserX } from "lucide-react";

import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useAssignEmployeePermissions,
} from "@/hooks/useEmployee";
import { useDepartments } from "@/hooks/useDepartment";

import EmployeesTable from "@/components/tables/EmployeesTable";
import EmployeeModal from "@/components/modals/EmployeeModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import QuickStats from "@/components/QuickStats";
import Button from "@/components/ui/Button";

import { formatDateTime } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { setEmployee } from "@/store/employeeSlice";
import ImagePreviewModal from "../ImagePreviewModal";
import { useSelector } from "react-redux";
import { permissionChecker } from "@/lib/permissionCheker";
import { PERMISSIONS } from "@/lib/permissionKeys";
import EmployeePermissionModal from "../modals/EmployeePermissionModal";
import { Shield } from "lucide-react";
import { usePermissions } from "@/hooks/usePermission";
import { setPermissions } from "@/store/permissionSlice";

export default function EmployeeClient() {
  /* ================= UI STATE ================= */
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const [openModal, setOpenModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const perPage = 10;
  const isEditing = Boolean(editingEmployee);

  const dispatch = useDispatch();
  const router = useRouter();

  const [permOpen, setPermOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  /* ================= PERMISSIONS ================= */
  const perms = useSelector((s) => s.auth.user?.permissions);

  const can = (perm) => permissionChecker(perms, perm?.resource, perm?.action);

  const canCreateEmployee = can(PERMISSIONS.EMPLOYEE.CREATE);
  const canEditEmployee = can(PERMISSIONS.EMPLOYEE.UPDATE);
  const canViewEmployee = can(PERMISSIONS.EMPLOYEE.READ);
  const canDeleteEmployee = can(PERMISSIONS.EMPLOYEE.DELETE);
  const canAssignEmployeePerms = can(PERMISSIONS.EMPLOYEE.ASSIGN_PERMISSIONS);

  const { data: permissionList } = usePermissions();

  useEffect(() => {
    if (permissionList) {
      dispatch(setPermissions(permissionList));
    }
  }, [permissionList, dispatch]);

  /* ================= API ================= */
  const { data, isLoading, refetch, error } = useEmployees({
    page,
    limit: perPage,
    search,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  useEffect(() => {
    if (error) toast.error(error?.message || "Something went wrong");
  }, [error]);

  const { data: deptRes } = useDepartments();

  const { mutate: createEmployee, isPending: creating } = useCreateEmployee();
  const { mutate: updateEmployee, isPending: updating } = useUpdateEmployee();
  const { mutate: deleteEmployee, isPending: deleting } = useDeleteEmployee();
  const { mutate: assignEmployeePerms, isPending: permSaving } =
    useAssignEmployeePermissions();

  /* ================= NORMALIZE ================= */
  const employees =
    data?.data?.map((e) => ({
      ...e,
      fullName: `${e.firstName} ${e.lastName}`,
      createdAt: formatDateTime(e.createdAt),
    })) || [];

  const meta = data?.meta || {};

  const departments =
    deptRes?.data?.map((d) => ({
      label: d.departmentName,
      value: d.id,
    })) || [];

  /* ================= STATS ================= */
  const stats = [
    {
      title: "Total Employees",
      value: meta.total ?? 0,
      icon: Users,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Employees",
      value: employees.filter((e) => e.employeeStatus === "ACTIVE").length,
      icon: CheckCircle,
      iconColor: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Suspended Employees",
      value: employees.filter((e) => e.employeeStatus === "SUSPENDED").length,
      icon: Ban,
      iconColor: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Inactive Employees",
      value: employees.filter((e) => e.employeeStatus === "INACTIVE").length,
      icon: UserX,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  /* ================= ACTIONS ================= */
  const handlePermissionSubmit = (data, setError) => {
    assignEmployeePerms(
      { employeeId: selectedEmployee?.id, payload: data },
      {
        onSuccess: () => {
          toast.success("Permissions updated");
          setPermOpen(false);
        },
        onError: (err) => {
          if (err?.type === "FIELD") {
            err.errors.forEach(({ field, message }) =>
              setError(field, { message }),
            );
            return;
          }
          setError("root", { message: err?.message || "Update failed" });
        },
      },
    );
  };

  const openPermissionModal = (emp) => {
    if (!canAssignEmployeePerms) {
      toast.error("No permission to assign permissions");
      return;
    }
    setSelectedEmployee(emp);
    setPermOpen(true);
  };

  const extraActions = canAssignEmployeePerms
    ? [{ icon: Shield, label: "Permissions", onClick: openPermissionModal }]
    : [];

  const handleImagePreview = (imageUrl) => {
    setPreviewImage(imageUrl);
    setPreviewOpen(true);
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setOpenModal(true);
  };

  const handleEdit = (emp) => {
    setEditingEmployee(emp);
    setOpenModal(true);
  };

  const handleView = (employee) => {
    if (!employee?.id) return;
    dispatch(setEmployee(employee));
    router.push(`/dashboard/employee-management/employees/${employee.id}`);
  };

  const handleSubmit = (formData, setError) => {
    const action = isEditing ? updateEmployee : createEmployee;
    const args = isEditing
      ? { id: editingEmployee.id, payload: formData }
      : formData;

    action(args, {
      onSuccess: () => {
        toast.success(isEditing ? "Employee updated" : "Employee created");
        setOpenModal(false);
        setEditingEmployee(null);
        refetch();
      },
      onError: (err) => {
        if (err?.type === "FIELD") {
          err.errors.forEach(({ field, message }) =>
            setError(field, { message }),
          );
          return;
        }
        setError("root", { message: err?.message });
      },
    });
  };

  const askDelete = (emp) => {
    setSelected(emp);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!selected) return;

    deleteEmployee(selected.id, {
      onSuccess: () => {
        toast.success("Employee deleted");
        setConfirmOpen(false);
        setSelected(null);
        refetch();
      },
    });
  };

  /* ================= RENDER ================= */
  return (
    <>
      <div className="mb-6 flex justify-end">
        {canViewEmployee && (
          <Button
            onClick={refetch}
            variant="outline"
            icon={RefreshCw}
            loading={isLoading}
          >
            Refresh
          </Button>
        )}
      </div>

      <QuickStats stats={stats} />

      <EmployeesTable
        employees={employees}
        total={meta.total ?? 0}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => {
          setStatusFilter(v);
          setPage(1);
        }}
        onAddEmployee={canCreateEmployee ? handleAdd : undefined}
        onEdit={canEditEmployee ? handleEdit : undefined}
        onView={canViewEmployee ? handleView : undefined}
        onDelete={canDeleteEmployee ? askDelete : undefined}
        loading={isLoading}
        extraActions={extraActions}
        onImagePreview={handleImagePreview}
      />

      {openModal && (
        <EmployeeModal
          open={openModal}
          onClose={() => {
            setOpenModal(false);
            setEditingEmployee(null);
          }}
          onSubmit={handleSubmit}
          isPending={creating || updating}
          initialData={editingEmployee}
          departments={departments}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Employee"
        description={`Delete ${selected?.firstName}?`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />

      <ImagePreviewModal
        open={previewOpen}
        image={previewImage}
        onClose={() => setPreviewOpen(false)}
      />

      <EmployeePermissionModal
        open={permOpen}
        onClose={() => setPermOpen(false)}
        employee={selectedEmployee}
        onSubmit={handlePermissionSubmit}
        isPending={permSaving}
      />
    </>
  );
}
