import { useUserProfile, useUpdateProfile } from "@/hooks/use-user";
import { useAuth } from "@/hooks/use-auth";
import { PageLayout } from "@/components/PageLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserProfileSchema } from "@shared/schema";
import {
  Loader2, User, Target, Activity, Moon, Zap,
  LogOut, Bell, Globe, Sun,
  Smartphone, ChevronRight, HeartPulse, Edit2, Shield, Utensils
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { cn } from "@/lib/utils";

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
      <PageLayout maxWidth="md">
        <div className="flex flex-col items-center justify-center py-20 text-foreground">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </PageLayout>
    );
  }

  const onSubmit = (data: any) => {
    updateProfile(data, {
      onSuccess: async () => {
        toast({ title: "Profile Synced", description: "Your wellness plan has been refined." });
        await queryClient.invalidateQueries({ queryKey: [api.user.getProfile.path] });
      }
    });
  };

  const getUserInitials = () => {
    if (!profile.displayName) return "U";
    return profile.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-4 mb-8">
      <h3 className="px-1 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">{title}</h3>
      <div className="wellness-card divide-y divide-white/5 overflow-hidden">
        {children}
      </div>
    </div>
  );

  const SettingsRow = ({ label, children, icon: Icon, value }: { label: string; children?: React.ReactNode; icon?: any; value?: string }) => (
    <div className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-primary/60">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <span className="text-[14px] font-black tracking-tight text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-[14px] font-bold text-muted-foreground/40">{value}</span>}
        {children}
      </div>
    </div>
  );

  return (
    <PageLayout
      maxWidth="md"
      header={
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full brand-gradient p-1 shadow-2xl">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                <span className="text-3xl font-black text-primary tracking-tighter">{getUserInitials()}</span>
              </div>
            </div>
            <button type="button" className="absolute bottom-0 right-0 w-8 h-8 brand-gradient rounded-full shadow-lg border-4 border-card flex items-center justify-center text-white active:scale-90 transition-all">
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-foreground">{profile.displayName || "Guest"}</h1>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-2 px-4 py-1.5 bg-primary/10 rounded-full inline-block">
              {profile.primaryGoal?.replace("_", " ") || "Health Enthusiast"}
            </p>
          </div>
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0 pb-20">
          <SettingsSection title="Personal Details">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <SettingsRow label="Name" icon={User}>
                  <Input {...field} value={field.value || ""} className="w-40 border-none bg-transparent text-right p-0 h-auto focus-visible:ring-0 text-[14px] font-bold text-muted-foreground placeholder:opacity-20" placeholder="Required" />
                </SettingsRow>
              )}
            />
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <SettingsRow label="Age">
                  <Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="w-16 border-none bg-transparent text-right p-0 h-auto focus-visible:ring-0 text-[14px] font-bold text-muted-foreground" />
                </SettingsRow>
              )}
            />
          </SettingsSection>

          <SettingsSection title="Body Metrics">
            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <SettingsRow label="Height">
                  <div className="flex items-center gap-1">
                    <Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="w-12 border-none bg-transparent text-right p-0 h-auto focus-visible:ring-0 text-[14px] font-bold text-muted-foreground" />
                    <span className="text-[10px] font-black opacity-20 uppercase">cm</span>
                  </div>
                </SettingsRow>
              )}
            />
            <FormField
              control={form.control}
              name="currentWeight"
              render={({ field }) => (
                <SettingsRow label="Weight">
                  <div className="flex items-center gap-1">
                    <Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="w-12 border-none bg-transparent text-right p-0 h-auto focus-visible:ring-0 text-[14px] font-bold text-muted-foreground" />
                    <span className="text-[10px] font-black opacity-20 uppercase">{profile.units}</span>
                  </div>
                </SettingsRow>
              )}
            />
          </SettingsSection>

          <SettingsSection title="Goals & Preferences">
            <FormField
              control={form.control}
              name="dietaryPreferences"
              render={({ field }) => (
                <SettingsRow label="Diet Type" icon={Utensils}>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger className="w-32 border-none bg-transparent p-0 justify-end focus:ring-0 text-[14px] font-bold text-muted-foreground h-auto shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl bg-white border-slate-100 shadow-xl">
                      <SelectItem value="veg">Vegetarian</SelectItem>
                      <SelectItem value="non-veg">Non-Veg</SelectItem>
                      <SelectItem value="egg">Eggetarian</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingsRow>
              )}
            />
            <FormField
              control={form.control}
              name="primaryGoal"
              render={({ field }) => (
                <SettingsRow label="Main Goal" icon={Target}>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger className="w-32 border-none bg-transparent p-0 justify-end focus:ring-0 text-[14px] font-bold text-muted-foreground h-auto shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl bg-white border-slate-100 shadow-xl">
                      <SelectItem value="fat_loss">Fat Loss</SelectItem>
                      <SelectItem value="recomposition">Recomposition</SelectItem>
                      <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingsRow>
              )}
            />
          </SettingsSection>

          <SettingsSection title="Account">
            <button type="button" onClick={() => logout()} className="w-full">
              <SettingsRow label="Log Out" icon={LogOut}>
                <ChevronRight className="w-4 h-4 opacity-20" />
              </SettingsRow>
            </button>
          </SettingsSection>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full h-16 rounded-full brand-gradient text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-brand-blue/20 active:scale-95 transition-all"
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </Form>
    </PageLayout>
  );
}
