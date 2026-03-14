import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi, setupApi, type AppSettings, type SetupConfig } from "@/lib/api/settings";

const SETTINGS_QUERY_KEY = ["app-settings"];
const SETUP_QUERY_KEY = ["setup-config"];

export const useAppSettings = () => {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: () => settingsApi.getConfig(),
    staleTime: 60_000,
    retry: false,
  });
};

export const useUpdateAppSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: AppSettings) => settingsApi.updateConfig(config),
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, data);
    },
  });
};

export const useSetupConfig = () => {
  return useQuery({
    queryKey: SETUP_QUERY_KEY,
    queryFn: () => setupApi.getSetup(),
    staleTime: 60_000,
    retry: false,
  });
};

export const useUpdateSetupConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: SetupConfig) => setupApi.saveSetup(config),
    onSuccess: (data) => {
      queryClient.setQueryData(SETUP_QUERY_KEY, data);
    },
  });
};

