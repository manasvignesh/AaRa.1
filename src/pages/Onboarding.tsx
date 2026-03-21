import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Loader2, Sparkles, Target, User, Utensils, Zap, Scale } from "lucide-react";

import { useCreateProfile } from "@/hooks/use-user";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, title: "Identity", subtitle: "Tell us about yourself.", fields: ["displayName", "age", "gender"], icon: User },
  { id: 2, title: "Body Stats", subtitle: "Your current metrics.", fields: ["height", "currentWeight"], icon: Scale },
  { id: 3, title: "Your Goal", subtitle: "Where do you want to be?", fields: ["targetWeight", "dailyMealCount"], icon: Target },
  { id: 4, title: "Lifestyle", subtitle: "Activity and access.", fields: ["activityLevel", "timeAvailability", "gymAccess"], icon: Zap },
  { id: 5, title: "Kitchen", subtitle: "Food and cooking preference.", fields: ["dietaryPreferences", "cookingAccess"], icon: Utensils },
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

const getWeightCategory = (bmi: number) => {
  if (bmi < 18.5) return "underweight";
  if (bmi < 23.0) return "healthy";
  if (bmi < 27.5) return "overweight";
  if (bmi < 35.0) return "obese";
  return "severely_obese";
};

const bmiDisplayNames: Record<
  string,
  { label: string; color: string; bgColor: string; borderColor: string; tip: string }
