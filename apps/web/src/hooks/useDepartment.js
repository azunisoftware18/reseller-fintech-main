import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

/* ================= GET ALL ================= */
export const useDepartments = () =>
  useQuery({
    queryKey: ["departments"],
    queryFn: () => apiClient("/departments"),
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/* ================= GET BY ID ================= */
export const useDepartmentById = (id) =>
  useQuery({
    queryKey: ["department", id],
    queryFn: () => apiClient(`/departments/${id}`),
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/* ================= CREATE ================= */
export const useCreateDepartment = () =>
  useMutation({
    mutationFn: (payload) =>
      apiClient("/departments", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });

/* ================= UPDATE ================= */
export const useUpdateDepartment = () =>
  useMutation({
    mutationFn: ({ id, payload }) =>
      apiClient(`/departments/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
  });

/* ================= DELETE ================= */
export const useDeleteDepartment = () =>
  useMutation({
    mutationFn: (id) =>
      apiClient(`/departments/${id}`, {
        method: "DELETE",
      }),
  });

/* ================= ASSIGN PERMISSIONS ================= */
export const useAssignDepartmentPermissions = () =>
  useMutation({
    mutationFn: ({ id, permissionIds }) =>
      apiClient(`/departments/${id}/permissions`, {
        method: "POST",
        body: JSON.stringify({ permissionIds }),
      }),
  });
