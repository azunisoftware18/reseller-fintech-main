import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

// ================= Services =================

// GET SERVICES (LIST + PAGINATION + FILTER)
export const useServices = (params = {}) =>
  useQuery({
    queryKey: ["services", params],
    queryFn: async () => {
      const query = new URLSearchParams(params).toString();
      const res = await apiClient(`/admin/services?${query}`);
      return res?.data;
    },
    keepPreviousData: true,
  });

// CREATE SERVICE
export const useCreateService = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const res = await apiClient("/admin/services", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res?.data;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
    },
  });
};

// UPDATE SERVICE
export const useUpdateService = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await apiClient(`/admin/services/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return res?.data;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
    },
  });
};

// ================= PROVIDER =================

// GET PROVIDERS (LIST + PAGINATION + FILTER)
export const useProviders = (params = {}) =>
  useQuery({
    queryKey: ["providers", params],
    queryFn: async () => {
      const query = new URLSearchParams(params).toString();
      const res = await apiClient(`/admin/providers?${query}`);
      return res?.data;
    },
    keepPreviousData: true,
  });

// CREATE PROVIDER
export const useCreateProvider = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const res = await apiClient("/admin/providers", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res?.data;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["providers"] });
    },
  });
};

// UPDATE PROVIDER
export const useUpdateProvider = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await apiClient(`/admin/providers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return res?.data;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["providers"] });
    },
  });
};

// ================= ServiceProviderMapping =================

// GET MAPPINGS (LIST + PAGINATION + FILTER)
export const useMappings = (params = {}) =>
  useQuery({
    queryKey: ["mappings", params],
    queryFn: async () => {
      const query = new URLSearchParams(params).toString();
      const res = await apiClient(`/admin/mappings?${query}`);
      return res?.data?.mappings;
    },
    keepPreviousData: true,
  });

// GET ALLOWED MAPPINGS (PERMISSION-BASED, NO PAGINATION)
export const useAllowedMappings = (params = {}) =>
  useQuery({
    queryKey: ["allowed-mappings", params],
    queryFn: async () => {
      const query = new URLSearchParams(params).toString();
      const res = await apiClient(`/admin/mappings/allowed?${query}`);
      return res?.data?.mappings;
    },

    // 🔥 YAHI ADD KARNA HAI
    select: (data) =>
      (data || []).map((m) => ({
        value: m.id,
        label: `${m.serviceCode} - ${m.providerCode}`,
        ...m,
      })),
  });

// CREATE MAPPING
export const useCreateMapping = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const res = await apiClient("/admin/mappings", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res?.data;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mappings"] });
    },
  });
};

// UPDATE MAPPING
export const useUpdateMapping = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await apiClient(`/admin/mappings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return res?.data;
    },

    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["mappings"] });
      qc.invalidateQueries({ queryKey: ["mapping", variables.id] });
    },
  });
};

// HARD DELETE MAPPING
export const useHardDeleteMapping = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const res = await apiClient(`/admin/mappings/hard/${id}`, {
        method: "DELETE",
      });
      return res?.data;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mappings"] });
    },
  });
};

// ================= PROVIDER SLABS =================

// CREATE SLAB
export const useCreateSlab = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const res = await apiClient("/admin/slabs", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res?.data;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["slabs"] });
    },
  });
};

// UPDATE SLAB
export const useUpdateSlab = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await apiClient(`/admin/slabs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return res?.data;
    },

    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["slabs"] });
      qc.invalidateQueries({ queryKey: ["slab", variables.id] });
    },
  });
};

// HARD DELETE SLAB
export const useHardDeleteSlab = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const res = await apiClient(`/admin/slabs/hard/${id}`, {
        method: "DELETE",
      });
      return res?.data;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["slabs"] });
    },
  });
};

// GET SLABS BY MAPPING ID
export const useSlabsByMappingId = (mappingId, params = {}) =>
  useQuery({
    queryKey: ["slabs", "mapping", mappingId, params],
    queryFn: async () => {
      if (!mappingId) {
        return {
          data: [],
          meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
        };
      }

      const query = new URLSearchParams(params).toString();
      const res = await apiClient(`/admin/slabs/mapping/${mappingId}?${query}`);
      return res?.data?.slabs;
    },
    keepPreviousData: true,
    enabled: !!mappingId, // Only run the query if mappingId exists
  });
