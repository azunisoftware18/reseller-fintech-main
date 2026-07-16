"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Button from "@/components/ui/Button";
import PageSkeleton from "@/components/details/PageSkeleton";
import DataTableSearchEmpty from "@/components/tables/core/DataTableSearchEmpty";
import DepartmentModal from "@/components/modals/DepartmentModal";

import { Building2, Hash, FileText, Plus } from "lucide-react";

import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from "@/hooks/useDepartment";

import {
  setDepartments,
  setDepartment,
  clearDepartment,
} from "@/store/departmentSlice";

import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import RowActions from "../tables/core/RowActions";
import { Shield } from "lucide-react";
import ConfirmDialog from "../ConfirmDialog";
import { PERMISSIONS } from "@/lib/permissionKeys";
import { permissionChecker } from "@/lib/permissionCheker";

import DepartmentPermissionModal from "../modals/DepartmentPermissionModal";
import { useAssignDepartmentPermissions } from "@/hooks/useDepartment";
import { usePermissions } from "@/hooks/usePermission";
import { setPermissions } from "@/store/permissionSlice";

export default function DepartmentClient() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const dispatch = useDispatch();
  const departments = useSelector((s) => s.department.list);
  const current = useSelector((s) => s.department.current);

  const [openModal, setOpenModal] = useState(false);

  const [permOpen, setPermOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  const { data, isLoading, refetch, error } = useDepartments();
  const { mutate: createMutate, isPending: creating } = useCreateDepartment();
  const { mutate: updateMutate, isPending: updating } = useUpdateDepartment();
  const { mutate: deleteMutate, isPending: deleting } = useDeleteDepartment();

  /* ================= PERMISSIONS ================= */
  const perms = useSelector((s) => s.auth.user?.permissions);

  const can = (perm) => permissionChecker(perms, perm?.resource, perm?.action);

  const canCreateDepartment = can(PERMISSIONS.DEPARTMENT.CREATE);
  const canEditDepartment = can(PERMISSIONS.DEPARTMENT.UPDATE);
  const canDeleteDepartment = can(PERMISSIONS.DEPARTMENT.DELETE);
  const canAssignDepartmentPerms = can(
    PERMISSIONS.DEPARTMENT.ASSIGN_PERMISSIONS,
  );

  useEffect(() => {
    dispatch(setDepartments(data?.data || []));
  }, [data, dispatch]);

  useEffect(() => {
    if (error) toast.error(error?.message || "Something went wrong");
  }, [error]);

  const { data: permissionList } = usePermissions();

  const { mutate: assignDeptPerms, isPending: permSaving } =
    useAssignDepartmentPermissions();

  useEffect(() => {
    if (permissionList) {
      dispatch(setPermissions(permissionList));
    }
  }, [permissionList, dispatch]);

  const handleDepartmentPermissionSubmit = (data, setError) => {
    assignDeptPerms(
      {
        id: selectedDept?.id,
        permissionIds: data.permissionIds,
      },
      {
        onSuccess: () => {
          toast.success("Department permissions updated");
          setPermOpen(false);
        },
        onError: (err) => {
          setError("root", { message: err?.message });
        },
      },
    );
  };

  const handleSubmit = (payload, setError) => {
    const action = current ? updateMutate : createMutate;
    const args = current ? { id: current.id, payload } : payload;

    action(args, {
      onSuccess: () => {
        toast.success(current ? "Department updated" : "Department created");
        dispatch(clearDepartment());
        setOpenModal(false);
        refetch();
      },

      onError: (err) => {
        if (err?.type === "FIELD") {
          err.errors.forEach(({ field, message }) => {
            setError(field, { message });
          });
          return;
        }

        setError("root", {
          message: err?.message || "Operation failed",
        });
      },
    });
  };

  const askDelete = (dept) => {
    setSelectedDept(dept);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedDept) return;

    deleteMutate(selectedDept.id, {
      onSuccess: () => {
        toast.success("Department deleted");
        setConfirmOpen(false);
        setSelectedDept(null);
        refetch();
      },
      onError: (err) => {
        toast.error(err?.message || "Failed to delete department");
      },
    });
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <>
      {/* HEADER */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground mt-1">
            Organize teams and control access permissions
          </p>
        </div>

        {canCreateDepartment && (
          <Button
            icon={Plus}
            onClick={() => {
              dispatch(clearDepartment());
              setOpenModal(true);
            }}
          >
            Add Department
          </Button>
        )}
      </div>

      {/* LIST */}
      {departments.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className={cn(
                "group relative rounded-xl border bg-card p-5",
                "transition-all hover:shadow-md hover:border-primary/40",
              )}
            >
              <div className="absolute right-3 top-3  transition">
                <RowActions
                  onEdit={
                    canEditDepartment
                      ? () => {
                          dispatch(setDepartment(dept));
                          setOpenModal(true);
                        }
                      : undefined
                  }
                  onDelete={
                    canDeleteDepartment ? () => askDelete(dept) : undefined
                  }
                  extraActions={[
                    canAssignDepartmentPerms
                      ? {
                          icon: Shield,
                          label: "Permissions",
                          onClick: () => {
                            setSelectedDept(dept);
                            setPermOpen(true);
                          },
                        }
                      : undefined,
                  ]}
                />
              </div>

              {/* TITLE */}
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <h3 className="font-semibold text-lg leading-tight">
                    {dept.departmentName}
                  </h3>

                  <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium uppercase tracking-wide">
                    <Hash className="h-3 w-3" />
                    {dept.departmentCode}
                  </span>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4 mt-0.5" />
                <p className="line-clamp-2">
                  {dept.departmentDescription || "No description provided"}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DataTableSearchEmpty
          isEmpty
          emptyTitle="No departments yet"
          emptyDescription="Create departments to manage teams and permissions"
          emptyAction={
            canCreateDepartment && (
              <Button icon={Building2} onClick={() => setOpenModal(true)}>
                Create Department
              </Button>
            )
          }
        />
      )}

      {/* MODAL */}
      {openModal && (
        <DepartmentModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onSubmit={handleSubmit}
          isPending={creating || updating}
          initialData={current}
        />
      )}

      {confirmOpen && (
        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Department"
          description={`Are you sure you want to delete "${selectedDept?.departmentName}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
          loading={deleting}
        />
      )}
      <DepartmentPermissionModal
        open={permOpen}
        onClose={() => setPermOpen(false)}
        department={selectedDept}
        onSubmit={handleDepartmentPermissionSubmit}
        isPending={permSaving}
      />
    </>
  );
}
