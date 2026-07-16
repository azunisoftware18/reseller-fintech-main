"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Button from "@/components/ui/Button";
import PageSkeleton from "@/components/details/PageSkeleton";
import DataTableSearchEmpty from "@/components/tables/core/DataTableSearchEmpty";
import RoleModal from "@/components/modals/RoleModal";

import { Shield, Hash, FileText, Plus } from "lucide-react";

import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useAssignRolePermissions,
} from "@/hooks/useRole";

import { setRoles, setRole, clearRole } from "@/store/roleSlice";

import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import RowActions from "../tables/core/RowActions";
import RolePermissionModal from "../modals/RolePermissionModal";
import { usePermissions } from "@/hooks/usePermission";
import { setPermissions } from "@/store/permissionSlice";
import { PERMISSIONS } from "@/lib/permissionKeys";
import { permissionChecker } from "@/lib/permissionCheker";

export const ROLE_FLOW = {
  AZZUNIQUE: ["RESELLER"],
  RESELLER: ["WHITE_LABEL"],
  WHITE_LABEL: ["STATE_HEAD", "MASTER_DISTRIBUTOR", "DISTRIBUTOR", "RETAILER"],
  STATE_HEAD: [],
  MASTER_DISTRIBUTOR: [],
  DISTRIBUTOR: [],
  RETAILER: [],
};

export default function RoleClient() {
  const dispatch = useDispatch();
  const roles = useSelector((s) => s.role.list);
  const current = useSelector((s) => s.role.current);

  const [openModal, setOpenModal] = useState(false);
  const [permOpen, setPermOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const perms = useSelector((s) => s.auth.user?.permissions);

  const openPermissionModal = (role) => {
    setSelectedRole(role);
    setPermOpen(true);
  };

  const { data, isLoading, refetch } = useRoles();
  const { mutate: createMutate, isPending: creating } = useCreateRole();
  const { mutate: updateMutate, isPending: updating } = useUpdateRole();

  const { mutate: assignRolePerms, isPending: permSaving } =
    useAssignRolePermissions();
  const { data: permissionList } = usePermissions();

  useEffect(() => {
    if (permissionList) {
      dispatch(setPermissions(permissionList));
    }
  }, [permissionList, dispatch]);

  const handleRolePermissionSubmit = (data, setError) => {
    assignRolePerms(
      { id: selectedRole?.id, permissionIds: data.permissionIds },
      {
        onSuccess: () => {
          toast.success("Role permissions updated");
          setPermOpen(false);
        },
        onError: (err) => {
          setError("root", { message: err?.message });
        },
      },
    );
  };

  useEffect(() => {
    dispatch(setRoles(data?.data || []));
  }, [data, dispatch]);

  const actorRoleCode = useSelector((s) => s.auth.user?.role.roleCode);
  const allowedRoles = ROLE_FLOW[actorRoleCode] || [];

  // FIX: Check if ALL allowed roles have been created
  const allRolesCreated =
    allowedRoles.length > 0 &&
    allowedRoles.every((allowedRole) =>
      roles.some((r) => r.roleCode === allowedRole),
    );

  const handleSubmit = (payload, setError) => {
    const action = current ? updateMutate : createMutate;
    const args = current ? { id: current.id, payload } : payload;

    action(args, {
      onSuccess: () => {
        toast.success(current ? "Role updated" : "Role created");
        dispatch(clearRole());
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
        setError("root", { message: err?.message || "Operation failed" });
      },
    });
  };

  if (isLoading) return <PageSkeleton />;

  // PERMISSION
  const can = (perm) => permissionChecker(perms, perm.resource, perm.action);
  const canCreateRole = can(PERMISSIONS.ROLE.CREATE);
  const canEditRole = can(PERMISSIONS.ROLE.UPDATE);
  const canAssignPerms = can(PERMISSIONS.ROLE.ASSIGN_PERMISSIONS);

  return (
    <>
      {/* HEADER */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground mt-1">
            Manage access hierarchy and permissions
          </p>
        </div>
        {/* FIX: Updated condition to show button until ALL roles are created */}
        {canCreateRole && allowedRoles.length > 0 && !allRolesCreated && (
          <Button
            icon={Plus}
            onClick={() => {
              dispatch(clearRole());
              setOpenModal(true);
            }}
          >
            Add Role
          </Button>
        )}
      </div>

      {/* LIST */}
      {roles.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div
              key={role.id}
              className={cn(
                "group relative rounded-xl border bg-card p-5",
                "transition-all hover:shadow-md hover:border-primary/40",
              )}
            >
              <div className="absolute right-3 top-3">
                <RowActions
                  onEdit={
                    canEditRole
                      ? () => {
                          dispatch(setRole(role));
                          setOpenModal(true);
                        }
                      : undefined
                  }
                  extraActions={
                    canAssignPerms
                      ? [
                          {
                            icon: Shield,
                            label: "Permissions",
                            onClick: () => openPermissionModal(role),
                          },
                        ]
                      : []
                  }
                />
              </div>

              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <h3 className="font-semibold text-lg leading-tight">
                    {role.roleName}
                  </h3>

                  <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium uppercase tracking-wide">
                    <Hash className="h-3 w-3" />
                    {role.roleCode}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4 mt-0.5" />
                <p className="line-clamp-2">
                  {role.roleDescription || "No description provided"}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DataTableSearchEmpty
          isEmpty
          emptyTitle="No roles yet"
          emptyDescription="Create roles to define system hierarchy"
          emptyAction={
            canCreateRole && (
              <Button icon={Shield} onClick={() => setOpenModal(true)}>
                Create Role
              </Button>
            )
          }
        />
      )}

      {openModal && (
        <RoleModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onSubmit={handleSubmit}
          isPending={creating || updating}
          initialData={current}
        />
      )}

      <RolePermissionModal
        open={permOpen}
        onClose={() => setPermOpen(false)}
        role={selectedRole}
        onSubmit={handleRolePermissionSubmit}
        isPending={permSaving}
      />
    </>
  );
}
