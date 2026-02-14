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
import { Loader2, ArrowRight, ArrowLeft, Dna, Activity, Zap, Cpu, ShieldCheck, Target, Layers, Check } from "lucide-react";
import { insertUserProfileSchema } from "@shared/schema";
import { cn } from "@/lib/utils";

// Wizard Steps Data
const steps = [
  { id: 1, title: "Neural_Link", subtitle: "Establishing biological identity", icon: Dna, fields: ["displayName", "age", "gender"] },
  { id: 2, title: "Biometric_Scan", subtitle: "Measuring structural mass", icon: Activity, fields: ["height", "currentWeight"] },
  { id: 3, title: "Target_State", subtitle: "Defining morphological goals", icon: Target, fields: ["primaryGoal", "targetWeight", "dailyMealCount"] },
  { id: 4, title: "Kinetic_Log", subtitle: "Calibrating energy expenditure", icon: Zap, fields: ["activityLevel", "timeAvailability", "gymAccess"] },
  { id: 5, title: "Nutrient_Deck", subtitle: "Configuring fuel synthesis", icon: Layers, fields: ["dietaryPreferences", "regionPreference", "cookingAccess"] },
];

// Validation Schema
const formSchema = z.object({
  displayName: z.string().min(2, "Name is too short"),
  age: z.coerce.number().min(8, "Minimum age is 8").max(100),
  gender: z.string().min(1, "Please select your gender"),
  height: z.coerce.number().min(100, "Height in cm required").max(300),
  currentWeight: z.coerce.number().min(30, "Weight in kg required").max(300),
  primaryGoal: z.string().min(1, "Required"),
  targetWeight: z.coerce.number().min(30),
  dailyMealCount: z.coerce.number().min(3).max(5).default(3),
  activityLevel: z.string().min(1, "Required"),
  dietaryPreferences: z.string().min(1, "Required"),
  regionPreference: z.string().min(1, "Required"),
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
      primaryGoal: "maintain",
      targetWeight: 65,
      activityLevel: "",
      dietaryPreferences: "",
      regionPreference: "north_indian",
      cookingAccess: "",
      timeAvailability: 30,
      gymAccess: false,
    }
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger } = form;

  const handleGenderSelect = (gender: string) => {
    setValue("gender", gender);
  };

  const nextStep = async () => {
    const currentFields = steps[currentStep - 1].fields as (keyof FormData)[];
    const isValid = await trigger(currentFields);
    if (isValid) setCurrentStep(s => Math.min(s + 1, steps.length));
  };

  const prevStep = () => setCurrentStep(s => Math.max(s - 1, 1));

  const onSubmit = (data: FormData) => {
    createProfile(data, {
      onSuccess: () => {
        setLocation("/dashboard");
      }
    });
  };

  const StepIcon = steps[currentStep - 1].icon;

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden selection:bg-primary/30">
      {/* Cybergrid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
        <div className="h-full w-full" style={{ backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] -z-10 rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full glass-card rounded-[3rem] shadow-2xl border-white/5 overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <StepIcon className="w-48 h-48 text-primary" />
        </div>

        {/* Tactical Pipeline Tracker */}
        <div className="h-2 w-full flex gap-1 px-1 pt-1">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "h-full flex-1 transition-all duration-500 rounded-full",
                step.id < currentStep ? "bg-primary" : step.id === currentStep ? "bg-primary/40 animate-pulse" : "bg-white/5"
              )}
            />
          ))}
        </div>

        <div className="p-10 md:p-14">
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <StepIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-3xl font-display font-bold text-white uppercase tracking-tight leading-none">{steps[currentStep - 1].title}</h2>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] mt-2">{steps[currentStep - 1].subtitle}</p>
              </div>
            </div>
            <div className="h-[1px] w-full bg-gradient-to-r from-white/10 to-transparent" />
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 min-h-[300px]">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="space-y-3 group">
                    <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Designation_Alias</Label>
                    <Input
                      placeholder="ENTER_NAME..."
                      {...register("displayName")}
                      className="h-16 bg-white/[0.03] border-white/5 rounded-2xl focus:border-primary/50 text-white font-mono text-xs uppercase tracking-widest"
                    />
                    {errors.displayName && <p className="text-[10px] font-mono text-red-400 uppercase">{errors.displayName.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3 group">
                      <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Temporal_Cycles (Age)</Label>
                      <Input
                        type="number"
                        placeholder="25"
                        {...register("age")}
                        className="h-16 bg-white/[0.03] border-white/5 rounded-2xl focus:border-primary/50 text-white font-mono text-xs uppercase tracking-widest"
                      />
                      {errors.age && <p className="text-[10px] font-mono text-red-400 uppercase">{errors.age.message}</p>}
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1">Biological_Type</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {['male', 'female', 'other'].map((g) => (
                          <button
                            key={g}
                            type="button"
                            className={cn(
                              "flex items-center justify-center rounded-xl h-14 font-mono text-[9px] font-bold uppercase tracking-widest transition-all border",
                              watch("gender") === g ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(142,214,63,0.3)]" : "bg-white/5 text-white/40 border-white/5 hover:border-white/10"
                            )}
                            onClick={() => handleGenderSelect(g)}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                      {errors.gender && <p className="text-[10px] font-mono text-red-400 uppercase">{errors.gender.message}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3 group">
                      <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Vertical_Scale (CM)</Label>
                      <Input
                        type="number"
                        placeholder="175"
                        {...register("height")}
                        className="h-16 bg-white/[0.03] border-white/5 rounded-2xl focus:border-primary/50 text-white font-mono text-xs uppercase tracking-widest"
                      />
                    </div>
                    <div className="space-y-3 group">
                      <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Atomic_Mass (KG)</Label>
                      <Input
                        type="number"
                        placeholder="80"
                        {...register("currentWeight")}
                        className="h-16 bg-white/[0.03] border-white/5 rounded-2xl focus:border-primary/50 text-white font-mono text-xs uppercase tracking-widest"
                      />
                    </div>
                  </div>
                  <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-primary">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <p className="text-[10px] font-mono text-primary/80 leading-relaxed uppercase tracking-widest">
                      Atomic mass verified. System will calibrate metabolic slots based on these data points.
                    </p>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1">Primary_Objective</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'fat_loss', label: 'Fat_Loss', icon: '📉' },
                        { value: 'muscle_gain', label: 'Muscle_Gain', icon: '📈' },
                        { value: 'maintain', label: 'Maintain', icon: '📊' }
                      ].map((opt) => (
                        <div key={opt.value}>
                          <button
                            type="button"
                            className={cn(
                              "w-full flex flex-col items-center justify-center rounded-2xl h-20 font-mono text-[9px] font-bold uppercase tracking-widest transition-all border",
                              watch("primaryGoal") === opt.value ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(142,214,63,0.3)]" : "bg-white/5 text-white/40 border-white/5 hover:border-white/10"
                            )}
                            onClick={() => setValue("primaryGoal", opt.value)}
                          >
                            <span className="text-2xl mb-1">{opt.icon}</span>
                            {opt.label}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3 group">
                    <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Desired_Mass_State</Label>
                    <Input
                      type="number"
                      placeholder="70"
                      {...register("targetWeight")}
                      className="h-16 bg-white/[0.03] border-white/5 rounded-2xl focus:border-primary/50 text-white font-mono text-xs uppercase tracking-widest"
                    />
                    <p className="text-[9px] font-mono text-white/30 tracking-[0.2em] uppercase mt-2">
                      Optimizing for sustainable morphological shift (0.5kg - 1.0kg / Weekly Cycle).
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1">Daily_Synthesis_Frequency</Label>
                    <Select onValueChange={(val) => setValue("dailyMealCount", parseInt(val))} defaultValue={String(watch("dailyMealCount") || 3)}>
                      <SelectTrigger className="h-16 bg-white/[0.03] border-white/5 rounded-2xl focus:ring-0 focus:border-primary/50 text-white"><SelectValue placeholder="SELECT_COUNT" /></SelectTrigger>
                      <SelectContent className="bg-black border-white/10">
                        <SelectItem value="3">03_MEAL_PROTOCOL</SelectItem>
                        <SelectItem value="4">04_MEAL_PROTOCOL</SelectItem>
                        <SelectItem value="5">05_MEAL_PROTOCOL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="space-y-3 group">
                    <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Kinetic_Profile_Intensity</Label>
                    <Select onValueChange={(val) => setValue("activityLevel", val)} defaultValue={watch("activityLevel")}>
                      <SelectTrigger className="h-16 bg-white/[0.03] border-white/5 rounded-2xl focus:ring-0 focus:border-primary/50 text-white"><SelectValue placeholder="SELECT_LIFESTYLE" /></SelectTrigger>
                      <SelectContent className="bg-black border-white/10">
                        <SelectItem value="sedentary">Low_Load (Sedentary)</SelectItem>
                        <SelectItem value="moderate">Med_Load (Active_1-3x)</SelectItem>
                        <SelectItem value="active">High_Load (Active_4-5x)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 group">
                    <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Temporal_Allotment (Min/Day)</Label>
                    <Input
                      type="number"
                      placeholder="45"
                      {...register("timeAvailability")}
                      className="h-16 bg-white/[0.03] border-white/5 rounded-2xl focus:border-primary/50 text-white font-mono text-xs uppercase tracking-widest"
                    />
                  </div>

                  <div className="flex items-center space-x-4 p-6 rounded-2xl bg-white/[0.03] border border-white/5 group hover:border-primary/20 transition-all cursor-pointer" onClick={() => setValue("gymAccess", !watch("gymAccess"))}>
                    <div className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                      watch("gymAccess") ? "bg-primary border-primary" : "border-white/20"
                    )}>
                      {watch("gymAccess") && <Check className="w-3 h-3 text-black" />}
                    </div>
                    <input type="checkbox" id="gym" className="hidden" {...register("gymAccess")} />
                    <Label htmlFor="gym" className="text-[10px] font-mono text-white/60 uppercase tracking-widest cursor-pointer">Hardware_Access_Enabled (Gym_Access)</Label>
                  </div>
                </motion.div>
              )}

              {currentStep === 5 && (
                <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1">Nutrient_Source_Origin</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {['veg', 'non-veg', 'egg'].map((opt) => (
                        <div key={opt}>
                          <button
                            type="button"
                            className={cn(
                              "w-full flex items-center justify-center rounded-2xl h-16 font-mono text-[9px] font-bold uppercase tracking-widest transition-all border",
                              watch("dietaryPreferences") === opt ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(142,214,63,0.3)]" : "bg-white/5 text-white/40 border-white/5 hover:border-white/10"
                            )}
                            onClick={() => setValue("dietaryPreferences", opt)}
                          >
                            {opt.replace('-', '_')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1">Preferred_Cuisine_Region</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'north_indian', label: 'North_Indian' },
                        { value: 'south_indian', label: 'South_Indian' }
                      ].map((opt) => (
                        <div key={opt.value}>
                          <button
                            type="button"
                            className={cn(
                              "w-full flex items-center justify-center rounded-2xl h-16 font-mono text-[9px] font-bold uppercase tracking-widest transition-all border",
                              watch("regionPreference") === opt.value ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(142,214,63,0.3)]" : "bg-white/5 text-white/40 border-white/5 hover:border-white/10"
                            )}
                            onClick={() => setValue("regionPreference", opt.value)}
                          >
                            {opt.label}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1">Synthesis_Lab_Capabilities</Label>
                    <Select onValueChange={(val) => setValue("cookingAccess", val)} defaultValue={watch("cookingAccess")}>
                      <SelectTrigger className="h-16 bg-white/[0.03] border-white/5 rounded-2xl focus:ring-0 focus:border-primary/50 text-white"><SelectValue placeholder="SELECT_STATION" /></SelectTrigger>
                      <SelectContent className="bg-black border-white/10">
                        <SelectItem value="full">High_Utility (Full Kitchen)</SelectItem>
                        <SelectItem value="basic">Standard_Utility (Basic)</SelectItem>
                        <SelectItem value="none">Field_Op (No Kitchen)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-center pt-10 border-t border-white/5">
              <Button
                type="button"
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30 hover:text-white hover:bg-transparent transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Pre_Sequence
              </Button>

              {currentStep < steps.length ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={nextStep}
                  className="h-14 px-10 rounded-2xl bg-white/5 border border-white/10 text-white font-display font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  Post_Sequence <ArrowRight className="w-4 h-4 ml-2 text-primary" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isPending}
                  className="h-14 px-10 rounded-2xl bg-primary text-black font-display font-bold uppercase text-[10px] tracking-widest shadow-[0_0_30px_rgba(142,214,63,0.3)] transition-all flex items-center gap-2 border-none outline-none"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <ShieldCheck className="w-4 h-4" />}
                  Final_Initialization
                </motion.button>
              )}
            </div>
          </form>
        </div>
      </motion.div>

      {/* Background Status Indicator */}
      <div className="absolute bottom-10 left-10 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-[8px] font-mono font-bold text-white/20 uppercase tracking-[0.4em]">Auth_Status: VERIFIED</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white/10" />
          <span className="text-[8px] font-mono font-bold text-white/20 uppercase tracking-[0.4em]">Connection: ENCRYPTED_TUNNEL</span>
        </div>
      </div>
    </div>
  );
}
