import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreateProfile } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, User, Target, Zap, Utensils, Scale, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, title: "Identity", subtitle: "Define your baseline.", fields: ["displayName", "age", "gender"], icon: User },
  { id: 2, title: "Body Stats", subtitle: "Biometric calibration.", fields: ["height", "currentWeight"], icon: Scale },
  { id: 3, title: "Weight Goal", subtitle: "Set your vector.", fields: ["targetWeight", "dailyMealCount"], icon: Target },
  { id: 4, title: "Lifestyle", subtitle: "Energy expenditure.", fields: ["activityLevel", "timeAvailability", "gymAccess"], icon: Zap },
  { id: 5, title: "Kitchen", subtitle: "Fuel synchronization.", fields: ["dietaryPreferences", "cookingAccess"], icon: Utensils },
];

const formSchema = z.object({
  displayName: z.string().min(2, "Name is too short"),
  age: z.coerce.number().min(8).max(100),
  gender: z.string().min(1),
  height: z.coerce.number().min(100).max(300),
  currentWeight: z.coerce.number().min(30).max(300),
  targetWeight: z.coerce.number().min(30),
  dailyMealCount: z.coerce.number().min(3).max(5).default(3),
  activityLevel: z.string().min(1),
  dietaryPreferences: z.string().min(1),
  cookingAccess: z.string().min(1),
  timeAvailability: z.coerce.number().min(15),
  gymAccess: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, setLocation] = useLocation();
  const { mutate: createProfile, isPending } = useCreateProfile();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "", age: 25, gender: "", height: 170, currentWeight: 70,
      targetWeight: 65, activityLevel: "", dietaryPreferences: "",
      cookingAccess: "", timeAvailability: 30, gymAccess: false,
    }
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger } = form;
  const currentStepData = steps[currentStep - 1];

  const handleNext = async () => {
    const fields = currentStepData.fields as (keyof FormData)[];
    if (await trigger(fields)) setCurrentStep(s => Math.min(s + 1, steps.length));
  };

  const onSubmit = (data: FormData) => {
    createProfile(data, {
      onSuccess: () => setLocation("/dashboard"),
    });
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col items-center justify-center p-6 overflow-hidden selection:bg-primary/20">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-blue/5 blur-[120px]" />
      </div>

      <div className="max-w-md w-full relative z-10 space-y-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Biosync Initializing</p>
            <span className="text-[10px] font-black opacity-20 uppercase tracking-widest">{currentStep} / {steps.length}</span>
          </div>

          <div className="flex gap-5 items-center">
            <div className="w-14 h-14 rounded-2xl bg-white/60 backdrop-blur-xl border border-slate-100 flex items-center justify-center text-primary shadow-xl">
              <currentStepData.icon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase">{currentStepData.title}</h1>
              <p className="text-xs text-muted-foreground font-medium opacity-60 uppercase tracking-widest">{currentStepData.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="wellness-card p-10 bg-white/60 backdrop-blur-2xl border-white/40 shadow-2xl min-h-[440px] flex flex-col">
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 flex flex-col justify-center gap-8"
              >
                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <Label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] px-1">Display Alias</Label>
                      <Input
                        className="h-16 rounded-[24px] border border-slate-200 bg-slate-50 px-6 text-xl font-black tracking-tight shadow-inner focus-visible:ring-primary/20 transition-all placeholder:opacity-40"
                        placeholder="Required"
                        {...register("displayName")}
                        autoFocus
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] px-1">Age</Label>
                        <Input type="number" className="h-16 rounded-[24px] border border-slate-200 bg-slate-50 px-6 text-xl font-black shadow-inner" {...register("age")} />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] px-1">Gender</Label>
                        <div className="grid grid-cols-2 gap-2 h-16">
                          {['male', 'female'].map(g => (
                            <button
                              key={g}
                              type="button"
                              className={cn("rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all", watch("gender") === g ? "brand-gradient text-white border-none" : "bg-slate-50 border-slate-200 text-muted-foreground/60")}
                              onClick={() => setValue("gender", g)}
                            >
                              {g[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between px-1">
                        <Label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Height</Label>
                        <span className="text-xl font-black text-primary tracking-tighter">{watch("height")} <span className="text-[10px] opacity-20 uppercase">cm</span></span>
                      </div>
                      <input type="range" min="120" max="220" className="w-full accent-primary h-1 bg-slate-200 rounded-full" value={watch("height")} onChange={(e) => setValue("height", parseInt(e.target.value))} />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between px-1">
                        <Label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Mass</Label>
                        <span className="text-xl font-black text-primary tracking-tighter">{watch("currentWeight")} <span className="text-[10px] opacity-20 uppercase">kg</span></span>
                      </div>
                      <input type="range" min="40" max="150" className="w-full accent-primary h-1 bg-slate-200 rounded-full" value={watch("currentWeight")} onChange={(e) => setValue("currentWeight", parseInt(e.target.value))} />
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between px-1">
                        <Label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">Objective</Label>
                        <span className="text-xl font-black text-primary tracking-tighter">{watch("targetWeight")} <span className="text-[10px] opacity-20 uppercase">kg</span></span>
                      </div>
                      <input type="range" min="40" max="150" className="w-full accent-primary h-1 bg-slate-200 rounded-full" value={watch("targetWeight")} onChange={(e) => setValue("targetWeight", parseInt(e.target.value))} />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] text-center block">Daily Cycles</Label>
                      <div className="flex gap-3">
                        {[3, 4, 5].map(c => (
                          <button key={c} type="button" className={cn("flex-1 h-16 rounded-2xl font-black text-xl border-2 transition-all", watch("dailyMealCount") === c ? "brand-gradient text-white border-none" : "bg-slate-50 border-slate-200 text-muted-foreground/60")} onClick={() => setValue("dailyMealCount", c)}>{c}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] px-1">Metabolic Baseline</Label>
                      <Select onValueChange={(v) => setValue("activityLevel", v)} defaultValue={watch("activityLevel")}>
                        <SelectTrigger className="h-16 rounded-[24px] border border-slate-200 bg-slate-50 px-6 font-black text-[14px] uppercase tracking-widest shadow-inner focus:ring-primary/20">
                          <SelectValue placeholder="Protocol" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[24px] bg-white/95 backdrop-blur-xl border-slate-100 font-black uppercase text-[10px]">
                          <SelectItem value="sedentary">Low Flux</SelectItem>
                          <SelectItem value="moderate">Moderate Flux</SelectItem>
                          <SelectItem value="active">High Flux</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className={cn("flex items-center gap-4 h-16 px-6 rounded-[24px] border-2 transition-all cursor-pointer", watch("gymAccess") ? "brand-gradient text-white border-none" : "bg-slate-50 border-slate-200 text-muted-foreground/60")} onClick={() => setValue("gymAccess", !watch("gymAccess"))}>
                      <Zap className="w-5 h-5" />
                      <span className="font-black text-[11px] uppercase tracking-widest">Gym Access Available</span>
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] text-center block" >Biochemical Source</Label>
                      <div className="flex gap-2">
                        {['veg', 'non-veg', 'egg'].map(opt => (
                          <button key={opt} type="button" className={cn("flex-1 h-20 rounded-[24px] flex flex-col items-center justify-center font-black text-[9px] uppercase tracking-widest border-2 transition-all gap-2", watch("dietaryPreferences") === opt ? "brand-gradient text-white border-none" : "bg-white/5 border-white/5 text-muted-foreground/40")} onClick={() => setValue("dietaryPreferences", opt)}>
                            <span className="text-xl">{opt === 'veg' ? '🌿' : opt === 'non-veg' ? '🍖' : '🥚'}</span>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] text-center block">Synthesis Hub</Label>
                      <Select onValueChange={(v) => setValue("cookingAccess", v)} defaultValue={watch("cookingAccess")}>
                        <SelectTrigger className="h-16 rounded-[24px] border-none bg-white/5 px-6 font-black text-[14px] uppercase tracking-widest shadow-inner">
                          <SelectValue placeholder="Access" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[24px] bg-card/90 backdrop-blur-xl border-white/5 font-black uppercase text-[10px]">
                          <SelectItem value="full">High Capacity (Kitchen)</SelectItem>
                          <SelectItem value="basic">Low Capacity (Minimal)</SelectItem>
                          <SelectItem value="none">Restricted (None)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex gap-3 pt-10">
              <button type="button" onClick={() => setCurrentStep(s => Math.max(s - 1, 1))} disabled={currentStep === 1} className="h-14 w-14 rounded-2xl flex items-center justify-center bg-white/5 text-white/20 disabled:opacity-0 transition-all hover:text-white"><ChevronLeft className="w-6 h-6" /></button>
              {currentStep < steps.length ? (
                <button type="button" onClick={handleNext} className="flex-1 h-14 rounded-2xl brand-gradient text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-brand-blue/20 active:scale-95 transition-all">Next Phase <ChevronRight className="w-4 h-4 ml-2 inline-block" /></button>
              ) : (
                <button type="submit" disabled={isPending} className="flex-1 h-14 rounded-2xl brand-gradient text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-brand-blue/30 active:scale-95 transition-all">{isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <><Sparkles className="w-4 h-4 mr-2 inline-block" /> Synthesize Strategy</>}</button>
              )}
            </div>
          </form>
        </div>

        <p className="text-center text-[8px] font-black text-muted-foreground/10 uppercase tracking-[0.5em] pt-4">Neural Architecture by AARA Intelligence</p>
      </div>
    </div>
  );
}