> = {
  underweight: {
    label: "Building Phase",
    color: "#6AAFF5",
    bgColor: "rgba(47,128,237,0.1)",
    borderColor: "rgba(47,128,237,0.25)",
    tip: "Focus on calorie-dense nutritious meals",
  },
  healthy: {
    label: "In the Zone",
    color: "#27AE60",
    bgColor: "rgba(39,174,96,0.1)",
    borderColor: "rgba(39,174,96,0.25)",
    tip: "Maintain your great habits",
  },
  overweight: {
    label: "Active Transformation",
    color: "#E8A93A",
    bgColor: "rgba(232,169,58,0.1)",
    borderColor: "rgba(232,169,58,0.25)",
    tip: "High fiber meals are your best friend",
  },
  obese: {
    label: "Power Journey",
    color: "#F5A623",
    bgColor: "rgba(245,166,35,0.1)",
    borderColor: "rgba(245,166,35,0.25)",
    tip: "Small consistent steps create big changes",
  },
  severely_obese: {
    label: "Strong Start",
    color: "#E8A93A",
    bgColor: "rgba(232,169,58,0.1)",
    borderColor: "rgba(232,169,58,0.25)",
    tip: "Every healthy choice counts. You've got this",
  },
};

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
    },
  });

  const { register, handleSubmit, watch, setValue, trigger } = form;
  const currentStepData = steps[currentStep - 1];
  const height = Number(watch("height") || 0);
  const weight = Number(watch("currentWeight") || 0);
  const calculatedBmi =
    height > 0 && weight > 0 ? weight / Math.pow(height / 100, 2) : null;
  const bmiCategory = calculatedBmi ? getWeightCategory(calculatedBmi) : null;
  const bmiConfig = bmiCategory ? bmiDisplayNames[bmiCategory] : null;

  const handleNext = async () => {
    const fields = currentStepData.fields as (keyof FormData)[];
    if (await trigger(fields)) setCurrentStep((s) => Math.min(s + 1, steps.length));
  };

  const onSubmit = (data: FormData) => {
    createProfile(data, {
      onSuccess: () => setLocation("/dashboard"),
    });
  };

  const cardClass = (selected: boolean) =>
    cn("wellness-card cursor-pointer p-4 text-left transition-all", selected && "");

  return (
    <div className="page-transition min-h-screen px-6 py-8">
      <div className="mx-auto max-w-xl space-y-8">
        <div className="animate-slide-up text-center">
          <div className="section-label mb-3">Setup</div>
          <h1 className="font-display text-4xl">{currentStepData.title}</h1>
          <p className="mt-3" style={{ color: "var(--text-secondary)" }}>
            {currentStepData.subtitle}
          </p>
          <div className="progress-bar mt-6">
            <div className="progress-bar-fill" style={{ width: `${(currentStep / steps.length) * 100}%` }} />
          </div>
          <p className="section-label mt-3">Step {currentStep} of {steps.length}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="wellness-card animate-slide-up p-6 md:p-8">
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="stagger-1">
                <Label className="section-label mb-2 block">Display Name</Label>
                <Input className="input-field" placeholder="Your name" {...register("displayName")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="stagger-2">
                  <Label className="section-label mb-2 block">Age</Label>
                  <Input type="number" className="input-field" {...register("age")} />
                </div>
                <div className="stagger-3">
                  <Label className="section-label mb-2 block">Gender</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {["male", "female"].map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        className={cardClass(watch("gender") === gender)}
                        style={watch("gender") === gender ? { borderColor: "var(--brand-primary)" } : undefined}
                        onClick={() => setValue("gender", gender)}
                      >
                        <span style={{ color: "var(--text-primary)" }}>{gender}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="stagger-1">
                  <Label className="section-label mb-2 block">Height (cm)</Label>
                  <Input type="number" className="input-field" {...register("height")} />
                </div>
                <div className="stagger-2">
                  <Label className="section-label mb-2 block">Current Weight (kg)</Label>
                  <Input type="number" className="input-field" {...register("currentWeight")} />
                </div>
              </div>

              {calculatedBmi && bmiConfig && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "16px",
                    borderRadius: "16px",
                    background: bmiConfig.bgColor,
                    border: `1px solid ${bmiConfig.borderColor}`,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      marginBottom: "4px",
                    }}
                  >
                    YOUR CURRENT BMI
                  </div>
                  <div
                    style={{
                      fontSize: "42px",
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      color: bmiConfig.color,
                      lineHeight: 1,
                    }}
                  >
                    {calculatedBmi.toFixed(1)}
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: bmiConfig.color,
                      marginTop: "6px",
                    }}
                  >
                    {bmiConfig.label}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    {bmiConfig.tip}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="stagger-1">
                <Label className="section-label mb-2 block">Target Weight</Label>
                <Input type="number" className="input-field" {...register("targetWeight")} />
              </div>
              <div className="stagger-2">
                <Label className="section-label mb-2 block">Meals Per Day</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[3, 4, 5].map((count) => (
                    <button
                      key={count}
                      type="button"
                      className={cardClass(watch("dailyMealCount") === count)}
                      style={watch("dailyMealCount") === count ? { borderColor: "var(--brand-primary)" } : undefined}
                      onClick={() => setValue("dailyMealCount", count)}
                    >
                      <span className="font-display text-2xl">{count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="stagger-1">
                <Label className="section-label mb-2 block">Activity Level</Label>
                <Select onValueChange={(v) => setValue("activityLevel", v)} defaultValue={watch("activityLevel")}>
                  <SelectTrigger className="input-field h-auto">
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="stagger-2">
                <Label className="section-label mb-2 block">Time Availability</Label>
                <Input type="number" className="input-field" {...register("timeAvailability")} />
              </div>
              <button
                type="button"
                className="wellness-card stagger-3 w-full p-4 text-left"
                style={watch("gymAccess") ? { borderColor: "var(--brand-primary)" } : undefined}
                onClick={() => setValue("gymAccess", !watch("gymAccess"))}
              >
                <div className="section-label mb-1">Gym Access</div>
                <div style={{ color: "var(--text-primary)" }}>
                  {watch("gymAccess") ? "Available" : "Not available"}
                </div>
              </button>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="stagger-1">
                <Label className="section-label mb-2 block">Diet Preference</Label>
                <div className="grid grid-cols-3 gap-3">
                  {["veg", "non-veg", "egg"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={cardClass(watch("dietaryPreferences") === opt)}
                      style={watch("dietaryPreferences") === opt ? { borderColor: "var(--brand-primary)" } : undefined}
                      onClick={() => setValue("dietaryPreferences", opt)}
                    >
                      <span style={{ color: "var(--text-primary)" }}>{opt}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="stagger-2">
                <Label className="section-label mb-2 block">Kitchen Access</Label>
                <Select onValueChange={(v) => setValue("cookingAccess", v)} defaultValue={watch("cookingAccess")}>
                  <SelectTrigger className="input-field h-auto">
                    <SelectValue placeholder="Select access" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Kitchen</SelectItem>
                    <SelectItem value="basic">Basic Setup</SelectItem>
                    <SelectItem value="none">No Kitchen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-3 border-t pt-6" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <button type="button" onClick={() => setCurrentStep((s) => Math.max(s - 1, 1))} disabled={currentStep === 1} className="btn-ghost">
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            {currentStep < steps.length ? (
              <button type="button" onClick={handleNext} className="btn-primary ml-auto">
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="submit" disabled={isPending} className="btn-primary ml-auto">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate Plan
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
