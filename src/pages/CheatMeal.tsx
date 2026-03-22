import { Link } from "wouter";
import { PageLayout } from "@/components/PageLayout";

export default function CheatMeal() {
  return (
    <PageLayout
      maxWidth="md"
      header={
        <div className="space-y-2">
          <div className="section-label">Recovery</div>
          <h1 className="font-display text-3xl">Cheat Meal Help</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Quick recovery guidance after an off-plan meal.
          </p>
        </div>
      }
    >
      <div className="wellness-card p-6 space-y-4">
        <p style={{ color: "var(--text-secondary)" }}>
          This space is ready for the full cheat meal recovery flow. For now, head back to Coach or Meals and we can
          keep the navigation working cleanly.
        </p>
        <div className="wave-divider" />
        <div className="flex gap-3 flex-wrap">
          <Link href="/coach">
            <button className="btn-primary">Open Coach</button>
          </Link>
          <Link href="/meals">
            <button className="btn-ghost">Back To Meals</button>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
