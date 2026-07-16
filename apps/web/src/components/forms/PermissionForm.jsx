"use client";

import { useForm, useWatch } from "react-hook-form";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import Button from "../ui/Button";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function PermissionForm({
  onSubmit,
  isPending,
  mode,
  permissions = [],
}) {
  const permissionState = useSelector((state) => state.permission?.permissions);
  const permissionsData = Array.isArray(permissionState?.data)
    ? permissionState.data
    : [];

  const {
    handleSubmit,
    setValue,
    getValues,
    control,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: { permissions: [] },
  });

  const [openResource, setOpenResource] = useState(null);

  const selected =
    useWatch({
      control,
      name: "permissions",
    }) || [];

  useEffect(() => {
    if (!permissions?.length) return;

    const mapped = permissions.map((p) => ({
      permissionId: p.id,
      effect: "ALLOW",
    }));

    setValue("permissions", mapped);
  }, [permissions, setValue]);

  // Grouping
  const grouped = permissionsData.reduce((acc, perm) => {
    if (!acc[perm.resource]) acc[perm.resource] = [];
    acc[perm.resource].push(perm);
    return acc;
  }, {});

  const toggleEffect = (permId) => {
    const current = getValues("permissions") || [];
    const exists = current.find((p) => p.permissionId === permId);

    if (exists) {
      setValue(
        "permissions",
        current.filter((p) => p.permissionId !== permId),
      );
    } else {
      setValue("permissions", [
        ...current,
        { permissionId: permId, effect: "ALLOW" },
      ]);
    }
  };

  const isAllowed = (id) => selected.some((p) => p.permissionId === id);

  const onFormSubmit = () => {
    const selected = getValues("permissions") || [];

    if (mode === "role" || mode === "department") {
      const permissionIds = selected.map((p) => p.permissionId);
      onSubmit({ permissionIds }, setError);
    } else {
      onSubmit({ permissions: selected }, setError);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="flex flex-col h-full relative"
    >
      <div className="flex-1 overflow-y-auto overflow-x-visible pr-2">
        {errors.permissions && (
          <p className="text-xs text-destructive text-red-500 px-1 mb-2">
            {errors.permissions.message}
          </p>
        )}
        <div className="grid md:grid-cols-2 gap-4 relative">
          {Object.entries(grouped).map(([resource, resourcePerms]) => {
            const allowedCount = resourcePerms.filter((perm) =>
              isAllowed(perm.id),
            ).length;

            return (
              <div
                key={resource}
                className="relative border rounded-xl overflow-visible bg-card shadow-sm"
              >
                {/* HEADER */}
                <div
                  className="flex justify-between items-center px-4 py-3 bg-muted/50 cursor-pointer hover:bg-muted transition"
                  onClick={() =>
                    setOpenResource(openResource === resource ? null : resource)
                  }
                >
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm tracking-wide">
                      {resource}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {allowedCount}/{resourcePerms.length}
                    </span>
                  </div>

                  {openResource === resource ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </div>

                {/* DROPDOWN */}
                {openResource === resource && (
                  <div className="absolute left-0 top-full w-full z-999 mt-1 rounded-lg border border-border bg-card shadow-2xl">
                    <div className="max-h-56 overflow-y-auto divide-y">
                      {resourcePerms.map((perm) => (
                        <div
                          key={perm.id}
                          className="flex justify-between items-center px-4 py-3 hover:bg-muted/40 transition"
                        >
                          <span className="text-sm font-medium">
                            {perm.action}
                          </span>

                          <Button
                            type="button"
                            size="sm"
                            className="min-w-20"
                            variant={
                              isAllowed(perm.id) ? "destructive" : "default"
                            }
                            onClick={() => toggleEffect(perm.id)}
                          >
                            {isAllowed(perm.id) ? "Remove" : "Allow"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t mt-3">
          <Button type="submit" className="w-full" loading={isPending}>
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  );
}
