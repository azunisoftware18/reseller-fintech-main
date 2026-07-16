import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

/* ================= GET ALL ================= */
export const useUsers = ({ page, limit, search, status }) =>
  useQuery({
    queryKey: ["users", page, limit, search, status],
    queryFn: () => {
      const params = new URLSearchParams({
        page,
        limit,
      });

      if (search) params.append("search", search);
      if (status) params.append("status", status);

      return apiClient(`/users?${params.toString()}`);
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/* ================= GET BY ID ================= */
export const useUserById = (id) =>
  useQuery({
    queryKey: ["user", id],
    queryFn: () => apiClient(`/users/${id}`),
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/* ================= CREATE ================= */
export const useCreateUser = () =>
  useMutation({
    mutationFn: (payload) =>
      apiClient("/users", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });

/* ================= UPDATE ================= */
export const useUpdateUser = () =>
  useMutation({
    mutationFn: ({ id, payload }) =>
      apiClient(`/users/${id}`, {
        method: "PUT",
        body: payload, // FormData
      }),
  });

/* ================= ASSIGN PERMISSIONS ================= */
export const useAssignUserPermissions = () =>
  useMutation({
    mutationFn: ({ userId, payload }) =>
      apiClient(`/users/${userId}/permissions`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
