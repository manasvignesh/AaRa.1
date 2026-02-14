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
  Smartphone, ChevronRight, HeartPulse, Cpu, Fingerprint, RefreshCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
      <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center font-mono">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] -z-10 rounded-full opacity-20" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-16 h-16 rounded-full border-2 border-primary border-t-transparent"
        />
        <p className="mt-4 text-xs tracking-[0.3em] text-primary animate-pulse">RECAPTURING_IDENT_STREAM</p>
      </div>
    );
  }

  const onSubmit = (data: any) => {
    updateProfile(data, {
      onSuccess: async () => {
        toast({
          title: "NEURAL LINK CALIBRATED",
          description: "Biometric profiles have been synchronized with the core.",
          className: "glass-card border-primary/30 text-white"
        });
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

  const Section = ({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon?: any }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 mb-10"
    >
      <div className="flex items-center gap-3 px-6">
        {Icon && <Icon className="w-4 h-4 text-primary opacity-60" />}
        <h3 className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.3em]">{title}</h3>
      </div>
      <div className="glass-card mx-4 rounded-[2rem] border-white/5 overflow-hidden">
        <div className="divide-y divide-white/[0.03]">
          {children}
        </div>
      </div>
    </motion.div>
  );

  const Row = ({ label, children, icon: Icon, value }: { label: string; children?: React.ReactNode; icon?: any; value?: string }) => (
    <div className="flex items-center justify-between p-6 min-h-[72px] hover:bg-white/[0.02] transition-colors group">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:border-primary/30 transition-all">
            <Icon className="w-5 h-5 text-white/40 group-hover:text-primary transition-colors" />
          </div>
        )}
        <span className="text-sm font-display font-medium text-white/60 group-hover:text-white transition-colors">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {value && <span className="text-sm font-mono text-white/40">{value}</span>}
        {children}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground scroll-smooth">
      <Navigation />

      <main className="flex-1 pb-32 md:pb-8 overflow-y-auto px-4 md:px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-12">
            {/* Immersive Profile Header */}
            <header className="relative pt-16 pb-8 flex flex-col items-center gap-8">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 blur-[100px] -z-10 rounded-full" />

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-32 h-32 rounded-full glass-card border-4 border-white/10 flex items-center justify-center mx-auto overflow-hidden relative z-10">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent pointer-events-none" />
                  <span className="text-4xl font-display font-bold text-white tracking-tighter drop-shadow-glow">{getUserInitials()}</span>
                </div>

                <motion.button
                  whileHover={{ rotate: 180 }}
                  type="button"
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-black rounded-xl shadow-lg flex items-center justify-center z-20 outline-none border-none"
                >
                  <RefreshCcw className="w-5 h-5" />
                </motion.button>
              </motion.div>

              <div className="text-center space-y-2">
                <h1 className="text-4xl font-display font-bold text-white tracking-tight uppercase">{profile.displayName || "ANONYMOUS_UNIT"}</h1>
                <div className="flex items-center justify-center gap-2">
                  <Fingerprint className="w-3 h-3 text-primary opacity-60" />
                  <p className="text-[10px] font-mono font-bold text-primary/60 uppercase tracking-[0.2em]">
                    SECURE_NODE // ID_{profile.id?.toString().slice(-6) || "NULL"}
                  </p>
                </div>
              </div>
            </header>

            {/* Core Biometrics */}
            <Section title="Structural Calibrations" icon={User}>
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }: { field: any }) => (
                  <Row label="System Alias">
                    <Input {...field} value={field.value || ""} className="w-48 border-none bg-white/[0.03] text-right font-display font-bold text-white p-3 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/40" placeholder="IDENTIFIER" />
                  </Row>
                )}
              />
              <FormField
                control={form.control}
                name="age"
                render={({ field }: { field: any }) => (
                  <Row label="Temporal Cycles">
                    <div className="flex items-center gap-3 bg-white/[0.03] px-4 py-2 rounded-xl">
                      <Input type="number" {...field} value={field.value ?? ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value) || 0)} className="w-12 border-none bg-transparent p-0 font-mono text-center text-white font-bold h-auto focus-visible:ring-0" />
                      <span className="text-[10px] font-mono text-white/20 uppercase">yrs</span>
                    </div>
                  </Row>
                )}
              />
              <FormField
                control={form.control}
                name="height"
                render={({ field }: { field: any }) => (
                  <Row label="Vertical Scale">
                    <div className="flex items-center gap-3 bg-white/[0.03] px-4 py-2 rounded-xl">
                      <Input type="number" {...field} value={field.value ?? ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value) || 0)} className="w-12 border-none bg-transparent p-0 font-mono text-center text-white font-bold h-auto focus-visible:ring-0" />
                      <span className="text-[10px] font-mono text-white/20 uppercase">cm</span>
                    </div>
                  </Row>
                )}
              />
              <FormField
                control={form.control}
                name="currentWeight"
                render={({ field }: { field: any }) => (
                  <Row label="Total Mass">
                    <div className="flex items-center gap-3 bg-white/[0.03] px-4 py-2 rounded-xl border border-primary/10">
                      <Input type="number" {...field} value={field.value ?? ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value) || 0)} className="w-12 border-none bg-transparent p-0 font-mono text-center text-primary font-bold h-auto focus-visible:ring-0" />
                      <span className="text-[10px] font-mono text-primary/40 uppercase">{profile.units || "kg"}</span>
                    </div>
                  </Row>
                )}
              />
            </Section>

            {/* Neural Preferences */}
            <Section title="Adaptive Parameters" icon={Cpu}>
              <FormField
                control={form.control}
                name="activityLevel"
                render={({ field }) => (
                  <Row label="Kinetic Intensity" icon={Activity}>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className="w-32 border-none bg-white/[0.03] rounded-xl font-display font-medium text-white/80 focus:ring-1 focus:ring-primary/30 h-10 px-4">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-white/10 text-white">
                        <SelectItem value="sedentary">MINIMAL</SelectItem>
                        <SelectItem value="moderate">BALANCED</SelectItem>
                        <SelectItem value="active">OPTIMIZED</SelectItem>
                      </SelectContent>
                    </Select>
                  </Row>
                )}
              />
              <FormField
                control={form.control}
                name="dietaryPreferences"
                render={({ field }) => (
                  <Row label="Nutrient Source" icon={Activity}>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className="w-32 border-none bg-white/[0.03] rounded-xl font-display font-medium text-white/80 focus:ring-1 focus:ring-primary/30 h-10 px-4">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-white/10 text-white">
                        <SelectItem value="veg">VEG</SelectItem>
                        <SelectItem value="non-veg">NON-VEG</SelectItem>
                        <SelectItem value="egg">EGG</SelectItem>
                      </SelectContent>
                    </Select>
                  </Row>
                )}
              />
              <FormField
                control={form.control}
                name="regionPreference"
                render={({ field }) => (
                  <Row label="Cuisine Region" icon={Globe}>
                    <Select onValueChange={field.onChange} value={field.value || "north_indian"}>
                      <SelectTrigger className="w-40 border-none bg-white/[0.03] rounded-xl font-display font-medium text-white/80 focus:ring-1 focus:ring-primary/30 h-10 px-4">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-white/10 text-white">
                        <SelectItem value="north_indian">NORTH INDIAN</SelectItem>
                        <SelectItem value="south_indian">SOUTH INDIAN</SelectItem>
                      </SelectContent>
                    </Select>
                  </Row>
                )}
              />
              <FormField
                control={form.control}
                name="stressLevel"
                render={({ field }) => (
                  <Row label="Cortisol Drift" icon={Zap}>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className="w-32 border-none bg-white/[0.03] rounded-xl font-display font-medium text-white/80 focus:ring-1 focus:ring-primary/30 h-10 px-4">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-white/10 text-white">
                        <SelectItem value="low">STABLE</SelectItem>
                        <SelectItem value="moderate">NOMINAL</SelectItem>
                        <SelectItem value="high">CRITICAL</SelectItem>
                      </SelectContent>
                    </Select>
                  </Row>
                )}
              />
            </Section>

            {/* Objective Targets */}
            <Section title="Strategic Objectives" icon={Target}>
              <FormField
                control={form.control}
                name="primaryGoal"
                render={({ field }) => (
                  <Row label="Core Primary Target">
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className="w-44 border-none bg-primary/10 text-primary font-display font-bold uppercase tracking-tight rounded-xl h-10 px-4">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-white/10 text-white uppercase font-display">
                        <SelectItem value="fat_loss">Lipid Depletion</SelectItem>
                        <SelectItem value="recomposition">Structural Reform</SelectItem>
                        <SelectItem value="muscle_gain">Mass Accretion</SelectItem>
                      </SelectContent>
                    </Select>
                  </Row>
                )}
              />
              <FormField
                control={form.control}
                name="targetWeight"
                render={({ field }: { field: any }) => (
                  <Row label="Terminal Mass">
                    <div className="flex items-center gap-3 bg-white/[0.03] px-4 py-2 rounded-xl">
                      <Input type="number" {...field} value={field.value ?? ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value) || 0)} className="w-12 border-none bg-transparent p-0 font-mono text-center text-white font-bold h-auto focus-visible:ring-0" />
                      <span className="text-[10px] font-mono text-white/20 uppercase">{profile.units || "kg"}</span>
                    </div>
                  </Row>
                )}
              />
            </Section>

            {/* Account Management */}
            <Section title="System Access" icon={Shield}>
              <Row label="Transmission Frequency" value="STANDBY" />
              <button
                type="button"
                onClick={() => logout()}
                className="w-full text-left outline-none border-none"
              >
                <Row label="De-Authorize Profile" icon={LogOut}>
                  <ChevronRight className="w-5 h-5 text-white/20" />
                </Row>
              </button>
            </Section>

            {/* Persistence Button */}
            <div className="px-4 pb-20 mt-8 relative">
              <div className="absolute inset-0 bg-primary/10 blur-[60px] -z-10 rounded-full h-20 opacity-40" />
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-primary text-black hover:bg-white rounded-3xl h-20 text-xl font-display font-bold uppercase tracking-widest shadow-[0_0_40px_rgba(189,255,100,0.2)] transition-all border-none"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>SYNCHRONIZING</span>
                    </div>
                  ) : (
                    "COLLECT BIOMETRIC DATA"
                  )}
                </Button>
              </motion.div>
              <p className="text-center text-[9px] font-mono text-muted-foreground mt-4 uppercase tracking-[0.2em] opacity-40">All_DATA_ENCRYPTED_VIA_AARA_SECURE_CORES</p>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}

