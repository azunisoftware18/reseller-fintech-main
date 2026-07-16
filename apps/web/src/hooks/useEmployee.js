import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

/* ================= GET ALL ================= */
export const useEmployees = ({ page, limit, search = "", status = "all" }) =>
  useQuery({
    queryKey: ["employees", page, limit, search, status],
    queryFn: () =>
      apiClient(
        `/employees?page=${page}&limit=${limit}&search=${search}&status=${status}`,
      ),
    keepPreviousData: true,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/* ================= GET BY ID ================= */
export const useEmployeeById = (id) =>
  useQuery({
    queryKey: ["employee", id],
    queryFn: () => apiClient(`/employees/${id}`),
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/* ================= CREATE ================= */
export const useCreateEmployee = () =>
  useMutation({
    mutationFn: (payload) =>
      apiClient("/employees", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });

/* ================= UPDATE ================= */
export const useUpdateEmployee = () =>
  useMutation({
    mutationFn: ({ id, payload }) =>
      apiClient(`/employees/${id}`, {
        method: "PUT",
        body: payload, // FormData
      }),
  });

/* ================= DELETE ================= */
export const useDeleteEmployee = () =>
  useMutation({
    mutationFn: (id) =>
      apiClient(`/employees/${id}`, {
        method: "DELETE",
      }),
  });

/* ================= ASSIGN PERMISSIONS ================= */
export const useAssignEmployeePermissions = () =>
  useMutation({
    mutationFn: ({ employeeId, payload }) =>
      apiClient(`/employees/${employeeId}/permissions`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
