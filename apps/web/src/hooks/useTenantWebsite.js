import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useSelector } from "react-redux";

export const useTenantWebsite = () =>
  useQuery({
    queryKey: ["website"],
    queryFn: () => apiClient("/website", { method: "GET" }),
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

export const useUpsertTenantWebsite = () =>
  useMutation({
    mutationFn: async (payload) =>
      apiClient("/website", {
        method: "POST",
        body: payload,
      }),
  });

export const useWebsite = () => {
  return useSelector((state) => state.tenantWebsite?.currentWebsite);
};
