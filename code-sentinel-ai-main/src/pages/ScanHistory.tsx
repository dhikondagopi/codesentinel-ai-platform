import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, formatDistanceToNow, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { Activity, Code2, Shield, Loader2, Filter, Calendar as CalendarIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ScanRow {
  id: string;
  scan_type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  total_issues: number | null;
  critical_count: number | null;
  warning_count: number | null;
  info_count: number | null;
  duration_ms: number | null;
  repository_id: string;
  repo_name: string;
}

const typeConfig: Record<string, { icon: typeof Code2; label: string; color: string }> = {
  ai_analysis: { icon: Code2, label: "Code Analysis", color: "text-primary" },
  security_scan: { icon: Shield, label: "Security Scan", color: "text-warning" },
  full: { icon: Activity, label: "Full Scan", color: "text-muted-foreground" },
};

export default function ScanHistory() {
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [repos, setRepos] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [scanType, setScanType] = useState<string>("all");
  const [repoFilter, setRepoFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [scansRes, reposRes] = await Promise.all([
        supabase
          .from("scan_results")
          .select("id, scan_type, status, created_at, completed_at, total_issues, critical_count, warning_count, info_count, duration_ms, repository_id, repositories(name)")
          .order("created_at", { ascending: false }),
        supabase.from("repositories").select("id, name").order("name"),
      ]);

      setRepos((reposRes.data || []) as any[]);
      setScans(
        ((scansRes.data || []) as any[]).map((s: any) => ({
          ...s,
          repo_name: s.repositories?.name || "Unknown",
        }))
      );
      setLoading(false);
    })();
  }, [user]);

  const filtered = useMemo(() => {
    return scans.filter((s) => {
      if (scanType !== "all" && s.scan_type !== scanType) return false;
      if (repoFilter !== "all" && s.repository_id !== repoFilter) return false;
      if (dateFrom && isBefore(new Date(s.created_at), startOfDay(dateFrom))) return false;
      if (dateTo && isAfter(new Date(s.created_at), endOfDay(dateTo))) return false;
      return true;
    });
  }, [scans, scanType, repoFilter, dateFrom, dateTo]);

  const hasFilters = scanType !== "all" || repoFilter !== "all" || dateFrom || dateTo;

  const clearFilters = () => {
    setScanType("all");
    setRepoFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Scan History</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse and filter all past scans</p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filters</span>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto h-7 text-xs text-muted-foreground">
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Scan Type */}
          <Select value={scanType} onValueChange={setScanType}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue placeholder="Scan type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="ai_analysis">Code Analysis</SelectItem>
              <SelectItem value="security_scan">Security Scan</SelectItem>
              <SelectItem value="full">Full Scan</SelectItem>
            </SelectContent>
          </Select>

          {/* Repository */}
          <Select value={repoFilter} onValueChange={setRepoFilter}>
            <SelectTrigger className="w-[200px] h-9 text-sm">
              <SelectValue placeholder="Repository" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All repositories</SelectItem>
              {repos.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date From */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[150px] h-9 justify-start text-left text-sm font-normal", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>

          {/* Date To */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[150px] h-9 justify-start text-left text-sm font-normal", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">{filtered.length} scan{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No scans match your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            <AnimatePresence>
              {filtered.map((scan, i) => {
                const config = typeConfig[scan.scan_type] || typeConfig.full;
                const ScanIcon = config.icon;
                return (
                  <motion.div
                    key={scan.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ScanIcon className={`h-4 w-4 shrink-0 ${config.color}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-medium truncate">{scan.repo_name}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">{config.label}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(scan.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {scan.duration_ms !== null && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">{(scan.duration_ms / 1000).toFixed(1)}s</span>
                      )}
                      <div className="flex gap-1.5 text-xs">
                        {(scan.critical_count ?? 0) > 0 && (
                          <span className="text-destructive font-medium">{scan.critical_count} critical</span>
                        )}
                        {(scan.warning_count ?? 0) > 0 && (
                          <span className="text-warning font-medium">{scan.warning_count} warn</span>
                        )}
                        {scan.total_issues !== null && (scan.critical_count ?? 0) === 0 && (scan.warning_count ?? 0) === 0 && (
                          <span className="text-muted-foreground">{scan.total_issues} issues</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground hidden md:inline">
                        {formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        scan.status === "completed" ? "bg-success/10 text-success" :
                        scan.status === "failed" ? "bg-destructive/10 text-destructive" :
                        "bg-warning/10 text-warning"
                      }`}>
                        {scan.status}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
