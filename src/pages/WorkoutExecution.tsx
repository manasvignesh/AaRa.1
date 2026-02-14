import { useState, useEffect, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { useWorkout, useCompleteWorkout } from "@/hooks/use-workouts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, Pause, Check, Timer, AlertCircle, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { StructuredExercise } from "@shared/schema";

type WorkoutPhase = 'warmup' | 'main' | 'cooldown' | 'rest' | 'complete';

function generateStructuredWorkout(duration: number, gymAccess: boolean = false): StructuredExercise[] {
  const totalSeconds = duration * 60;
  const restDurationBetween = 10; // Rest time between exercises (included in total)

  // Calculate phase times (18/62/20 split) INCLUDING rest periods
  const warmupTime = Math.round(totalSeconds * 0.18);
  const mainTime = Math.round(totalSeconds * 0.62);
  const cooldownTime = Math.round(totalSeconds * 0.20);

  const exercises: StructuredExercise[] = [];

  // Warmup (18% of total time) - 4 exercises with 3 rests between them
  const warmupRests = 3 * restDurationBetween;
  const warmupExerciseTime = warmupTime - warmupRests;
  exercises.push(
    { name: "Arm Circles", duration: Math.round(warmupExerciseTime * 0.25), instruction: "Gently rotate your arms in circles. Start small, gradually increase.", phase: 'warmup' },
    { name: "Marching in Place", duration: Math.round(warmupExerciseTime * 0.35), instruction: "Lift your knees high while marching. Keep your core engaged.", phase: 'warmup' },
    { name: "Hip Rotations", duration: Math.round(warmupExerciseTime * 0.20), instruction: "Place hands on hips and rotate in circles. Switch directions.", phase: 'warmup' },
    { name: "Gentle Squats", duration: Math.round(warmupExerciseTime * 0.20), instruction: "Slowly lower into a quarter squat. No need to go deep.", phase: 'warmup' }
  );

  // Main Workout (62% of total time) - compound movements with rests
  const mainExerciseTemplates = gymAccess ? [
    { name: "Bodyweight Squats", instruction: "Stand with feet shoulder-width apart. Lower down as if sitting in a chair." },
    { name: "Push-ups (Wall or Floor)", instruction: "Choose your variation. Keep your body in a straight line." },
    { name: "Lunges", instruction: "Step forward and lower your back knee. Alternate legs." },
    { name: "Plank Hold", instruction: "Hold your body in a straight line. Breathe steadily." },
    { name: "Glute Bridges", instruction: "Lie on your back, feet flat. Lift your hips toward the ceiling." },
  ] : [
    { name: "Bodyweight Squats", instruction: "Stand with feet shoulder-width apart. Lower down as if sitting in a chair." },
    { name: "Wall Push-ups", instruction: "Place hands on wall, lean in and push back. Keep core tight." },
    { name: "Standing Knee Raises", instruction: "Stand tall and alternate lifting knees to waist height." },
    { name: "Chair Dips", instruction: "Use a sturdy chair. Lower and raise your body using your arms." },
    { name: "Glute Bridges", instruction: "Lie on your back, feet flat. Lift your hips toward the ceiling." },
  ];

  // Estimate main exercises count and allocate time
  const mainExercisesCount = Math.max(5, Math.floor(mainTime / 50)); // ~40-50s per exercise cycle
  const mainRestsTotal = (mainExercisesCount - 1) * restDurationBetween;
  const mainExerciseTime = mainTime - mainRestsTotal;
  const perExerciseDuration = Math.floor(mainExerciseTime / mainExercisesCount);

  for (let i = 0; i < mainExercisesCount; i++) {
    const template = mainExerciseTemplates[i % mainExerciseTemplates.length];
    exercises.push({ ...template, duration: perExerciseDuration, phase: 'main' });
  }

  // Cooldown (20% of total time) - 4 exercises with 3 rests
  const cooldownRests = 3 * restDurationBetween;
  const cooldownExerciseTime = cooldownTime - cooldownRests;
  exercises.push(
    { name: "Deep Breathing", duration: Math.round(cooldownExerciseTime * 0.25), instruction: "Breathe in for 4 counts, hold for 4, out for 6. Relax your shoulders.", phase: 'cooldown' },
    { name: "Standing Forward Fold", duration: Math.round(cooldownExerciseTime * 0.25), instruction: "Let your upper body hang. Bend knees if needed.", phase: 'cooldown' },
    { name: "Quad Stretch", duration: Math.round(cooldownExerciseTime * 0.25), instruction: "Hold each leg for 15 seconds. Use wall for balance if needed.", phase: 'cooldown' },
    { name: "Final Relaxation", duration: Math.round(cooldownExerciseTime * 0.25), instruction: "Close your eyes. Take 5 slow, deep breaths. You did it.", phase: 'cooldown' }
  );

  return exercises;
}

export default function WorkoutExecution() {
  const [, params] = useRoute("/workout/:id/start");
  const [, setLocation] = useLocation();

  const { data: workout, isLoading: workoutLoading } = useWorkout(params?.id);
  const { mutate: completeWorkout } = useCompleteWorkout();

  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const workoutDate = workout?.plan?.date ? parseISO(workout.plan.date) : new Date();
  const dateStr = workout?.plan?.date || format(new Date(), "yyyy-MM-dd");

  const exercises = workout?.exercises || generateStructuredWorkout(workout?.duration || 30, false);
  const restDuration = 10; // seconds between exercises (already included in phase budgets)

  const currentExercise = exercises[currentIndex];
  // Total duration includes exercise time + rest periods (rests are budgeted in phase generation)
  const totalExerciseTime = exercises.reduce((sum: number, ex: any) => sum + ex.duration, 0);
  const totalRestTime = (exercises.length - 1) * restDuration;
  const totalDuration = totalExerciseTime + totalRestTime;
  const progress = (totalElapsed / totalDuration) * 100;

  // Timer effect
  useEffect(() => {
    if (!isRunning || !currentExercise) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Move to next
          if (isResting) {
            setIsResting(false);
            setCurrentIndex(i => i + 1);
            return exercises[currentIndex + 1]?.duration || 0;
          } else if (currentIndex < exercises.length - 1) {
            setIsResting(true);
            return restDuration;
          } else {
            // Workout complete
            setIsRunning(false);
            return 0;
          }
        }
        return prev - 1;
      });
      setTotalElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isResting, currentIndex, exercises, currentExercise]);

  const handleStart = useCallback(async () => {
    if (!isRunning && currentExercise && workout) {
      // Start workout session via API
      try {
        await fetch(`/api/workouts/${workout.id}/start`, {
          method: 'POST',
          credentials: 'include'
        });
      } catch (e) {
        console.log("Session tracking not critical:", e);
      }
      setTimeRemaining(currentExercise.duration);
      setIsRunning(true);
    }
  }, [isRunning, currentExercise, workout]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleResume = useCallback(() => {
    setIsRunning(true);
  }, []);

  const handleEndEarly = useCallback(() => {
    if (workout) {
      completeWorkout({ id: workout.id, isCompleted: true, feedback: "partial", date: dateStr });
    }
    setLocation("/dashboard");
  }, [workout, completeWorkout, setLocation, dateStr]);

  const handleComplete = useCallback(() => {
    if (workout) {
      completeWorkout({ id: workout.id, isCompleted: true, date: dateStr });
    }
    setLocation("/dashboard");
  }, [workout, completeWorkout, setLocation, dateStr]);

  if (workoutLoading || !workout) {
    if (!workoutLoading && !workout) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-secondary/30 gap-4">
          <p className="text-muted-foreground">Workout not found.</p>
          <Button onClick={() => setLocation("/dashboard")}>Return to Dashboard</Button>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isComplete = currentIndex >= exercises.length - 1 && timeRemaining === 0 && !isResting;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 border-b bg-card flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setShowEndConfirm(true)} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-lg">{workout.name}</h1>
            <p className="text-xs text-muted-foreground">{format(workoutDate, "MMM do")} • {workout.duration} mins</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{Math.floor(totalElapsed / 60)}:{String(totalElapsed % 60).padStart(2, '0')}</p>
          <p className="text-xs text-muted-foreground">elapsed</p>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="px-4 pt-4">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1 text-center">
          {Math.round(progress)}% complete
        </p>
      </div>

      <main className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center max-w-xl mx-auto w-full">
        {isComplete ? (
          <div className="text-center space-y-6 animate-in fade-in">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Check className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Great Work!</h2>
            <p className="text-muted-foreground">
              You completed {workout.duration} minutes of movement today.
              Your body thanks you.
            </p>
            <Button size="lg" className="w-full max-w-xs" onClick={handleComplete} data-testid="button-finish">
              Finish Workout
            </Button>
          </div>
        ) : (
          <>
            {/* Current Exercise Card */}
            <Card className={cn(
              "p-8 w-full text-center space-y-6 transition-all",
              isResting ? "bg-blue-50 border-blue-200" : "bg-card"
            )}>
              <div className="space-y-2">
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  isResting ? "text-blue-600" : currentExercise?.phase === 'warmup' ? "text-orange-600" : currentExercise?.phase === 'cooldown' ? "text-green-600" : "text-primary"
                )}>
                  {isResting ? "Rest" : currentExercise?.phase}
                </span>
                <h2 className="text-3xl font-bold">
                  {isResting ? "Take a breath" : currentExercise?.name}
                </h2>
              </div>

              <div className="text-6xl font-mono font-bold text-primary">
                {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
              </div>

              {!isResting && currentExercise && (
                <p className="text-muted-foreground leading-relaxed">
                  {currentExercise.instruction}
                </p>
              )}

              {isResting && (
                <p className="text-blue-600">
                  Next: {exercises[currentIndex + 1]?.name}
                </p>
              )}
            </Card>

            {/* Controls */}
            <div className="flex gap-4 mt-8 w-full max-w-xs">
              {!isRunning && totalElapsed === 0 ? (
                <Button size="lg" className="flex-1 h-14 text-lg" onClick={handleStart} data-testid="button-start">
                  <Play className="mr-2 w-5 h-5" /> Start Workout
                </Button>
              ) : isRunning ? (
                <Button size="lg" variant="secondary" className="flex-1 h-14 text-lg" onClick={handlePause} data-testid="button-pause">
                  <Pause className="mr-2 w-5 h-5" /> Pause
                </Button>
              ) : (
                <Button size="lg" className="flex-1 h-14 text-lg" onClick={handleResume} data-testid="button-resume">
                  <Play className="mr-2 w-5 h-5" /> Resume
                </Button>
              )}
            </div>
          </>
        )}
      </main>

      {/* End Early Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              <h3 className="font-semibold text-lg">End workout early?</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              It's okay — we'll record what you've done. Every minute counts.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowEndConfirm(false)}>
                Keep Going
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleEndEarly} data-testid="button-end-early">
                End Now
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
