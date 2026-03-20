import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Loader2, LogOut, Target, User, Utensils } from "lucide-react";

import { useUserProfile, useUpdateProfile } from "@/hooks/use-user";
import { useAuth } from "@/hooks/use-auth";
import { PageLayout } from "@/components/PageLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField } from "@/components/ui/form";
import { ThemeToggle } from "@/components/ThemeToggle";
import { insertUserProfileSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { api } from "@shared/routes";

export default function Profile() {
  const { data: profile, isLoading } = useUserProfile();
  const { logout } = useAuth();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertUserProfileSchema.omit({ userId: true }).partial()),
    defaultValues: profile || {},
    values: profile || undefined,
  });

  if (isLoading || !profile) {
    return (
      <PageLayout>
        <div className="page-transition flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </PageLayout>
    );
  }

  const onSubmit = (data: any) => {
    updateProfile(data, {
      onSuccess: async () => {
        toast({ title: "Profile synced", description: "Your visual refresh is paired with your existing data." });
        await queryClient.invalidateQueries({ queryKey: [api.user.getProfile.path] });
      },
    });
  };

  const initials = profile.displayName
    ? profile.displayName.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase()
    : "AA";

  return (
    <div className="page-transition">
      <PageLayout
        maxWidth="md"
        header={
          <div className="flex items-start justify-between">
            <div>
              <div className="section-label mb-2">Profile</div>
              <h1 className="font-display text-4xl">Your Wellness Identity</h1>
            </div>
            <ThemeToggle />
          </div>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pb-6">
            <section className="metric-card animate-slide-up">
              <div className="flex items-center gap-4">
                <div className="brand-gradient flex h-20 w-20 items-center justify-center rounded-3xl text-2xl font-bold text-white">
                  {initials}
                </div>
                <div>
                  <h2 className="font-display text-3xl">{profile.displayName || "Guest"}</h2>
                  <span className="pill-brand mt-3 inline-flex">
                    {(profile.primaryGoal || "wellness").replace("_", " ")}
                  </span>
                </div>
              </div>
            </section>

            <section className="animate-slide-up grid grid-cols-3 gap-4">
              <div className="metric-card stagger-1 text-center">
                <div className="section-label mb-2">Height</div>
                <div className="font-display text-2xl">{profile.height || "--"}</div>
              </div>
              <div className="metric-card stagger-2 text-center">
                <div className="section-label mb-2">Weight</div>
                <div className="font-display text-2xl">{profile.currentWeight || "--"}</div>
              </div>
              <div className="metric-card stagger-3 text-center">
                <div className="section-label mb-2">Goal</div>
                <div className="font-display text-2xl">{profile.targetWeight || "--"}</div>
              </div>
            </section>

            <section className="wellness-card animate-slide-up p-6">
              <div className="section-label mb-4">Account Details</div>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <div>
                      <label className="section-label mb-2 block">Display Name</label>
                      <Input {...field} value={field.value || ""} className="input-field" />
                    </div>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <div>
                        <label className="section-label mb-2 block">Height</label>
                        <Input type="number" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} className="input-field" />
                      </div>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currentWeight"
                    render={({ field }) => (
                      <div>
                        <label className="section-label mb-2 block">Weight</label>
                        <Input type="number" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} className="input-field" />
                      </div>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="dietaryPreferences"
                  render={({ field }) => (
                    <div>
                      <label className="section-label mb-2 block">Diet Preference</label>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger className="input-field h-auto">
                          <SelectValue placeholder="Select diet" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="veg">Vegetarian</SelectItem>
                          <SelectItem value="non-veg">Non-Veg</SelectItem>
                          <SelectItem value="egg">Eggetarian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
                <FormField
                  control={form.control}
                  name="primaryGoal"
                  render={({ field }) => (
                    <div>
                      <label className="section-label mb-2 block">Primary Goal</label>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger className="input-field h-auto">
                          <SelectValue placeholder="Select goal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fat_loss">Fat Loss</SelectItem>
                          <SelectItem value="recomposition">Recomposition</SelectItem>
                          <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
              </div>
            </section>

            <section className="animate-slide-up space-y-4">
              <div className="wellness-card stagger-4 flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className="metric-card flex h-12 w-12 items-center justify-center p-0">
                    <User className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <div className="section-label mb-1">Identity</div>
                    <p style={{ color: "var(--text-secondary)" }}>Editable personal info</p>
                  </div>
                </div>
                <button className="btn-ghost">Edit</button>
              </div>
              <div className="wellness-card stagger-5 flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className="metric-card flex h-12 w-12 items-center justify-center p-0">
                    <Utensils className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <div className="section-label mb-1">Preferences</div>
                    <p style={{ color: "var(--text-secondary)" }}>Diet and goals</p>
                  </div>
                </div>
                <Target className="h-5 w-5 text-brand" />
              </div>
              <button type="button" onClick={() => logout()} className="wellness-card w-full p-5 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LogOut className="h-5 w-5 text-brand" />
                    <span style={{ color: "var(--text-primary)" }}>Log Out</span>
                  </div>
                  <ChevronRight className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                </div>
              </button>
            </section>

            <div className="animate-slide-up flex gap-3">
              <button type="button" className="btn-ghost flex-1">Edit</button>
              <button type="submit" className="btn-primary flex-1" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </button>
            </div>
          </form>
        </Form>
      </PageLayout>
    </div>
  );
}
