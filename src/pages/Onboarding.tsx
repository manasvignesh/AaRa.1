import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreateProfile } from "@/hooks/use-user";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, User, Target, Zap, Utensils, Scale, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, title: "Identity", subtitle: "Tell us about yourself.", fields: ["displayName", "age", "gender"], icon: User },
  { id: 2, title: "Body Stats", subtitle: "Your current metrics.", fields: ["height", "currentWeight"], icon: Scale },
  { id: 3, title: "Your Goal", subtitle: "Where do you want to be?", fields: ["targetWeight", "dailyMealCount"], icon: Target },
  { id: 4, title: "Lifestyle", subtitle: "Activity & preferences.", fields: ["activityLevel", "timeAvailability", "gymAccess"], icon: Zap },
  { id: 5, title: "Kitchen", subtitle: "What do you eat?", fields: ["dietaryPreferences", "cookingAccess"], icon: Utensils },
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">

      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="space-y-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 mb-4 text-brand-blue">
            <currentStepData.icon className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{currentStepData.title}</h1>
            <p className="text-slate-500 font-medium">{currentStepData.subtitle}</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-brand-blue"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Step {currentStep} of {steps.length}</p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[400px] flex flex-col">
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col justify-center gap-6"
              >
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Name</Label>
                      <Input
                        className="h-14 rounded-2xl border-slate-200 bg-slate-50 px-5 text-lg font-semibold placeholder:text-slate-300 focus-visible:ring-brand-blue"
                        placeholder="John Doe"
                        {...register("displayName")}
                        autoFocus
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Age</Label>
                        <Input type="number" className="h-14 rounded-2xl border-slate-200 bg-slate-50 px-5 text-lg font-semibold" {...register("age")} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gender</Label>
                        <div className="flex gap-2">
                          {['male', 'female'].map(g => (
                            <button
                              key={g}
                              type="button"
                              className={cn("flex-1 h-14 rounded-2xl border-2 font-bold text-xs uppercase tracking-wider transition-all", watch("gender") === g ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-400 hover:border-slate-300")}
                              onClick={() => setValue("gender", g)}
                            >
                              {g}
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
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Height</Label>
                        <span className="text-xl font-bold text-brand-blue tracking-tight">{watch("height")} <span className="text-xs opacity-50 uppercase text-slate-500">cm</span></span>
                      </div>
                      <input type="range" min="120" max="220" className="w-full accent-brand-blue h-2 bg-slate-100 rounded-full appearance-none" value={watch("height")} onChange={(e) => setValue("height", parseInt(e.target.value))} />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between px-1">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Weight</Label>
                        <span className="text-xl font-bold text-brand-blue tracking-tight">{watch("currentWeight")} <span className="text-xs opacity-50 uppercase text-slate-500">kg</span></span>
                      </div>
                      <input type="range" min="40" max="150" className="w-full accent-brand-blue h-2 bg-slate-100 rounded-full appearance-none" value={watch("currentWeight")} onChange={(e) => setValue("currentWeight", parseInt(e.target.value))} />
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between px-1">
                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Weight</Label>
                        <span className="text-xl font-bold text-brand-blue tracking-tight">{watch("targetWeight")} <span className="text-xs opacity-50 uppercase text-slate-500">kg</span></span>
                      </div>
                      <input type="range" min="40" max="150" className="w-full accent-brand-blue h-2 bg-slate-100 rounded-full appearance-none" value={watch("targetWeight")} onChange={(e) => setValue("targetWeight", parseInt(e.target.value))} />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Meals per Day</Label>
                      <div className="flex gap-3">
                        {[3, 4, 5].map(c => (
                          <button key={c} type="button" className={cn("flex-1 h-14 rounded-2xl font-bold text-lg border-2 transition-all", watch("dailyMealCount") === c ? "bg-brand-blue border-brand-blue text-white" : "bg-white border-slate-200 text-slate-400")} onClick={() => setValue("dailyMealCount", c)}>{c}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activity Level</Label>
                      <Select onValueChange={(v) => setValue("activityLevel", v)} defaultValue={watch("activityLevel")}>
                        <SelectTrigger className="h-16 rounded-2xl border-slate-200 bg-slate-50 px-5 font-bold text-sm uppercase tracking-wider">
                          <SelectValue placeholder="Select Activity" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 font-bold uppercase text-xs">
                          <SelectItem value="sedentary">Sedentary (Office job)</SelectItem>
                          <SelectItem value="moderate">Moderate (1-3 days/week)</SelectItem>
                          <SelectItem value="active">Active (5+ days/week)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className={cn("flex items-center gap-4 h-16 px-6 rounded-2xl border-2 transition-all cursor-pointer", watch("gymAccess") ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-white border-slate-200 text-slate-400 hover:border-slate-300")} onClick={() => setValue("gymAccess", !watch("gymAccess"))}>
                      <Zap className={cn("w-5 h-5", watch("gymAccess") ? "fill-amber-500 text-amber-500" : "")} />
                      <span className="font-bold text-xs uppercase tracking-wider">Gym Access Available</span>
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2" >Dietary Preference</Label>
                      <div className="flex gap-2">
                        {['veg', 'non-veg', 'egg'].map(opt => (
                          <button key={opt} type="button" className={cn("flex-1 h-24 rounded-2xl flex flex-col items-center justify-center font-bold text-[10px] uppercase tracking-wider border-2 transition-all gap-2", watch("dietaryPreferences") === opt ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-400")} onClick={() => setValue("dietaryPreferences", opt)}>
                            <span className="text-2xl">{opt === 'veg' ? '🌿' : opt === 'non-veg' ? '🍖' : '🥚'}</span>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kitchen Access</Label>
                      <Select onValueChange={(v) => setValue("cookingAccess", v)} defaultValue={watch("cookingAccess")}>
                        <SelectTrigger className="h-16 rounded-2xl border-slate-200 bg-slate-50 px-5 font-bold text-sm uppercase tracking-wider">
                          <SelectValue placeholder="Select Access" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 font-bold uppercase text-xs">
                          <SelectItem value="full">Full Kitchen</SelectItem>
                          <SelectItem value="basic">Basic (Microwave/Stove)</SelectItem>
                          <SelectItem value="none">No Kitchen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex gap-3 pt-8 mt-auto border-t border-slate-50">
              <button type="button" onClick={() => setCurrentStep(s => Math.max(s - 1, 1))} disabled={currentStep === 1} className="h-14 w-14 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-400 disabled:opacity-0 transition-all hover:bg-slate-200 hover:text-slate-600"><ChevronLeft className="w-6 h-6" /></button>
              {currentStep < steps.length ? (
                <button type="button" onClick={handleNext} className="flex-1 h-14 rounded-2xl bg-slate-900 text-white font-bold uppercase tracking-widest text-xs shadow-lg shadow-slate-200 active:scale-95 transition-all">Continue <ChevronRight className="w-4 h-4 ml-2 inline-block" /></button>
              ) : (
                <button type="submit" disabled={isPending} className="flex-1 h-14 rounded-2xl bg-brand-gradient text-white font-bold uppercase tracking-widest text-xs shadow-lg shadow-brand-blue/30 active:scale-95 transition-all" style={{ background: 'linear-gradient(135deg, #2F80ED 0%, #27AE60 100%)' }}>{isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <><Sparkles className="w-4 h-4 mr-2 inline-block" /> Generate Plan</>}</button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
