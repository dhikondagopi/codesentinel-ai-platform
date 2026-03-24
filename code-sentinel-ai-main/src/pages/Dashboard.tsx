import { useDashboard } from "@/hooks/useDashboard";

export default function Dashboard() {
  const { stats, loading } = useDashboard();

  // ⭐ proper loader
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Repositories" value={stats.repoCount} />
        <StatCard title="Issues" value={stats.totalIssues} />
        <StatCard title="Critical Issues" value={stats.criticalIssues} />
        <StatCard title="Total Scans" value={stats.totalScans} />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) {
  return (
    <div className="p-4 bg-card border border-border rounded-xl shadow-sm">
      <p className="text-muted-foreground text-sm">{title}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}