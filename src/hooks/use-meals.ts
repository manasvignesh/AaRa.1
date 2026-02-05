import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function useMeals(date: Date) {
  const dateStr = format(date, "yyyy-MM-dd");
  return useQuery({
    queryKey: [api.plans.getMeals.path, dateStr],
    queryFn: async () => {
      const url = buildUrl(api.plans.getMeals.path, { date: dateStr });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return [];
      if (!res.ok) throw new Error("Failed to fetch meals");
      return api.plans.getMeals.responses[200].parse(await res.json());
    },
  });
}

export function useToggleMealConsumed() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, isConsumed, date }: { id: number; isConsumed: boolean; date: string }) => {
      const url = buildUrl(api.meals.toggleConsumed.path, { id });
      const res = await fetch(url, {
        method: api.meals.toggleConsumed.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isConsumed }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update meal status");
      return api.meals.toggleConsumed.responses[200].parse(await res.json());
    },
    onMutate: async ({ id, isConsumed, date }) => {
      const queryKey = [api.plans.getMeals.path, date];
      await queryClient.cancelQueries({ queryKey });
      const previousMeals = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return old.map((m: any) => m.id === id ? { ...m, isConsumed, consumedAlternative: false } : m);
      });

      return { previousMeals };
    },
    onSuccess: (updatedMeal: any, { date }) => {
      queryClient.setQueryData([api.plans.getMeals.path, date], (old: any) => {
        if (!old) return [updatedMeal];
        return old.map((m: any) => m.id === updatedMeal.id ? updatedMeal : m);
      });
    },
    onError: (err, { date }, context) => {
      if (context?.previousMeals) {
        queryClient.setQueryData([api.plans.getMeals.path, date], context.previousMeals);
      }
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  });
}

export function useLogAlternativeMeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, description, portionSize, date }: { id: number; description: string; portionSize: 'small' | 'medium' | 'large', date: string }) => {
      const url = buildUrl(api.meals.logAlternative.path, { id });
      const res = await fetch(url, {
        method: api.meals.logAlternative.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, portionSize }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to log alternative meal");
      return api.meals.logAlternative.responses[200].parse(await res.json());
    },
    onMutate: async ({ id, description, portionSize, date }) => {
      const queryKey = [api.plans.getMeals.path, date];
      await queryClient.cancelQueries({ queryKey });
      const previousMeals = queryClient.getQueryData(queryKey);

      // Estimate locally for instant feedback
      const portionMultiplier: Record<string, number> = { small: 0.7, medium: 1.0, large: 1.4 };
      const baseCals = description.toLowerCase().includes('salad') ? 250 : 350;
      const estCals = Math.round(baseCals * (portionMultiplier[portionSize] || 1.0));
      const estPro = Math.round(estCals * 0.15 / 4);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return old.map((m: any) => m.id === id ? {
          ...m,
          isConsumed: false,
          consumedAlternative: true,
          alternativeDescription: description,
          alternativeCalories: estCals,
          alternativeProtein: estPro
        } : m);
      });

      return { previousMeals };
    },
    onSuccess: (updatedMeal: any, { date }) => {
      queryClient.setQueryData([api.plans.getMeals.path, date], (old: any) => {
        if (!old) return [updatedMeal];
        return old.map((m: any) => m.id === updatedMeal.id ? updatedMeal : m);
      });

      toast({
        title: "Meal Logged",
        description: `Alternative meal logged successfully.`
      });
    },
    onError: (err, { date }, context) => {
      if (context?.previousMeals) {
        queryClient.setQueryData([api.plans.getMeals.path, date], context.previousMeals);
      }
      toast({ title: "Logging Failed", description: err.message, variant: "destructive" });
    }
  });
}

export function useRegenerateMeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, reason, availableIngredients, date }: { id: number; reason: string; availableIngredients?: string[], date: string }) => {
      const url = buildUrl(api.meals.regenerate.path, { id });
      const res = await fetch(url, {
        method: api.meals.regenerate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, availableIngredients }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to regenerate meal");
      return api.meals.regenerate.responses[200].parse(await res.json());
    },
    onSuccess: (updatedMeal: any, { date }) => {
      queryClient.setQueryData([api.plans.getMeals.path, date], (old: any) => {
        if (!old) return [updatedMeal];
        return old.map((m: any) => m.id === updatedMeal.id ? updatedMeal : m);
      });

      toast({ title: "Meal Regenerated", description: "New option created based on your feedback." });
    },
  });
}

export function useLogManualMeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { planId: number; description: string; portionSize: 'small' | 'medium' | 'large'; mealType: 'snack' | 'meal'; date: string }) => {
      const res = await fetch(api.manualMeals.log.path, {
        method: api.manualMeals.log.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to log manual meal");
      return api.manualMeals.log.responses[201].parse(await res.json());
    },
    onSuccess: (newMeal: any, { date }) => {
      queryClient.setQueryData([api.plans.getMeals.path, date], (old: any) => {
        if (!old) return [newMeal];
        return [...old, newMeal];
      });

      // Also invalidate plan meta because manual meal might trigger adaptation
      queryClient.invalidateQueries({ queryKey: [api.plans.getMeta.path, date] });

      toast({ title: "Meal Logged", description: "Manual meal added to your daily progress." });
    },
  });
}
