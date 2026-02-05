import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export function useDailyPlan(date: Date) {
  const dateStr = format(date, "yyyy-MM-dd");
  return useQuery({
    queryKey: [api.plans.getDaily.path, dateStr],
    queryFn: async () => {
      const url = buildUrl(api.plans.getDaily.path, { date: dateStr });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch plan");
      return api.plans.getDaily.responses[200].parse(await res.json());
    },
  });
}

export function usePlanMeta(date: Date) {
  const dateStr = format(date, "yyyy-MM-dd");
  return useQuery({
    queryKey: [api.plans.getMeta.path, dateStr],
    queryFn: async () => {
      const url = buildUrl(api.plans.getMeta.path, { date: dateStr });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch plan meta");
      return api.plans.getMeta.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateWater() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ date, amount }: { date: string; amount: number }) => {
      const res = await fetch(api.plans.updateWater.path, {
        method: api.plans.updateWater.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, amount }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update water");
      return api.plans.updateWater.responses[200].parse(await res.json());
    },
    onMutate: async ({ date, amount }) => {
      // Focus on meta cache
      const queryKey = [api.plans.getMeta.path, date];
      await queryClient.cancelQueries({ queryKey });
      const previousPlan = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          waterIntake: Math.max(0, (old.waterIntake || 0) + amount)
        };
      });

      return { previousPlan };
    },
    onError: (err, { date }, context) => {
      if (context?.previousPlan) {
        queryClient.setQueryData([api.plans.getMeta.path, date], context.previousPlan);
      }
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    },
    onSuccess: (data: any) => {
      const dateStr = data.date;
      queryClient.setQueryData([api.plans.getMeta.path, dateStr], data);
    }
  });
}

export function useWorkouts(date: Date) {
  const dateStr = format(date, "yyyy-MM-dd");
  return useQuery({
    queryKey: [api.plans.getWorkouts.path, dateStr],
    queryFn: async () => {
      const url = buildUrl(api.plans.getWorkouts.path, { date: dateStr });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return [];
      if (!res.ok) throw new Error("Failed to fetch workouts");
      return api.plans.getWorkouts.responses[200].parse(await res.json());
    },
  });
}

export function useGeneratePlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const res = await fetch(api.plans.generate.path, {
        method: api.plans.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr }),
        credentials: "include",
      });

      if (!res.ok) {
        let errorMessage = "Failed to generate plan";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorData.details || errorMessage;
        } catch (e) {
          // Fallback to status text
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      return api.plans.generate.responses[201].parse(await res.json());
    },
    onSuccess: (data: any) => {
      const dateStr = data.date;
      console.log(`Plan generation success for ${dateStr}. Updating caches.`);

      // Immediately set the meta data to trigger UI transition
      queryClient.setQueryData([api.plans.getMeta.path, dateStr], data);

      // Invalidate all related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: [api.plans.getDaily.path, dateStr] });
      queryClient.invalidateQueries({ queryKey: [api.plans.getMeals.path, dateStr] });
      queryClient.invalidateQueries({ queryKey: [api.plans.getWorkouts.path, dateStr] });

      toast({ title: "Plan Ready", description: "Your daily plan has been generated!" });
    },
    onError: (err: Error) => {
      console.error("useGeneratePlan error:", err);
      toast({
        title: "Generation Failed",
        description: err.message,
        variant: "destructive"
      });
    }
  });
}
