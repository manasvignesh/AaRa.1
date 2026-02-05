import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function useWeightHistory() {
  return useQuery({
    queryKey: [api.weight.getHistory.path],
    queryFn: async () => {
      const res = await fetch(api.weight.getHistory.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch weight history");
      return api.weight.getHistory.responses[200].parse(await res.json());
    },
  });
}

export function useLogWeight() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ weight, date }: { weight: number; date: Date }) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const res = await fetch(api.weight.log.path, {
        method: api.weight.log.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight, date: dateStr }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to log weight");
      return api.weight.log.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.weight.getHistory.path] });
      queryClient.invalidateQueries({ queryKey: [api.user.getProfile.path] });
      toast({ title: "Weight Logged", description: "Progress recorded." });
    },
  });
}
