import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

/* ================= GET ALL STATES ================= */
export const useStates = (search = "") =>
  useQuery({
    queryKey: ["states", search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      return apiClient(`/state-city/states?${params.toString()}`);
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/* ================= GET CITIES BY STATE ================= */
export const useCitiesByState = (stateCode, search = "") =>
  useQuery({
    queryKey: ["cities", stateCode, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      return apiClient(
        `/state-city/cities/state/${stateCode}?${params.toString()}`,
      );
    },
    enabled: !!stateCode, // only run when stateCode exists
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
