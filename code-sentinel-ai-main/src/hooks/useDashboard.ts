import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStats {
  repoCount: number;
  totalIssues: number;
  criticalIssues: number;
  totalScans: number;
  latestScore: number | null;
  scoreBreakdown: {
    maintainability: number;
    reliability: number;
    security: number;
    performance: number;
  } | null;
  recentScans: any[];
  recentIssues: any[];
}

const defaults: DashboardStats = {
  repoCount: 0,
  totalIssues: 0,
  criticalIssues: 0,
  totalScans: 0,
  latestScore: null,
  scoreBreakdown: null,
  recentScans: [],
  recentIssues: [],
};

export function useDashboard() {
  const { user, loading: authLoading } = useAuth();

  const [stats, setStats] = useState<DashboardStats>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      if (authLoading) return;

      if (!user) {
        if (mounted) {
          setStats(defaults);
          setLoading(false);
        }
        return;
      }

      try {
        if (mounted) setLoading(true);

        // ⭐ SAFE PARALLEL REQUESTS (no crash if table missing)
        const results = await Promise.allSettled([
          supabase.from("repositories").select("id"),
          supabase.from("detected_issues").select("severity"),
          supabase
            .from("scan_results")
            .select("id,status,created_at,total_issues,scan_type")
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("quality_scores")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1),
          supabase
            .from("detected_issues")
            .select(
              "id,title,severity,file_path,line_start,description"
            )
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        if (!mounted) return;

        const repos =
          results[0].status === "fulfilled"
            ? results[0].value.data || []
            : [];

        const issues =
          results[1].status === "fulfilled"
            ? results[1].value.data || []
            : [];

        const scans =
          results[2].status === "fulfilled"
            ? results[2].value.data || []
            : [];

        const scores =
          results[3].status === "fulfilled"
            ? results[3].value.data || []
            : [];

        const recentIssues =
          results[4].status === "fulfilled"
            ? results[4].value.data || []
            : [];

        const criticalCount = issues.filter(
          (i: any) => i.severity === "critical"
        ).length;

        const latestScore = scores[0];

        setStats({
          repoCount: repos.length,
          totalIssues: issues.length,
          criticalIssues: criticalCount,
          totalScans: scans.length,
          latestScore: latestScore?.overall_score ?? null,
          scoreBreakdown: latestScore
            ? {
                maintainability: latestScore.maintainability ?? 0,
                reliability: latestScore.reliability ?? 0,
                security: latestScore.security ?? 0,
                performance: latestScore.performance ?? 0,
              }
            : null,
          recentScans: scans,
          recentIssues: recentIssues,
        });

        setLoading(false);
      } catch (err) {
        console.log("Dashboard safe fallback", err);
        if (mounted) {
          setStats(defaults);
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  return { stats, loading };
}