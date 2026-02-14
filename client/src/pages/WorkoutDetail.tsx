import { useLocation, useRoute } from "wouter";
import { useWorkout, useCompleteWorkout } from "@/hooks/use-workouts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Check, Timer, BarChart, Loader2, Info, Dumbbell, Zap, Activity, ShieldCheck, Target, ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function WorkoutDetail() {
  const [, params] = useRoute("/workout/:id");
  const [location, setLocation] = useLocation();

  const { data: workout, isLoading: workoutLoading } = useWorkout(params?.id);
  const { mutate: completeWorkout, isPending } = useCompleteWorkout();

  if (workoutLoading) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-background relative overflow-hidden">
        <main className="flex-1 flex flex-col items-center justify-center gap-8 z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-16 h-16 rounded-full border-2 border-primary border-t-transparent shadow-[0_0_20px_rgba(142,214,63,0.3)]"
          />
        </main>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#050505] gap-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <X className="w-10 h-10 text-red-500" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight">KINETIC_DATA_NULL</h2>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] mt-2">The requested workout node does not exist in the neural archive.</p>
        </div>
        <Button
          className="h-14 px-10 rounded-2xl bg-white/5 border border-white/10 text-white font-display font-bold uppercase tracking-widest hover:bg-white/10"
          onClick={() => setLocation("/workouts")}
        >
          RETURN_TO_REGISTRY
        </Button>
      </div>
    );
  }

  const workoutDate = workout.plan?.date ? parseISO(workout.plan.date) : new Date();
  const dateStr = workout.plan?.date || format(new Date(), "yyyy-MM-dd");

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden selection:bg-primary/30">
      {/* Cybergrid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
        <div className="h-full w-full" style={{ backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <header className="p-6 md:p-8 flex items-center justify-between sticky top-0 z-50 glass-card border-none border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setLocation("/workouts")}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-tight leading-none mb-1">STAMINA_PROTOCOL_{workout.id}</h1>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] font-bold">{format(workoutDate, "EEEE // MMM do")}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Kinetic_Registry</p>
            <p className="text-[10px] font-mono text-white/60">NODE_AUTH_BETA_9</p>
          </div>
          <div className="h-8 w-[1px] bg-white/10 mx-2 hidden md:block" />
          {workout.isCompleted ? (
            <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">PROTOCOL_COMPLETE</span>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest">PHASE_READY</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 max-w-4xl mx-auto w-full z-10 space-y-12">
        {/* Mission Briefing Hero */}
        <section className="space-y-10 relative">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 blur-[100px] -z-10 rounded-full" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-primary uppercase tracking-[0.4em]">MISSION_DEPLOYMENT</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-display font-bold text-white uppercase tracking-tighter leading-none">{workout.name}</h2>
            <div className="h-[2px] w-32 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-10 rounded-[2.5rem] border-white/5 bg-white/[0.02] flex items-center gap-8 group hover:border-white/10 transition-all"
            >
              <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                <Timer className="w-8 h-8 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mb-1">Temporal_Allotment</p>
                <p className="text-4xl font-display font-bold text-white tracking-tighter">{workout.duration} <span className="text-sm font-medium text-white/20 uppercase ml-1">Min</span></p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-10 rounded-[2.5rem] border-white/5 bg-white/[0.02] flex items-center gap-8 group hover:border-white/10 transition-all"
            >
              <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <BarChart className="w-8 h-8 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mb-1">Intensity_Tier</p>
                <p className="text-4xl font-display font-bold text-white tracking-tighter uppercase font-light italic">{workout.difficulty || "FLOW"}</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Coach Intel */}
        {workout.description && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-10 rounded-[2.5rem] border-white/5 bg-indigo-500/[0.02] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Info className="w-24 h-24 text-indigo-400" />
            </div>
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-4 h-4 text-indigo-400" />
              <h3 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-[0.4em]">TACTICAL_COORDINATION</h3>
            </div>
            <p className="text-lg font-display font-medium text-white/80 leading-relaxed italic uppercase tracking-tight">
              "{workout.description}"
            </p>
          </motion.section>
        )}

        {/* Sub-Routine Sequence */}
        <section className="space-y-8">
          <div className="flex items-center gap-4 px-2">
            <Dumbbell className="w-4 h-4 text-primary opacity-60" />
            <h2 className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.4em]">Sub_Routine_Sequence</h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-white/5 to-transparent" />
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {Array.isArray(workout.exercises) && (workout.exercises as any[]).map((ex: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-card p-8 rounded-[2rem] border-white/5 bg-white/[0.01] flex items-center gap-8 group hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity">
                    <Zap className="w-16 h-16 text-primary" />
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-display font-bold text-white/20 shrink-0 group-hover:text-primary group-hover:border-primary/20 transition-all">
                    {(idx + 1).toString().padStart(2, '0')}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-display font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors">{typeof ex === 'string' ? ex : ex.name}</h4>
                    {typeof ex !== 'string' && ex.sets && (
                      <div className="flex items-center gap-6 mt-2">
                        <div className="flex items-center gap-2">
                          <Layers className="w-3 h-3 text-white/20" />
                          <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{ex.sets} SETS</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="w-3 h-3 text-white/20" />
                          <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{ex.reps} REPS</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </div>
                </motion.div>
              ))}
              {(!workout.exercises || workout.exercises.length === 0) && (
                <div className="py-12 glass-card rounded-[2rem] border-dashed border-white/10 flex flex-col items-center justify-center opacity-30">
                  <Info className="w-8 h-8 mb-4" />
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em]">DYNAMIC_LOAD_ADAPTATION: PENDING</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Operation Execution */}
        <section className="pt-20 pb-32">
          <div className="max-w-md mx-auto space-y-4">
            {!workout.isCompleted && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-20 rounded-[2.5rem] bg-primary text-black font-display font-bold text-xl uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(142,214,63,0.3)] hover:neon-glow transition-all flex items-center justify-center gap-4 border-none outline-none"
                onClick={() => setLocation(`/workout/${workout.id}/start`)}
              >
                <Zap className="w-6 h-6" />
                INITIATE_SESSION
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full h-16 rounded-[1.8rem] font-display font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 border outline-none",
                workout.isCompleted
                  ? "bg-white/5 border-white/10 text-white/40 hover:text-white"
                  : "bg-white/5 border-white/5 text-white/20 hover:text-white hover:border-white/20"
              )}
              onClick={() => completeWorkout({ id: workout.id, isCompleted: !workout.isCompleted, date: dateStr })}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : workout.isCompleted ? (
                <>
                  <RefreshCw className="w-5 h-5" />
                  RE-ACTIVE_PROTOCOL
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  MARK_AS_SYNTHESIZED
                </>
              )}
            </motion.button>
          </div>
        </section>
      </main>
    </div>
  );
}
