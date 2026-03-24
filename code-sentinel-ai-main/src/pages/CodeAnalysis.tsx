import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder, File, ChevronRight, ChevronDown, Code2, GitBranch,
  Layers, Network, Loader2, Play, AlertTriangle, CheckCircle2, Info, Search, X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useRepositories, Repository } from "@/hooks/useRepositories";
import { useCodeAnalysis } from "@/hooks/useCodeAnalysis";
import DependencyGraph from "@/components/DependencyGraph";


interface TreeNode {
  path: string;
  type: "blob" | "tree";
  url?: string;
}

const severityIcon = {
  critical: <AlertTriangle className="h-3.5 w-3.5 text-destructive" />,
  warning: <AlertTriangle className="h-3.5 w-3.5 text-warning" />,
  info: <Info className="h-3.5 w-3.5 text-info" />,
};

const severityColor = {
  critical: "text-destructive border-destructive/30 bg-destructive/10",
  warning: "text-warning border-warning/30 bg-warning/10",
  info: "text-info border-info/30 bg-info/10",
};

export default function CodeAnalysis() {
  const { repos, loading: reposLoading } = useRepositories();
  const { analyze, loading: analyzing, result } = useCodeAnalysis();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [fileLoading, setFileLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<Set<string>>(new Set(["critical", "warning", "info"]));
  const [issueSearch, setIssueSearch] = useState("");

  const selectedRepo = repos.find((r) => r.id === selectedRepoId);

  // Fetch repo tree from GitHub when repo selected
  useEffect(() => {
    if (!selectedRepo) {
      setTree([]);
      return;
    }
    const fetchTree = async () => {
      setTreeLoading(true);
      setSelectedFile(null);
      setFileContent("");
      try {
        const res = await fetch(
          `https://api.github.com/repos/${selectedRepo.full_name}/git/trees/${selectedRepo.default_branch}?recursive=1`,
          { headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "CodeSentinel-AI" } }
        );
        if (!res.ok) throw new Error("Failed to fetch tree");
        const data = await res.json();
        setTree(
          (data.tree || [])
            .filter((n: any) => n.type === "blob" || n.type === "tree")
            .slice(0, 500) // limit for performance
        );
      } catch {
        setTree([]);
      } finally {
        setTreeLoading(false);
      }
    };
    fetchTree();
  }, [selectedRepo]);

  // Fetch file content when file selected
  useEffect(() => {
    if (!selectedFile || !selectedRepo) return;
    const fetchFile = async () => {
      setFileLoading(true);
      try {
        const res = await fetch(
          `https://raw.githubusercontent.com/${selectedRepo.full_name}/${selectedRepo.default_branch}/${selectedFile}`
        );
        if (!res.ok) throw new Error("Failed to fetch file");
        const text = await res.text();
        setFileContent(text.slice(0, 10000)); // limit for display
      } catch {
        setFileContent("// Could not load file content");
      } finally {
        setFileLoading(false);
      }
    };
    fetchFile();
  }, [selectedFile, selectedRepo]);

  // Auto-scroll to results when analysis completes
  useEffect(() => {
    if (result && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
  }, [result]);

  const handleAnalyze = () => {
    if (!fileContent || !selectedRepoId) return;
    const ext = selectedFile?.split(".").pop() || "";
    const langMap: Record<string, string> = {
      ts: "TypeScript", tsx: "TypeScript", js: "JavaScript", jsx: "JavaScript",
      py: "Python", rs: "Rust", go: "Go", java: "Java", rb: "Ruby", css: "CSS",
    };
    analyze(fileContent, selectedRepoId, langMap[ext] || ext);
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  // Build folder structure for rendering
  const renderTree = () => {
    const folders = new Map<string, TreeNode[]>();
    const rootItems: TreeNode[] = [];

    tree.forEach((node) => {
      const parts = node.path.split("/");
      if (parts.length === 1) {
        rootItems.push(node);
      } else {
        const parent = parts.slice(0, -1).join("/");
        if (!folders.has(parent)) folders.set(parent, []);
        folders.get(parent)!.push(node);
      }
    });

    // Get top-level folders
    const topFolders = new Set<string>();
    tree.forEach((n) => {
      const first = n.path.split("/")[0];
      if (n.path.includes("/")) topFolders.add(first);
    });

    const renderFolder = (folderPath: string, depth: number) => {
      const isExpanded = expandedFolders.has(folderPath);
      const children = folders.get(folderPath) || [];
      const subFolders = new Set<string>();
      children.forEach((c) => {
        const rel = c.path.slice(folderPath.length + 1);
        if (rel.includes("/")) subFolders.add(folderPath + "/" + rel.split("/")[0]);
      });
      const directFiles = children.filter((c) => !c.path.slice(folderPath.length + 1).includes("/"));

      return (
        <div key={folderPath}>
          <div
            onClick={() => toggleFolder(folderPath)}
            className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted cursor-pointer text-foreground"
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            <Folder className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-mono truncate">{folderPath.split("/").pop()}</span>
          </div>
          {isExpanded && (
            <>
              {[...subFolders].sort().map((sf) => renderFolder(sf, depth + 1))}
              {directFiles
                .filter((f) => f.type === "blob")
                .sort((a, b) => a.path.localeCompare(b.path))
                .map((f) => (
                  <div
                    key={f.path}
                    onClick={() => setSelectedFile(f.path)}
                    className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer text-xs font-mono truncate ${
                      selectedFile === f.path ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
                    }`}
                    style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
                  >
                    <File className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{f.path.split("/").pop()}</span>
                  </div>
                ))}
            </>
          )}
        </div>
      );
    };

    return (
      <>
        {[...topFolders].sort().map((f) => renderFolder(f, 0))}
        {rootItems
          .filter((f) => f.type === "blob")
          .sort((a, b) => a.path.localeCompare(b.path))
          .map((f) => (
            <div
              key={f.path}
              onClick={() => setSelectedFile(f.path)}
              className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer text-xs font-mono ${
                selectedFile === f.path ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <File className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{f.path}</span>
            </div>
          ))}
      </>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header with repo selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Code Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select a repository and file to analyze
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedRepoId} onValueChange={setSelectedRepoId}>
            <SelectTrigger className="w-[260px] bg-card border-border">
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
            onClick={handleAnalyze}
            disabled={!fileContent || analyzing || !selectedRepoId}
            className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Analyze
          </Button>
        </div>
      </div>

      {/* No repos state */}
      {!reposLoading && repos.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <GitBranch className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No repositories imported</p>
          <p className="text-sm text-muted-foreground mt-1">
            Go to Repositories to import a GitHub repo first.
          </p>
        </div>
      )}

      {/* Main content */}
      {selectedRepo && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File Explorer */}
          <div className="rounded-lg border border-border bg-card p-4 max-h-[400px] overflow-y-auto">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Folder className="h-4 w-4 text-primary" />
              {selectedRepo.full_name}
              <Badge variant="outline" className="text-[10px] ml-auto">{selectedRepo.default_branch}</Badge>
            </h3>
            {treeLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-0.5">{renderTree()}</div>
            )}
          </div>

          {/* Code Preview */}
          <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4 max-h-[400px] overflow-y-auto">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              {selectedFile ? (
                <span className="font-mono text-xs truncate">{selectedFile}</span>
              ) : (
                <span className="text-muted-foreground">Select a file to preview</span>
              )}
            </h3>
            {fileLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : fileContent ? (
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 rounded p-3 overflow-x-auto">
                {fileContent}
              </pre>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Click a file in the tree to preview its contents
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analysis Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Quality Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Quality Score
                </h3>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-foreground">{result.quality.overall_score}</div>
                    <div className="text-xs text-muted-foreground mt-1">Overall</div>
                  </div>
                  <div className="flex-1 space-y-2 text-xs">
                    {[
                      { label: "Maintainability", value: result.quality.maintainability },
                      { label: "Reliability", value: result.quality.reliability },
                      { label: "Security", value: result.quality.security },
                      { label: "Performance", value: result.quality.performance },
                    ].map((m) => (
                      <div key={m.label} className="flex items-center gap-2">
                        <span className="text-muted-foreground w-24">{m.label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${m.value}%` }}
                            transition={{ duration: 0.6 }}
                          />
                        </div>
                        <span className="text-foreground font-medium w-6 text-right">{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" /> Summary
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-destructive">
                      {result.issues.filter((i) => i.severity === "critical").length}
                    </div>
                    <div className="text-xs text-muted-foreground">Critical</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-warning">
                      {result.issues.filter((i) => i.severity === "warning").length}
                    </div>
                    <div className="text-xs text-muted-foreground">Warnings</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-info">
                      {result.issues.filter((i) => i.severity === "info").length}
                    </div>
                    <div className="text-xs text-muted-foreground">Info</div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground text-center">
                  Analyzed in {(result.duration_ms / 1000).toFixed(1)}s
                </div>
              </div>
            </div>

            {/* Issues List */}
            {result.issues.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-primary" /> Issues ({result.issues.length})
                </h3>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    {(["critical", "warning", "info"] as const).map((sev) => {
                      const active = severityFilter.has(sev);
                      const colors = {
                        critical: active ? "bg-destructive/20 text-destructive border-destructive/40" : "bg-muted/30 text-muted-foreground border-border",
                        warning: active ? "bg-warning/20 text-warning border-warning/40" : "bg-muted/30 text-muted-foreground border-border",
                        info: active ? "bg-info/20 text-info border-info/40" : "bg-muted/30 text-muted-foreground border-border",
                      };
                      const count = result.issues.filter((i) => i.severity === sev).length;
                      return (
                        <button
                          key={sev}
                          onClick={() => setSeverityFilter((prev) => {
                            const next = new Set(prev);
                            next.has(sev) ? next.delete(sev) : next.add(sev);
                            return next;
                          })}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${colors[sev]}`}
                        >
                          {sev === "critical" && <AlertTriangle className="h-3 w-3" />}
                          {sev === "warning" && <AlertTriangle className="h-3 w-3" />}
                          {sev === "info" && <Info className="h-3 w-3" />}
                          {sev} ({count})
                        </button>
                      );
                    })}
                  </div>
                  <div className="relative flex-1 w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search issues..."
                      value={issueSearch}
                      onChange={(e) => setIssueSearch(e.target.value)}
                      className="pl-8 pr-8 h-8 text-xs bg-muted/30 border-border"
                    />
                    {issueSearch && (
                      <button onClick={() => setIssueSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filtered Issues */}
                {(() => {
                  const filtered = result.issues.filter((issue) => {
                    if (!severityFilter.has(issue.severity)) return false;
                    if (issueSearch) {
                      const q = issueSearch.toLowerCase();
                      return (
                        issue.title.toLowerCase().includes(q) ||
                        (issue.description?.toLowerCase().includes(q)) ||
                        (issue.suggestion?.toLowerCase().includes(q)) ||
                        issue.category.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No issues match your filters
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {filtered.length < result.issues.length && (
                        <p className="text-xs text-muted-foreground">
                          Showing {filtered.length} of {result.issues.length} issues
                        </p>
                      )}
                      {filtered.map((issue, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="rounded-md border border-border bg-muted/30 p-4"
                        >
                          <div className="flex items-start gap-3">
                            {severityIcon[issue.severity]}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-foreground">{issue.title}</span>
                                <Badge className={`text-[10px] ${severityColor[issue.severity]}`}>
                                  {issue.severity}
                                </Badge>
                                <Badge variant="outline" className="text-[10px]">{issue.category}</Badge>
                                {issue.line_start && (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    line {issue.line_start}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{issue.description}</p>
                              {issue.suggestion && (
                                <p className="text-xs text-primary/80 mt-2 italic">💡 {issue.suggestion}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Architecture graph (always visible when repo selected) */}
      {selectedRepo && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" /> Architecture & Dependency Graph
          </h3>
          <DependencyGraph />
        </div>
      )}
    </div>
  );
}
