import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useCompleteWorkout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, isCompleted, feedback, date }: { id: number; isCompleted: boolean; feedback?: string, date: string }) => {
      const url = buildUrl(api.workouts.complete.path, { id });
      const res = await fetch(url, {
        method: api.workouts.complete.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted, feedback }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update workout status");
      return api.workouts.complete.responses[200].parse(await res.json());
    },
    onSuccess: (data, variables) => {
      const dateStr = variables.date;
      queryClient.invalidateQueries({ queryKey: [api.plans.getWorkouts.path, dateStr] });
      if (data.isCompleted) {
        toast({ title: "Workout Complete", description: "Fantastic effort! Keep it up." });
      }
    },
  });
}

export function useWorkout(id: number | string | undefined) {
  return useQuery({
    queryKey: [api.workouts.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.workouts.get.path, { id: String(id) });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Workout not found");
      return res.json();
    },
    enabled: !!id,
  });
}
