import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreateProfile } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, ArrowLeft, Heart, Target, Zap, Clock, Utensils, Ruler, Scale, User, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import { insertUserProfileSchema } from "@shared/schema";
import { cn } from "@/lib/utils";

// Wizard Steps Data
const steps = [
  { id: 1, title: "Identity", subtitle: "Let's personalize your experience.", fields: ["displayName", "age", "gender"], icon: User },
  { id: 2, title: "Body Stats", subtitle: "Physics is the foundation of progress.", fields: ["height", "currentWeight"], icon: Scale },
  { id: 3, title: "Weight Goal", subtitle: "Where are we heading?", fields: ["targetWeight", "dailyMealCount"], icon: Target },
  { id: 4, title: "Lifestyle", subtitle: "How does your day look?", fields: ["activityLevel", "timeAvailability", "gymAccess"], icon: Zap },
  { id: 5, title: "Kitchen", subtitle: "Fueling the change.", fields: ["dietaryPreferences", "cookingAccess"], icon: Utensils },
];

// Validation Schema
const formSchema = z.object({
  displayName: z.string().min(2, "Name is too short"),
  age: z.coerce.number().min(8, "Minimum age is 8").max(100),
  gender: z.string().min(1, "Please select your gender"),
  height: z.coerce.number().min(100, "Height in cm required").max(300),
  currentWeight: z.coerce.number().min(30, "Weight in kg required").max(300),
  targetWeight: z.coerce.number().min(30),
  dailyMealCount: z.coerce.number().min(3).max(5).default(3),
  activityLevel: z.string().min(1, "Required"),
  dietaryPreferences: z.string().min(1, "Required"),
  cookingAccess: z.string().min(1, "Required"),
  timeAvailability: z.coerce.number().min(15, "Can you spare at least 15 mins?"),
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
      displayName: "",
      age: 25,
      gender: "",
      height: 170,
      currentWeight: 70,
      targetWeight: 65,
      activityLevel: "",
      dietaryPreferences: "",
      cookingAccess: "",
      timeAvailability: 30,
      gymAccess: false,
    }
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger } = form;
  const currentStepData = steps[currentStep - 1];

  const handleGenderSelect = (gender: string) => {
    setValue("gender", gender);
    trigger("gender");
  };

  const nextStep = async () => {
    const currentFields = currentStepData.fields as (keyof FormData)[];
    const isValid = await trigger(currentFields);
    if (isValid) setCurrentStep(s => Math.min(s + 1, steps.length));
  };

  const prevStep = () => setCurrentStep(s => Math.max(s - 1, 1));

  const onSubmit = (data: FormData) => {
    createProfile(data, {
      onSuccess: () => setLocation("/dashboard"),
    });
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="max-w-2xl w-full relative z-10 flex flex-col gap-10">
        {/* Progress Header */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2 px-1">
            <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Discovery Phase</p>
            <div className="flex gap-1.5">
              {steps.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "h-1 rounded-full transition-all duration-500",
                    s.id === currentStep ? "w-8 bg-primary" : s.id < currentStep ? "w-4 bg-primary/40" : "w-4 bg-secondary"
                  )}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-6 items-center">
            <div className="w-16 h-16 rounded-[24px] bg-card border border-border/10 shadow-sm flex items-center justify-center text-primary group transition-all">
              <currentStepData.icon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-foreground leading-tight">{currentStepData.title}</h1>
              <p className="text-[17px] text-muted-foreground font-medium leading-tight">{currentStepData.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Wizard Panel */}
        <div className="wellness-card p-10 bg-card/60 backdrop-blur-2xl border-white shadow-2xl relative overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                className="min-h-[340px] flex flex-col justify-center gap-8"
              >
                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 outline-none">How may I address you?</Label>
                      <Input
                        className="h-16 rounded-[24px] border-none bg-secondary/30 px-6 text-xl font-bold shadow-inner focus-visible:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
                        placeholder="Enter your first name"
                        {...register("displayName")}
                        autoFocus
                      />
                      {errors.displayName && <p className="text-xs font-bold text-red-500 px-3">{errors.displayName.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">Age</Label>
                        <Input
                          type="number"
                          className="h-16 rounded-[24px] border-none bg-secondary/30 px-6 text-xl font-bold shadow-inner focus-visible:ring-primary/20"
                          placeholder="25"
                          {...register("age")}
                        />
                        {errors.age && <p className="text-xs font-bold text-red-500 px-3">{errors.age.message}</p>}
                      </div>
                      <div className="space-y-3 flex flex-col">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 mb-0.5">Gender</Label>
                        <div className="grid grid-cols-3 gap-2 flex-1">
                          {['male', 'female', 'other'].map((g) => (
                            <Button
                              key={g}
                              type="button"
                              variant="outline"
                              className={cn(
                                "rounded-[20px] h-full capitalize font-bold text-xs border-2 transition-all",
                                watch("gender") === g ? "bg-primary/5 border-primary text-primary shadow-sm shadow-primary/5" : "bg-transparent border-secondary/10 text-muted-foreground"
                              )}
                              onClick={() => handleGenderSelect(g)}
                            >
                              {g === 'male' ? 'M' : g === 'female' ? 'F' : 'O'}
                            </Button>
                          ))}
                        </div>
                        {errors.gender && <p className="text-xs font-bold text-red-500 px-3 mt-1">{errors.gender.message}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="grid grid-cols-1 gap-10">
                    <div className="space-y-4">
                      <div className="flex justify-between px-2">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Vertical Height</Label>
                        <span className="text-xl font-black text-primary tracking-tighter">{watch("height")} <span className="text-[10px] uppercase opacity-40">cm</span></span>
                      </div>
                      <div className="relative h-16 bg-secondary/20 rounded-[28px] flex items-center px-10 border border-border/5">
                        <input
                          type="range"
                          min="120"
                          max="240"
                          className="w-full accent-primary h-1 bg-primary/10 rounded-full"
                          value={watch("height")}
                          onChange={(e) => setValue("height", parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between px-2">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Current Weight</Label>
                        <span className="text-xl font-black text-primary tracking-tighter">{watch("currentWeight")} <span className="text-[10px] uppercase opacity-40">kg</span></span>
                      </div>
                      <div className="relative h-16 bg-secondary/20 rounded-[28px] flex items-center px-10 border border-border/5">
                        <input
                          type="range"
                          min="40"
                          max="180"
                          className="w-full accent-primary h-1 bg-primary/10 rounded-full"
                          value={watch("currentWeight")}
                          onChange={(e) => setValue("currentWeight", parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <div className="flex justify-between px-2">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Target Weight</Label>
                        <span className="text-xl font-black text-primary tracking-tighter">{watch("targetWeight")} <span className="text-[10px] uppercase opacity-40">kg</span></span>
                      </div>
                      <div className="relative h-16 bg-secondary/20 rounded-[28px] flex items-center px-10 border border-border/5">
                        <input
                          type="range"
                          min="40"
                          max="180"
                          className="w-full accent-primary h-1 bg-primary/10 rounded-full"
                          value={watch("targetWeight")}
                          onChange={(e) => setValue("targetWeight", parseInt(e.target.value))}
                        />
                      </div>
                      <p className="text-[11px] font-bold text-muted-foreground/40 text-center uppercase tracking-widest pl-2">
                        Sustainability is priority — approx 0.5kg loss per week.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 block text-center">Meals per day</Label>
                      <div className="flex gap-3">
                        {[3, 4, 5].map((count) => (
                          <Button
                            key={count}
                            type="button"
                            className={cn(
                              "flex-1 h-14 rounded-[20px] font-black text-lg border-2 transition-all",
                              watch("dailyMealCount") === count ? "bg-primary/5 border-primary text-primary" : "bg-transparent border-secondary/10 text-muted-foreground"
                            )}
                            onClick={() => setValue("dailyMealCount", count)}
                          >
                            {count}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">Current Activity Profile</Label>
                      <Select onValueChange={(val) => setValue("activityLevel", val)} defaultValue={watch("activityLevel")}>
                        <SelectTrigger className="h-16 rounded-[24px] border-none bg-secondary/20 px-6 font-bold text-[16px] shadow-inner focus:ring-primary/20">
                          <SelectValue placeholder="Select Lifestyle" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[24px] p-2">
                          <SelectItem value="sedentary">Sedentary (Low movement)</SelectItem>
                          <SelectItem value="moderate">Moderate (1-3 sessions/week)</SelectItem>
                          <SelectItem value="active">Active (4+ sessions/week)</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.activityLevel && <p className="text-xs font-bold text-red-500 px-3">{errors.activityLevel.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">Daily workout window (min)</Label>
                        <Input
                          type="number"
                          className="h-16 rounded-[24px] border-none bg-secondary/20 px-6 text-xl font-bold shadow-inner focus-visible:ring-primary/20"
                          placeholder="45"
                          {...register("timeAvailability")}
                        />
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-4 h-16 px-6 rounded-[24px] border-2 transition-all cursor-pointer",
                          watch("gymAccess") ? "bg-primary/5 border-primary" : "bg-card border-secondary/10"
                        )}
                        onClick={() => setValue("gymAccess", !watch("gymAccess"))}
                      >
                        <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all", watch("gymAccess") ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                          {watch("gymAccess") && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-black text-sm tracking-tight">I have access to a Gym</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center block" >Dietary Preference</Label>
                      <div className="flex gap-3">
                        {['veg', 'non-veg', 'egg'].map((opt) => (
                          <Button
                            key={opt}
                            type="button"
                            className={cn(
                              "flex-1 h-20 rounded-[24px] flex flex-col font-black text-[13px] uppercase tracking-wider border-2 transition-all gap-1",
                              watch("dietaryPreferences") === opt ? "bg-primary/5 border-primary text-primary" : "bg-transparent border-secondary/10 text-muted-foreground"
                            )}
                            onClick={() => setValue("dietaryPreferences", opt)}
                          >
                            <span className="text-xl">
                              {opt === 'veg' ? '🌿' : opt === 'non-veg' ? '🍖' : '🥚'}
                            </span>
                            {opt.replace('-', ' ')}
                          </Button>
                        ))}
                      </div>
                      {errors.dietaryPreferences && <p className="text-xs font-bold text-red-500 text-center">{errors.dietaryPreferences.message}</p>}
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center block">Kitchen Access</Label>
                      <Select onValueChange={(val) => setValue("cookingAccess", val)} defaultValue={watch("cookingAccess")}>
                        <SelectTrigger className="h-16 rounded-[24px] border-none bg-secondary/20 px-6 font-bold text-[16px] shadow-inner focus:ring-primary/20">
                          <SelectValue placeholder="Select Access" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[24px] p-2">
                          <SelectItem value="full">Master Lab (Stove, Oven, Fridge)</SelectItem>
                          <SelectItem value="basic">Minimal (Kettle, Microwave)</SelectItem>
                          <SelectItem value="none">Restricted (Hostel/Dorm)</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.cookingAccess && <p className="text-xs font-bold text-red-500 text-center">{errors.cookingAccess.message}</p>}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="h-16 rounded-[24px] px-8 text-muted-foreground font-black uppercase tracking-widest text-[11px] disabled:opacity-0 transition-all"
              >
                <ChevronLeft className="w-5 h-5 mr-1" /> Prev
              </Button>

              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 h-16 rounded-[24px] bg-foreground text-background font-black text-lg hover:bg-foreground/90 shadow-xl shadow-foreground/5 active:scale-[0.98] transition-all"
                >
                  Next Step <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 h-16 rounded-[24px] brand-gradient text-white font-black text-lg shadow-2xl shadow-brand-blue/30 active:scale-[0.98] transition-all"
                >
                  {isPending ? <><Loader2 className="w-6 h-6 animate-spin mr-3" /> Initializing...</> : <><Sparkles className="w-6 h-6 mr-3" /> Generate My Plan</>}
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Footer Support Message */}
        <p className="text-center text-xs font-bold text-muted-foreground/30 uppercase tracking-[0.2em]">
          Auntie AARA builds your strategy based on these inputs.
        </p>
      </div>
    </div>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
