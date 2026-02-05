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
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { insertUserProfileSchema } from "@shared/schema";

// Wizard Steps Data
const steps = [
  { id: 1, title: "Identity", fields: ["displayName", "age", "royalRole"] },
  { id: 2, title: "Basic Info", fields: ["height", "currentWeight"] },
  { id: 3, title: "Goals", fields: ["targetWeight", "dailyMealCount"] },
  { id: 4, title: "Lifestyle", fields: ["activityLevel", "timeAvailability", "gymAccess"] },
  { id: 5, title: "Food", fields: ["dietaryPreferences", "cookingAccess"] },
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
  const currentWeight = watch("currentWeight");
  const age = watch("age");

  const handleGenderSelect = (gender: string) => {
    setValue("gender", gender);
  };

  const nextStep = async () => {
    // Validate current step fields before moving
    const currentFields = steps[currentStep - 1].fields as (keyof FormData)[];
    const isValid = await trigger(currentFields);
    if (isValid) setCurrentStep(s => Math.min(s + 1, steps.length));
  };

  const prevStep = () => setCurrentStep(s => Math.max(s - 1, 1));

  const onSubmit = (data: FormData) => {
    console.log("Submitting onboarding data:", data);
    createProfile(data, {
      onSuccess: () => {
        console.log("Profile created successfully, redirecting to dashboard");
        setLocation("/dashboard");
      },
      onError: (error) => {
        console.error("Profile creation failed:", error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-secondary w-full">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-foreground">{steps[currentStep - 1].title}</h2>
            <p className="text-muted-foreground text-sm">Step {currentStep} of {steps.length}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="space-y-2">
                    <Label>What should I call you?</Label>
                    <Input placeholder="Enter your name" {...register("displayName")} />
                    {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>How old are you?</Label>
                    <Input type="number" placeholder="25" {...register("age")} />
                    {errors.age && <p className="text-xs text-destructive">{errors.age.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {['male', 'female', 'other'].map((g) => (
                        <Button
                          key={g}
                          type="button"
                          variant={watch("gender") === g ? "default" : "outline"}
                          className="rounded-xl h-12 capitalize"
                          onClick={() => handleGenderSelect(g)}
                        >
                          {g}
                        </Button>
                      ))}
                    </div>
                    {errors.gender && <p className="text-xs text-destructive">{errors.gender.message}</p>}
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Height (cm)</Label>
                      <Input type="number" placeholder="175" {...register("height")} />
                      {errors.height && <p className="text-xs text-destructive">{errors.height.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Current Weight (kg)</Label>
                      <Input type="number" placeholder="80" {...register("currentWeight")} />
                      {errors.currentWeight && <p className="text-xs text-destructive">{errors.currentWeight.message}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Target Weight (kg)</Label>
                    <Input type="number" placeholder="70" {...register("targetWeight")} />
                    <p className="text-xs text-muted-foreground">
                      We optimize for sustainable fat loss (0.5kg - 1kg per week).
                    </p>
                    {errors.targetWeight && <p className="text-xs text-destructive">{errors.targetWeight.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>How many meals do you prefer per day?</Label>
                    <Select onValueChange={(val) => setValue("dailyMealCount", parseInt(val))} defaultValue={String(watch("dailyMealCount") || 3)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Meals</SelectItem>
                        <SelectItem value="4">4 Meals</SelectItem>
                        <SelectItem value="5">5 Meals</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.dailyMealCount && <p className="text-xs text-destructive">{errors.dailyMealCount.message}</p>}
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Activity Level</Label>
                    <Select onValueChange={(val) => setValue("activityLevel", val)} defaultValue={watch("activityLevel")}>
                      <SelectTrigger><SelectValue placeholder="Select Lifestyle" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary (Desk job)</SelectItem>
                        <SelectItem value="moderate">Moderate (Light exercise 1-3x/week)</SelectItem>
                        <SelectItem value="active">Active (Exercise 4-5x/week)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.activityLevel && <p className="text-xs text-destructive">{errors.activityLevel.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Time for Exercise (min/day)</Label>
                    <Input type="number" placeholder="45" {...register("timeAvailability")} />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <input type="checkbox" id="gym" className="rounded border-gray-300 text-primary focus:ring-primary" {...register("gymAccess")} />
                    <Label htmlFor="gym">I have access to a gym</Label>
                  </div>
                </motion.div>
              )}

              {currentStep === 5 && (
                <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="space-y-3">
                    <Label>Dietary Preference</Label>
                    <RadioGroup onValueChange={(val) => setValue("dietaryPreferences", val)} value={watch("dietaryPreferences")} className="grid grid-cols-2 gap-4">
                      {['veg', 'non-veg', 'egg'].map((opt) => (
                        <div key={opt}>
                          <RadioGroupItem value={opt} id={opt} className="peer sr-only" />
                          <Label htmlFor={opt} className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all capitalize">
                            {opt.replace('-', ' ')}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    {errors.dietaryPreferences && <p className="text-xs text-destructive">{errors.dietaryPreferences.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label>Cooking Access</Label>
                    <Select onValueChange={(val) => setValue("cookingAccess", val)} defaultValue={watch("cookingAccess")}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Kitchen (Stove, Oven, Fridge)</SelectItem>
                        <SelectItem value="basic">Basic (Kettle, Microwave)</SelectItem>
                        <SelectItem value="none">None (Hostel/Dorm)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.cookingAccess && <p className="text-xs text-destructive">{errors.cookingAccess.message}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>

              {currentStep < steps.length ? (
                <Button type="button" onClick={nextStep}>
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Plan"}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
