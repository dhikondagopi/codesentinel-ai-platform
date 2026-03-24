import { useState, useEffect } from "react";
import { IssueCard } from "@/components/IssueCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCodeAnalysis } from "@/hooks/useCodeAnalysis";
import { useRepositories } from "@/hooks/useRepositories";
import { useAuth } from "@/contexts/AuthContext";
import { Play, Loader2, Sparkles, Shield, Gauge, Wrench, BarChart3, GitBranch, File } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEMO_REPO_ID = "00000000-0000-0000-0000-000000000000";

const sampleCode = `import express from 'express';
const app = express();

app.get('/users/:id', async (req, res) => {
  const query = "SELECT * FROM users WHERE id = " + req.params.id;
  const result = await db.query(query);
  console.log("User data:", result);
  res.json(result);
});

app.post('/upload', (req, res) => {
  const file = req.body.file;
  eval(file.content);
  res.send("OK");
});

app.listen(3000);`;

interface RepoFile {
  path: string;
  type: string;
}

export default function BugDetection() {
  const [mode, setMode] = useState<"paste" | "repo">("paste");
  const [code, setCode] = useState(sampleCode);
  const [language, setLanguage] = useState("typescript");
  const { analyze, loading, result } = useCodeAnalysis();
  const { repos, loading: reposLoading } = useRepositories();
  const { user } = useAuth();

  // Repo mode state
  const [selectedRepoId, setSelectedRepoId] = useState("");
  const [repoFiles, setRepoFiles] = useState<RepoFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [fileLoading, setFileLoading] = useState(false);

  const selectedRepo = repos.find((r) => r.id === selectedRepoId);

  // Fetch file list when repo selected
  useEffect(() => {
    if (!selectedRepo) { setRepoFiles([]); return; }
    const fetchFiles = async () => {
      setFilesLoading(true);
      setSelectedFile("");
      setFileContent("");
      try {
        const res = await fetch(
          `https://api.github.com/repos/${selectedRepo.full_name}/git/trees/${selectedRepo.default_branch}?recursive=1`,
          { headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "CodeSentinel-AI" } }
        );
        if (!res.ok) { await res.text(); throw new Error("Failed"); }
        const data = await res.json();
        const codeExts = /\.(ts|tsx|js|jsx|py|go|rs|java|rb|c|cpp|h|cs|php|swift|kt|scala|sh|sql|html|css|scss)$/i;
        setRepoFiles(
          (data.tree || [])
            .filter((n: any) => n.type === "blob" && codeExts.test(n.path))
            .slice(0, 300)
        );
      } catch {
        setRepoFiles([]);
      } finally {
        setFilesLoading(false);
      }
    };
    fetchFiles();
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
        if (!res.ok) throw new Error("Failed");
        const text = await res.text();
        setFileContent(text.slice(0, 10000));

        // Auto-detect language
        const ext = selectedFile.split(".").pop() || "";
        const langMap: Record<string, string> = {
          ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
          py: "python", go: "go", rs: "rust", java: "java", rb: "ruby",
        };
        if (langMap[ext]) setLanguage(langMap[ext]);
      } catch {
        setFileContent("// Could not load file");
      } finally {
        setFileLoading(false);
      }
    };
    fetchFile();
  }, [selectedFile, selectedRepo]);

  const handleScan = () => {
    const codeToAnalyze = mode === "repo" ? fileContent : code;
    const repoId = mode === "repo" ? selectedRepoId : DEMO_REPO_ID;
    if (!codeToAnalyze.trim()) return;
    analyze(codeToAnalyze, repoId, language);
  };

  const currentCode = mode === "repo" ? fileContent : code;
  const canScan = currentCode.trim().length > 0 && !loading;
  const issues = result?.issues || [];
  const quality = result?.quality;
  const critical = issues.filter(i => i.severity === "critical").length;
  const warnings = issues.filter(i => i.severity === "warning").length;
  const info = issues.filter(i => i.severity === "info").length;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Bug Detection</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered code analysis</p>
        </div>
      </div>

      {/* Mode tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as "paste" | "repo")}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="paste" className="gap-2 text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Paste Code
          </TabsTrigger>
          <TabsTrigger value="repo" className="gap-2 text-xs">
            <GitBranch className="h-3.5 w-3.5" /> From Repository
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Code input area */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {mode === "paste" ? "Code Input" : "Repository File"}
          </h3>
          <div className="flex gap-2 flex-wrap">
            {mode === "repo" && (
              <>
                <Select value={selectedRepoId} onValueChange={setSelectedRepoId}>
                  <SelectTrigger className="w-[200px] h-8 text-xs bg-secondary border-border">
                    <SelectValue placeholder="Select repo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {repos.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        <span className="font-mono text-xs">{r.full_name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {repoFiles.length > 0 && (
                  <Select value={selectedFile} onValueChange={setSelectedFile}>
                    <SelectTrigger className="w-[240px] h-8 text-xs bg-secondary border-border">
                      <SelectValue placeholder="Select file..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {repoFiles.map((f) => (
                        <SelectItem key={f.path} value={f.path}>
                          <span className="font-mono text-xs truncate">{f.path}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </>
            )}
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[120px] h-8 text-xs bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="go">Go</SelectItem>
                <SelectItem value="rust">Rust</SelectItem>
                <SelectItem value="java">Java</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleScan}
              disabled={!canScan}
              className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              {loading ? "Analyzing…" : "Run Scan"}
            </Button>
          </div>
        </div>

        {mode === "paste" ? (
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code here…"
            className="min-h-[200px] font-mono text-xs bg-secondary border-border resize-y"
          />
        ) : fileLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : fileContent ? (
          <pre className="min-h-[200px] max-h-[400px] overflow-auto font-mono text-xs bg-secondary border border-border rounded-md p-3 text-muted-foreground whitespace-pre-wrap">
            {fileContent}
          </pre>
        ) : (
          <div className="min-h-[200px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
            <File className="h-8 w-8" />
            <p>{selectedRepoId ? "Select a file to scan" : "Select a repository first"}</p>
            {!reposLoading && repos.length === 0 && (
              <p className="text-xs">No repos imported yet — go to Repositories to add one.</p>
            )}
          </div>
        )}
      </div>

      {/* Quality scores */}
      <AnimatePresence>
        {quality && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-3"
          >
            {[
              { label: "Overall", value: quality.overall_score, icon: BarChart3 },
              { label: "Maintainability", value: quality.maintainability, icon: Wrench },
              { label: "Reliability", value: quality.reliability, icon: Gauge },
              { label: "Security", value: quality.security, icon: Shield },
              { label: "Performance", value: quality.performance, icon: Gauge },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-card p-3 text-center">
                <s.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className={`text-lg font-bold ${s.value >= 70 ? "text-success" : s.value >= 40 ? "text-warning" : "text-destructive"}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Issue summary badges */}
      {issues.length > 0 && (
        <div className="flex gap-3 items-center">
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">{critical} Critical</Badge>
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">{warnings} Warnings</Badge>
          <Badge variant="outline" className="bg-info/10 text-info border-info/20">{info} Info</Badge>
          {result?.duration_ms && (
            <span className="text-[10px] text-muted-foreground ml-auto">Scanned in {(result.duration_ms / 1000).toFixed(1)}s</span>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="rounded-lg border border-border bg-card p-8 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">AI is analyzing your code…</p>
        </div>
      )}

      {/* Issues list */}
      <AnimatePresence>
        {issues.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {issues.map((issue, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <IssueCard
                  title={issue.title}
                  file={mode === "repo" && selectedFile ? selectedFile : "input"}
                  line={issue.line_start || 0}
                  severity={issue.severity}
                  description={issue.description}
                  snippet={issue.suggestion}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!loading && !result && (
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {mode === "paste"
              ? <>Paste code above and click <strong>Run Scan</strong> to detect bugs with AI</>
              : <>Select a repository and file, then click <strong>Run Scan</strong></>
            }
          </p>
        </div>
      )}
    </div>
  );
}
