import { Link } from "wouter";
import { PageLayout } from "@/components/PageLayout";

export default function HostelMode() {
  return (
    <PageLayout
      maxWidth="md"
      header={
        <div className="space-y-2">
          <div className="section-label">Lifestyle</div>
          <h1 className="font-display text-3xl">Hostel Mode</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Support for mess meals, limited equipment, and simpler routines.
          </p>
        </div>
      }
    >
      <div className="wellness-card p-6 space-y-4">
        <p style={{ color: "var(--text-secondary)" }}>
          Hostel Mode now has a working destination in the router and can be expanded without breaking navigation.
        </p>
        <div className="wave-divider" />
        <Link href="/dashboard">
          <button className="btn-primary">Back To Dashboard</button>
        </Link>
      </div>
    </PageLayout>
  );
}
