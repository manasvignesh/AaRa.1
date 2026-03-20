import { Loader2, Lock, SendHorizonal } from "lucide-react";

import { Navigation } from "@/components/Navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUserProfile } from "@/hooks/use-user";

export default function CoachPage() {
  const { isLoading: userLoading } = useUserProfile();

  if (userLoading) {
    return (
      <div className="page-transition flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="page-transition flex min-h-screen flex-col overflow-hidden">
      <main className="flex-1 px-5 pb-safe pt-8">
        <div className="mx-auto max-w-md space-y-5">
          <div className="animate-slide-up flex items-start justify-between">
            <div>
              <div className="section-label mb-2">Coach</div>
              <h1 className="font-display text-4xl">Neural Link</h1>
            </div>
            <ThemeToggle />
          </div>

          <div className="wellness-card stagger-1 rounded-[1.5rem] p-5">
            <div className="max-w-[85%] rounded-2xl bg-surface-3 px-4 py-3" style={{ color: "var(--text-primary)" }}>
              I can help you reflect on meals, training, and consistency patterns.
            </div>
          </div>

          <div className="wellness-card stagger-2 ml-auto max-w-[85%] rounded-[1.5rem] p-5">
            <div className="flex items-center gap-3">
              <div className="metric-card flex h-12 w-12 items-center justify-center p-0">
                <Lock className="h-5 w-5 text-brand" />
              </div>
              <div>
                <div className="section-label mb-1">Status</div>
                <p style={{ color: "var(--text-secondary)" }}>
                  Coach UI is redesigned and waiting on the existing backend flow.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel fixed bottom-24 left-0 right-0 mx-auto flex max-w-md items-center gap-3 rounded-2xl px-4 py-3">
            <input
              className="input-field border-0 bg-transparent p-0"
              placeholder="Ask AARA about meals, training, or recovery..."
              readOnly
            />
            <button className="btn-primary h-10 w-10 p-0">
              <SendHorizonal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>
      <Navigation />
    </div>
  );
}
