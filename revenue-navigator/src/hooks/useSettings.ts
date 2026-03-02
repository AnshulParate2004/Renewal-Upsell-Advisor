import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi, type AppSettings } from "@/lib/api/settings";

const SETTINGS_QUERY_KEY = ["app-settings"];

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

