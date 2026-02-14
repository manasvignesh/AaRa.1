import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";

import Landing from "@/pages/Landing";
import AuthPage from "@/pages/AuthPage";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import ProgressTracker from "@/pages/ProgressTracker";
import MealDetail from "@/pages/MealDetail";
import MealsPage from "@/pages/MealsPage";
import WorkoutDetail from "@/pages/WorkoutDetail";
import WorkoutExecution from "@/pages/WorkoutExecution";
import WorkoutsPage from "@/pages/WorkoutsPage";
import CoachPage from "@/pages/CoachPage";
import WeightLog from "@/pages/WeightLog";
import LogManualMeal from "@/pages/LogManualMeal";
import WalkRunPage from "@/pages/WalkRunPage";
import NotFound from "@/pages/not-found";

import { CoachProvider } from "@/hooks/use-coach-chat";
import { CoachFAB } from "@/components/CoachFAB";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeWrapper } from "@/components/ThemeWrapper";

// Protected Route Wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const [, setLocation] = useLocation();

  // If authenticated but no profile, force Onboarding
  useEffect(() => {
    if (!authLoading && !profileLoading && isAuthenticated && profile === null && window.location.pathname !== "/onboarding") {
      console.log("ProtectedRoute: No profile found, redirecting to onboarding");
      setLocation("/onboarding");
    }
  }, [authLoading, profileLoading, isAuthenticated, profile, setLocation]);

  console.log(`[ProtectedRoute] STATE: authLoading=${authLoading}, profileLoading=${profileLoading}, isAuthenticated=${isAuthenticated}, profileExists=${!!profile}`);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
          <div className="h-full w-full" style={{ backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="flex flex-col items-center gap-8 relative z-10 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-16 h-16 rounded-full border-2 border-primary border-t-transparent shadow-[0_0_20px_rgba(142,214,63,0.3)]"
          />
          <div>
            <p className="text-[10px] font-mono text-primary font-bold uppercase tracking-[0.4em] animate-pulse">Establishing_Secure_Link</p>
            <p className="text-[8px] font-mono text-white/20 uppercase tracking-[0.2em] mt-2">Auth_Node: {authLoading ? "SCANNING" : "VERIFIED"} // Profile_Node: {profileLoading ? "SCANNING" : "VERIFIED"}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (profile === null && window.location.pathname !== "/onboarding") {
    return null;
  }

  // If authenticated AND has profile, but trying to access Onboarding, redirect to Dashboard
  if (profile && window.location.pathname === "/onboarding") {
    setLocation("/dashboard");
    return null;
  }

  return <Component />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const publicPaths = ["/", "/auth"];
    if (!isLoading && !isAuthenticated && !publicPaths.includes(window.location.pathname)) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) return null;

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated ? (
          <ProtectedRoute component={Dashboard} />
        ) : (
          <Landing />
        )}
      </Route>

      <Route path="/auth">
        {isAuthenticated ? (
          <ProtectedRoute component={Dashboard} />
        ) : (
          <AuthPage />
        )}
      </Route>

      {/* Auth Protected Routes */}
      <Route path="/onboarding">
        <ProtectedRoute component={Onboarding} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/progress">
        <ProtectedRoute component={ProgressTracker} />
      </Route>
      <Route path="/meals">
        <ProtectedRoute component={MealsPage} />
      </Route>
      <Route path="/workouts">
        <ProtectedRoute component={WorkoutsPage} />
      </Route>
      <Route path="/coach">
        <ProtectedRoute component={CoachPage} />
      </Route>
      <Route path="/weight/log">
        <ProtectedRoute component={WeightLog} />
      </Route>
      <Route path="/meal/:date/:id">
        <ProtectedRoute component={MealDetail} />
      </Route>
      <Route path="/workout/:id">
        <ProtectedRoute component={WorkoutDetail} />
      </Route>
      <Route path="/workout/:id/start">
        <ProtectedRoute component={WorkoutExecution} />
      </Route>
      <Route path="/log-meal">
        <ProtectedRoute component={LogManualMeal} />
      </Route>
      <Route path="/walk-run">
        <ProtectedRoute component={WalkRunPage} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CoachProvider>
          <ThemeWrapper>
            <Router />
          </ThemeWrapper>
          <CoachFAB />
          <Toaster />
        </CoachProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
