import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertUserProfile, type UserProfile } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useUserProfile() {
  return useQuery({
    queryKey: [api.user.getProfile.path],
    queryFn: async () => {
      const requestId = Math.random().toString(36).substring(7);
      console.log(`[useUserProfile:${requestId}] Fetching ${api.user.getProfile.path}`);
      try {
        const res = await fetch(api.user.getProfile.path, {
          credentials: "include",
          headers: { 'X-Request-ID': requestId }
        });
        console.log(`[useUserProfile:${requestId}] Status: ${res.status}`);
        if (res.status === 404) return null;
        if (!res.ok) {
          const text = await res.text();
          console.error(`[useUserProfile:${requestId}] Error: ${res.status} ${text}`);
          throw new Error("Failed to fetch profile");
        }
        const data = await res.json();
        console.log(`[useUserProfile:${requestId}] Success!`);
        return api.user.getProfile.responses[200].parse(data);
      } catch (err) {
        console.error(`[useUserProfile:${requestId}] Fetch Exception:`, err);
        throw err;
      }
    },
    retry: false,
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<InsertUserProfile, "userId">) => {
      // Zod parsing is implicit via api.user.createProfile.input in routes, 
      // but we send JSON to backend which validates it.
      const res = await fetch(api.user.createProfile.path, {
        method: api.user.createProfile.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create profile");
      }
      return api.user.createProfile.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.user.getProfile.path] });
      toast({ title: "Profile Created", description: "Welcome to your new journey!" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    }
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Partial<Omit<InsertUserProfile, "userId">>) => {
      const res = await fetch(api.user.updateProfile.path, {
        method: api.user.updateProfile.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update profile");
      return api.user.updateProfile.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.user.getProfile.path] });
      toast({ title: "Updated", description: "Your profile has been updated." });
    },
  });
}
