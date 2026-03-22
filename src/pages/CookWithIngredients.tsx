import { Link } from "wouter";
import { PageLayout } from "@/components/PageLayout";

export default function CookWithIngredients() {
  return (
    <PageLayout
      maxWidth="md"
      header={
        <div className="space-y-2">
          <div className="section-label">Kitchen</div>
          <h1 className="font-display text-3xl">Cook With Ingredients</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Build meals around what you already have.
          </p>
        </div>
      }
    >
      <div className="wellness-card p-6 space-y-4">
        <p style={{ color: "var(--text-secondary)" }}>
          This route is now live and ready for the fuller ingredient-driven cooking flow.
        </p>
        <div className="wave-divider" />
        <Link href="/meals">
          <button className="btn-primary">Back To Meals</button>
        </Link>
      </div>
    </PageLayout>
  );
}
