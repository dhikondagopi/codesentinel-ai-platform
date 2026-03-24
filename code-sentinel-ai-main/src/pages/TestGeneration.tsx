import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TestTube2, CheckCircle2, XCircle, Clock, Play, Loader2, Copy, File, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRepositories } from "@/hooks/useRepositories";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TestCase {
  name: string;
  type: "happy_path" | "edge_case" | "error_handling";
}

interface TestSuite {
  function_name: string;
  file_path: string;
  test_code: string;
  tests: TestCase[];
}

interface TestResult {
  test_suites: TestSuite[];
  summary: string;
}

const typeIcon = { happy_path: CheckCircle2, edge_case: Clock, error_handling: XCircle };
const typeClass = { happy_path: "text-success", edge_case: "text-warning", error_handling: "text-destructive" };
const typeLabel = { happy_path: "Happy Path", edge_case: "Edge Case", error_handling: "Error Handling" };

export default function TestGeneration() {
  const { repos, loading: reposLoading } = useRepositories();
  const { toast } = useToast();
  const [selectedRepoId, setSelectedRepoId] = useState("");
  const [tree, setTree] = useState<Array<{ path: string; type: string }>>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [expandedSuite, setExpandedSuite] = useState<number | null>(null);

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
          n.type === "blob" && /\.(ts|tsx|js|jsx|py|rs|go|java|rb)$/.test(n.path)
        ).slice(0, 200);
        setTree(codeFiles);
      } catch { setTree([]); }
      finally { setTreeLoading(false); }
    })();
  }, [selectedRepo]);

  const handleGenerate = async () => {
    if (!selectedFile || !selectedRepo) return;
    setGenerating(true);
    setResult(null);
    try {
      const fileRes = await fetch(
        `https://raw.githubusercontent.com/${selectedRepo.full_name}/${selectedRepo.default_branch}/${selectedFile}`
      );
      const code = await fileRes.text();
      const ext = selectedFile.split(".").pop() || "";
      const langMap: Record<string, string> = {
        ts: "TypeScript", tsx: "TypeScript", js: "JavaScript", jsx: "JavaScript",
        py: "Python", rs: "Rust", go: "Go", java: "Java", rb: "Ruby",
      };

      const { data, error } = await supabase.functions.invoke("generate-tests", {
        body: { code: code.slice(0, 10000), language: langMap[ext] || ext, file_path: selectedFile },
      });

      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      if (data?.error) { toast({ title: "Error", description: data.error, variant: "destructive" }); return; }

      setResult(data as TestResult);
      const totalTests = data.test_suites.reduce((a: number, s: any) => a + s.tests.length, 0);
      toast({ title: "Tests Generated", description: `${totalTests} tests across ${data.test_suites.length} suites` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setGenerating(false); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Test Generation</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-generated unit tests for your codebase</p>
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
            onClick={handleGenerate}
            disabled={!selectedFile || generating}
            className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {generating ? "Generating…" : "Generate Tests"}
          </Button>
        </div>
      </div>

      {/* File picker */}
      {selectedRepo && (
        <div className="rounded-lg border border-border bg-card p-4 max-h-[300px] overflow-y-auto">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Folder className="h-4 w-4 text-primary" /> Select a file to generate tests for
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
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-foreground">{result.summary}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {result.test_suites.length} suite(s), {result.test_suites.reduce((a, s) => a + s.tests.length, 0)} total tests
              </p>
            </div>

            {result.test_suites.map((suite, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-lg border border-border bg-card overflow-hidden">
                <div
                  className="p-4 border-b border-border flex items-center justify-between cursor-pointer hover:bg-muted/30"
                  onClick={() => setExpandedSuite(expandedSuite === i ? null : i)}
                >
                  <div className="flex items-center gap-3">
                    <TestTube2 className="h-4 w-4 text-primary" />
                    <div>
                      <span className="text-sm font-semibold text-foreground font-mono">{suite.function_name}</span>
                      <p className="text-xs text-muted-foreground font-mono">{suite.file_path}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{suite.tests.length} tests</Badge>
                </div>

                <div className="divide-y divide-border">
                  {suite.tests.map((test, j) => {
                    const Icon = typeIcon[test.type];
                    return (
                      <div key={j} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                        <Icon className={`h-3.5 w-3.5 shrink-0 ${typeClass[test.type]}`} />
                        <span className="text-foreground flex-1">{test.name}</span>
                        <Badge variant="outline" className="text-[9px]">{typeLabel[test.type]}</Badge>
                      </div>
                    );
                  })}
                </div>

                {expandedSuite === i && (
                  <div className="border-t border-border">
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
                      <span className="text-xs font-semibold text-muted-foreground">Generated Test Code</span>
                      <Button variant="ghost" size="sm" onClick={() => copyCode(suite.test_code)} className="gap-1 h-7 text-xs">
                        <Copy className="h-3 w-3" /> Copy
                      </Button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-foreground whitespace-pre-wrap overflow-x-auto bg-muted/20 max-h-[400px] overflow-y-auto">
                      {suite.test_code}
                    </pre>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
