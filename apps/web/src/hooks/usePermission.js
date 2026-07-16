import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export const usePermissions = () =>
  useQuery({
    queryKey: ["permissions"],
    queryFn: () => apiClient("/permissions"),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
