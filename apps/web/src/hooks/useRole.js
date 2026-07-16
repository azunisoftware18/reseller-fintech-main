import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

/* ================= GET ROLES ================= */
export const useRoles = () =>
  useQuery({
    queryKey: ["roles"],
    queryFn: () => apiClient("/roles"),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/* ================= GET BY ID ================= */
export const useRoleById = (id) =>
  useQuery({
    queryKey: ["role", id],
    queryFn: () => apiClient(`/roles/${id}`),
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/* ================= CREATE ================= */
export const useCreateRole = () =>
  useMutation({
    mutationFn: (payload) =>
      apiClient("/roles", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });

/* ================= UPDATE ================= */
export const useUpdateRole = () =>
  useMutation({
    mutationFn: ({ id, payload }) =>
      apiClient(`/roles/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
  });

/* ================= DELETE ================= */
export const useDeleteRole = () =>
  useMutation({
    mutationFn: (id) =>
      apiClient(`/roles/${id}`, {
        method: "DELETE",
      }),
  });

/* ================= ASSIGN PERMISSIONS ================= */
export const useAssignRolePermissions = () =>
  useMutation({
    mutationFn: ({ id, permissionIds }) =>
      apiClient(`/roles/${id}/permissions`, {
        method: "POST",
        body: JSON.stringify({ permissionIds }),
      }),
  });
