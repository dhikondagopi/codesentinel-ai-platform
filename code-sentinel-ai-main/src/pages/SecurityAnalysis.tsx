import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, AlertTriangle, Eye, Play, Loader2, File, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRepositories } from "@/hooks/useRepositories";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Vulnerability {
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  line_start?: number;
  remediation: string;
  cwe_id?: string;
}

interface SecurityResult {
  vulnerabilities: Vulnerability[];
  risk_score: number;
  summary: string;
  duration_ms: number;
  scan_id: string | null;
}

const severityConfig = {
  critical: { icon: AlertTriangle, class: "bg-destructive/10 text-destructive border-destructive/20", label: "Critical" },
  high: { icon: Shield, class: "bg-destructive/10 text-destructive border-destructive/20", label: "High" },
  medium: { icon: Eye, class: "bg-warning/10 text-warning border-warning/20", label: "Medium" },
  low: { icon: Lock, class: "bg-info/10 text-info border-info/20", label: "Low" },
};

export default function SecurityAnalysis() {
  const { repos, loading: reposLoading } = useRepositories();
  const { toast } = useToast();
  const [selectedRepoId, setSelectedRepoId] = useState("");
  const [tree, setTree] = useState<Array<{ path: string; type: string }>>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<SecurityResult | null>(null);

  const selectedRepo = repos.find((r) => r.id === selectedRepoId);

  useEffect(() => {
    if (!selectedRepo) { setTree([]); return; }
    (async () => {
      setTreeLoading(true);
      setSelectedFile(null);
      setResult(null);
      try {
        const res = await fetch(
          `https://api.github.com/repos/${selectedRepo.full_name}/git/trees/${selectedRepo.default_branch}?recursive=1`,
          { headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "CodeSentinel-AI" } }
        );
        const data = await res.json();
        const codeFiles = (data.tree || []).filter((n: any) =>
          n.type === "blob" && /\.(ts|tsx|js|jsx|py|rs|go|java|rb|php|sql)$/.test(n.path)
        ).slice(0, 200);
        setTree(codeFiles);
      } catch { setTree([]); }
      finally { setTreeLoading(false); }
    })();
  }, [selectedRepo]);

  const handleScan = async () => {
    if (!selectedFile || !selectedRepo) return;
    setScanning(true);
    setResult(null);
    try {
      const fileRes = await fetch(
        `https://raw.githubusercontent.com/${selectedRepo.full_name}/${selectedRepo.default_branch}/${selectedFile}`
      );
      const code = await fileRes.text();
      const ext = selectedFile.split(".").pop() || "";
      const langMap: Record<string, string> = {
        ts: "TypeScript", tsx: "TypeScript", js: "JavaScript", jsx: "JavaScript",
        py: "Python", rs: "Rust", go: "Go", java: "Java", rb: "Ruby", php: "PHP", sql: "SQL",
      };

      const { data, error } = await supabase.functions.invoke("security-scan", {
        body: { code: code.slice(0, 10000), language: langMap[ext] || ext, file_path: selectedFile, repository_id: selectedRepoId },
      });

      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      if (data?.error) { toast({ title: "Error", description: data.error, variant: "destructive" }); return; }

      setResult(data as SecurityResult);
      toast({
        title: "Security Scan Complete",
        description: `Found ${data.vulnerabilities.length} vulnerabilities (risk: ${data.risk_score}/100)`,
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setScanning(false); }
  };

  const metrics = result ? [
    { label: "Critical", count: result.vulnerabilities.filter(v => v.severity === "critical").length, icon: AlertTriangle, color: "text-destructive" },
    { label: "High", count: result.vulnerabilities.filter(v => v.severity === "high").length, icon: Shield, color: "text-destructive" },
    { label: "Medium", count: result.vulnerabilities.filter(v => v.severity === "medium").length, icon: Eye, color: "text-warning" },
    { label: "Low", count: result.vulnerabilities.filter(v => v.severity === "low").length, icon: Lock, color: "text-muted-foreground" },
  ] : null;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Security Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered vulnerability detection and remediation</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedRepoId} onValueChange={setSelectedRepoId}>
            <SelectTrigger className="w-[240px] bg-card border-border">
              <SelectValue placeholder="Select repository..." />
            </SelectTrigger>
            <SelectContent>
              {repos.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  <span className="font-mono text-xs">{r.full_name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleScan}
            disabled={!selectedFile || scanning}
            className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            {scanning ? "Scanning…" : "Run Security Scan"}
          </Button>
        </div>
      </div>

      {/* File picker */}
      {selectedRepo && (
        <div className="rounded-lg border border-border bg-card p-4 max-h-[300px] overflow-y-auto">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Folder className="h-4 w-4 text-primary" /> Select a file to scan
          </h3>
          {treeLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {tree.map((f) => (
                <div
                  key={f.path}
                  onClick={() => setSelectedFile(f.path)}
                  className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer text-xs font-mono truncate ${
                    selectedFile === f.path ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <File className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{f.path}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {metrics!.map((metric, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  className="rounded-lg border border-border bg-card p-4 text-center">
                  <metric.icon className={`h-5 w-5 mx-auto ${metric.color}`} />
                  <p className="text-2xl font-bold text-foreground mt-2">{metric.count}</p>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Risk score + summary */}
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-4 mb-3">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${result.risk_score >= 70 ? "text-destructive" : result.risk_score >= 40 ? "text-warning" : "text-success"}`}>
                    {result.risk_score}
                  </div>
                  <div className="text-xs text-muted-foreground">Risk Score</div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{result.summary}</p>
                  <p className="text-xs text-muted-foreground mt-1">Scanned in {(result.duration_ms / 1000).toFixed(1)}s</p>
                </div>
              </div>
            </div>

            {/* Vulnerabilities */}
            {result.vulnerabilities.length > 0 && (
              <div className="space-y-3">
                {result.vulnerabilities.map((vuln, i) => {
                  const config = severityConfig[vuln.severity];
                  const Icon = config.icon;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="rounded-lg border border-border bg-card p-4 hover:border-primary/20 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`rounded-md p-1.5 ${config.class}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-medium text-foreground">{vuln.title}</h4>
                            <Badge variant="outline" className={`text-[10px] ${config.class}`}>{config.label}</Badge>
                            <Badge variant="outline" className="text-[10px]">{vuln.category}</Badge>
                            {vuln.cwe_id && <span className="text-[10px] text-muted-foreground font-mono">{vuln.cwe_id}</span>}
                            {vuln.line_start && <span className="text-[10px] text-muted-foreground font-mono">line {vuln.line_start}</span>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{vuln.description}</p>
                          <p className="text-xs text-primary/80 mt-2 italic">💡 {vuln.remediation}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {result.vulnerabilities.length === 0 && (
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <Shield className="h-10 w-10 text-success mx-auto mb-3" />
                <p className="text-foreground font-medium">No vulnerabilities found!</p>
                <p className="text-sm text-muted-foreground mt-1">This file looks secure.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
