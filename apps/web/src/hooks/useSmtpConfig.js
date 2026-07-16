// hooks/useSmtpConfig.js
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

/* ================= CREATE ================= */
export const useCreateSmtpConfig = () =>
  useMutation({
    mutationFn: async (payload) =>
      apiClient("/smtp-configs", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });

/* ================= UPDATE ================= */
export const useUpdateSmtpConfig = (id) =>
  useMutation({
    mutationFn: async (payload) =>
      apiClient(`/smtp-configs/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
  });

/* ================= GET BY ID ================= */
export const useSmtpConfigById = () =>
  useQuery({
    queryKey: ["smtp-config"],
    queryFn: () => apiClient(`/smtp-configs`),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
