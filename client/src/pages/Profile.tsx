import { useState } from "react";
import { useUserProfile, useUpdateProfile } from "@/hooks/use-user";
import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserProfileSchema } from "@shared/schema";
import {
  Loader2, User, Target, Activity, Moon, Zap,
  Settings, Shield, LogOut, Bell, Globe, Sun,
  Smartphone, ChevronRight, HeartPulse
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Profile() {
  const { data: profile, isLoading } = useUserProfile();
  const { logout } = useAuth();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertUserProfileSchema.omit({ userId: true }).partial()),
    defaultValues: profile || {
      displayName: "",
      age: 30,
      gender: "male",
      height: 175,
      currentWeight: 80,
      targetWeight: 75,
      activityLevel: "moderate",
      dietaryPreferences: "non-veg",
      sleepDuration: 8,
      stressLevel: "moderate",
      primaryGoal: "fat_loss",
      weeklyGoalPace: "balanced",
      coachingTone: "supportive",
      reminderFrequency: "normal",
      units: "kg",
      theme: "system"
    },
    values: profile || undefined,
  });

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const onSubmit = (data: any) => {
    updateProfile(data, {
      onSuccess: async () => {
        toast({ title: "Profile synchronization successful", description: "Your wellness plan has been refined." });
        await queryClient.invalidateQueries({ queryKey: [api.user.getProfile.path] });

        // Refresh plans if critical data changed
        const todayStr = new Date().toISOString().split('T')[0];
        await queryClient.invalidateQueries({ queryKey: [api.plans.getDaily.path] });
        await queryClient.invalidateQueries({ queryKey: [api.plans.getDaily.path, todayStr] });
      }
    });
  };

  const getUserInitials = () => {
    if (!profile.displayName) return "U";
    return profile.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-2">
      <h3 className="px-4 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      <Card className="mx-4 overflow-hidden shadow-sm border-0 bg-white dark:bg-[#1C1C1E] rounded-2xl">
        <div className="divide-y divide-black/5 dark:divide-white/5">
          {children}
        </div>
      </Card>
    </div>
  );

  const Row = ({ label, children, icon: Icon, value }: { label: string; children?: React.ReactNode; icon?: any; value?: string }) => (
    <div className="flex items-center justify-between p-4 min-h-[56px]">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-secondary/50 dark:bg-white/5 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        )}
        <span className="text-[17px] font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-[17px] text-muted-foreground">{value}</span>}
        {children}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F2F2F7] dark:bg-black font-sans scroll-smooth">
      <Navigation />

      <main className="flex-1 pb-32 md:pb-8 overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl mx-auto space-y-8">
            {/* Header / Avatar */}
            <header className="px-6 pt-12 text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-white dark:border-[#1C1C1E] shadow-xl flex items-center justify-center mx-auto overflow-hidden">
                  <span className="text-3xl font-bold text-primary">{getUserInitials()}</span>
                </div>
                <button type="button" className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-[#1C1C1E] rounded-full shadow-lg border border-black/5 flex items-center justify-center text-primary active:scale-95 transition-transform">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{profile.displayName || "User"}</h1>
                <p className="text-[15px] text-muted-foreground capitalize">
                  {profile.primaryGoal?.replace("_", " ") || "Health Enthusiast"}
                </p>
              </div>
            </header>

            {/* Basic Information */}
            <Section title="Basic Information">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <Row label="Name">
                    <Input {...field} value={field.value || ""} className="w-40 border-0 bg-transparent text-right p-0 focus-visible:ring-0 text-muted-foreground" placeholder="Your Name" />
                  </Row>
                )}
              />
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <Row label="Age">
                    <Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="w-20 border-0 bg-transparent text-right p-0 focus-visible:ring-0 text-muted-foreground" />
                  </Row>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <Row label="Gender">
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className="w-24 border-0 bg-transparent p-0 justify-end focus:ring-0 text-muted-foreground h-auto shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-black/5">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </Row>
                )}
              />
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <Row label="Height">
                    <div className="flex items-center gap-1">
                      <Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="w-16 border-0 bg-transparent text-right p-0 focus-visible:ring-0 text-muted-foreground" />
                      <span className="text-muted-foreground/50 text-sm">cm</span>
                    </div>
                  </Row>
                )}
              />
              <FormField
                control={form.control}
                name="currentWeight"
                render={({ field }) => (
                  <Row label="Weight">
                    <div className="flex items-center gap-1">
                      <Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="w-16 border-0 bg-transparent text-right p-0 focus-visible:ring-0 text-muted-foreground" />
                      <span className="text-muted-foreground/50 text-sm">{profile.units || "kg"}</span>
                    </div>
                  </Row>
                )}
              />
            </Section>

            {/* Health & Lifestyle */}
            <Section title="Health & Lifestyle">
              <FormField
                control={form.control}
                name="activityLevel"
                render={({ field }) => (
                  <Row label="Activity" icon={Activity}>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className="w-32 border-0 bg-transparent p-0 justify-end focus:ring-0 text-muted-foreground h-auto shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="sedentary">Low</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="active">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </Row>
                )}
              />
              <FormField
                control={form.control}
                name="sleepDuration"
                render={({ field }) => (
                  <Row label="Sleep" icon={Moon}>
                    <div className="flex items-center gap-1">
                      <Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="w-12 border-0 bg-transparent text-right p-0 focus-visible:ring-0 text-muted-foreground" />
                      <span className="text-muted-foreground/50 text-sm">hrs</span>
                    </div>
                  </Row>
                )}
              />
              <FormField
                control={form.control}
                name="stressLevel"
                render={({ field }) => (
                  <Row label="Stress" icon={Zap}>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className="w-32 border-0 bg-transparent p-0 justify-end focus:ring-0 text-muted-foreground h-auto shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="moderate">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </Row>
                )}
              />
              <FormField
                control={form.control}
                name="dietaryPreferences"
                render={({ field }) => (
                  <Row label="Diet" icon={HeartPulse}>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className="w-32 border-0 bg-transparent p-0 justify-end focus:ring-0 text-muted-foreground h-auto shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="veg">Vegetarian</SelectItem>
                        <SelectItem value="non-veg">Non-Veg</SelectItem>
                        <SelectItem value="egg">Eggetarian</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </Row>
                )}
              />
            </Section>

            {/* Goals */}
            <Section title="Goals">
              <FormField
                control={form.control}
                name="primaryGoal"
                render={({ field }) => (
                  <Row label="Primary Goal" icon={Target}>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className="w-40 border-0 bg-transparent p-0 justify-end focus:ring-0 text-muted-foreground h-auto shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="fat_loss">Fat Loss</SelectItem>
                        <SelectItem value="recomposition">Recomposition</SelectItem>
                        <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                      </SelectContent>
                    </Select>
                  </Row>
                )}
              />
              <FormField
                control={form.control}
                name="targetWeight"
                render={({ field }) => (
                  <Row label="Target Weight">
                    <div className="flex items-center gap-1">
                      <Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="w-16 border-0 bg-transparent text-right p-0 focus-visible:ring-0 text-muted-foreground" />
                      <span className="text-muted-foreground/50 text-sm">{profile.units || "kg"}</span>
                    </div>
                  </Row>
                )}
              />
              <FormField
                control={form.control}
                name="weeklyGoalPace"
                render={({ field }) => (
                  <Row label="Goal Pace">
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className="w-32 border-0 bg-transparent p-0 justify-end focus:ring-0 text-muted-foreground h-auto shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="slow">Slow</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="aggressive">Aggressive</SelectItem>
                      </SelectContent>
                    </Select>
                  </Row>
                )}
              />
            </Section>

            {/* Coach Preferences */}
            <Section title="Coach Preferences">
              <FormField
                control={form.control}
                name="coachingTone"
                render={({ field }) => (
                  <Row label="Coaching Tone">
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className="w-32 border-0 bg-transparent p-0 justify-end focus:ring-0 text-muted-foreground h-auto shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="supportive">Supportive</SelectItem>
                        <SelectItem value="direct">Direct</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                      </SelectContent>
                    </Select>
                  </Row>
                )}
              />
              <FormField
                control={form.control}
                name="reminderFrequency"
                render={({ field }) => (
                  <Row label="Reminders">
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className="w-32 border-0 bg-transparent p-0 justify-end focus:ring-0 text-muted-foreground h-auto shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </Row>
                )}
              />
              <Row label="Notifications" icon={Bell}>
                <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
              </Row>
            </Section>

            {/* App & Account */}
            <Section title="App & Account">
              <FormField
                control={form.control}
                name="units"
                render={({ field }) => (
                  <Row label="Units" icon={Globe}>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className="w-20 border-0 bg-transparent p-0 justify-end focus:ring-0 text-muted-foreground h-auto shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="kg">Metric (kg)</SelectItem>
                        <SelectItem value="lbs">US (lbs)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Row>
                )}
              />
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <Row label="Theme" icon={Sun}>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className="w-32 border-0 bg-transparent p-0 justify-end focus:ring-0 text-muted-foreground h-auto shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </Row>
                )}
              />
              <Row label="Privacy & Data" icon={Shield}>
                <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
              </Row>
              <button
                type="button"
                onClick={() => logout()}
                className="w-full text-left"
              >
                <Row label="Log Out" icon={LogOut}>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
                </Row>
              </button>
            </Section>

            {/* Save Button - Floating Style for Mobile */}
            <div className="px-4 pt-4 pb-12">
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 text-[17px] font-semibold shadow-lg shadow-primary/20"
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}

