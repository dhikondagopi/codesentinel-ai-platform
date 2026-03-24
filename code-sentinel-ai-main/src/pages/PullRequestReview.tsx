import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitPullRequest, AlertTriangle, MessageSquare, Clock,
  Loader2, GitBranch, ExternalLink, Sparkles, CheckCircle2,
  XCircle, Info, ThumbsUp, FileCode
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useRepositories } from "@/hooks/useRepositories";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PullRequest {
  id: number;
  number: number;
  title: string;
  user: { login: string; avatar_url: string };
  state: string;
  draft: boolean;
  created_at: string;
  updated_at: string;
  html_url: string;
  additions: number;
  deletions: number;
  comments: number;
  review_comments: number;
  body: string | null;
  head: { ref: string };
  base: { ref: string };
  labels: { name: string; color: string }[];
  requested_reviewers: { login: string }[];
}

interface ReviewComment {
  file?: string;
  line?: number;
  severity: "critical" | "warning" | "suggestion" | "praise";
  title: string;
  comment: string;
}

interface AIReview {
  summary: string;
  verdict: "approve" | "request_changes" | "comment";
  score: number;
  comments: ReviewComment[];
}

const prStatusConfig: Record<string, { label: string; class: string }> = {
  open: { label: "Open", class: "bg-success/10 text-success border-success/20" },
  closed: { label: "Closed", class: "bg-destructive/10 text-destructive border-destructive/20" },
  draft: { label: "Draft", class: "bg-muted text-muted-foreground border-border" },
};

const verdictConfig = {
  approve: { icon: CheckCircle2, label: "Approve", class: "text-success" },
  request_changes: { icon: XCircle, label: "Changes Requested", class: "text-destructive" },
  comment: { icon: MessageSquare, label: "Comment", class: "text-warning" },
};

const severityConfig = {
  critical: { icon: AlertTriangle, class: "text-destructive border-destructive/30 bg-destructive/10", label: "Critical" },
  warning: { icon: AlertTriangle, class: "text-warning border-warning/30 bg-warning/10", label: "Warning" },
  suggestion: { icon: Info, class: "text-info border-info/30 bg-info/10", label: "Suggestion" },
  praise: { icon: ThumbsUp, class: "text-success border-success/30 bg-success/10", label: "Good" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function PullRequestReview() {
  const { repos, loading: reposLoading } = useRepositories();
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Record<number, AIReview>>({});
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [expandedPR, setExpandedPR] = useState<number | null>(null);
  const { toast } = useToast();

  const selectedRepo = repos.find((r) => r.id === selectedRepoId);

  useEffect(() => {
    if (!selectedRepo) { setPrs([]); return; }
    const fetchPRs = async () => {
      setLoading(true);
      setError(null);
      setReviews({});
      setExpandedPR(null);
      try {
        const res = await fetch(
          `https://api.github.com/repos/${selectedRepo.full_name}/pulls?state=open&sort=updated&direction=desc&per_page=20`,
          { headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "CodeSentinel-AI" } }
        );
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
        const data = await res.json();
        const detailed = await Promise.all(
          data.slice(0, 10).map(async (pr: any) => {
            try {
              const d = await fetch(
                `https://api.github.com/repos/${selectedRepo.full_name}/pulls/${pr.number}`,
                { headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "CodeSentinel-AI" } }
              );
              if (d.ok) { const det = await d.json(); return { ...pr, additions: det.additions, deletions: det.deletions, comments: det.comments, review_comments: det.review_comments }; }
            } catch {}
            return { ...pr, additions: 0, deletions: 0, comments: pr.comments || 0, review_comments: 0 };
          })
        );
        setPrs(detailed);
      } catch (err: any) {
        setError(err.message);
        setPrs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPRs();
  }, [selectedRepo]);

  const handleReview = async (pr: PullRequest) => {
    if (!selectedRepo) return;
    setReviewing(pr.number);
    setExpandedPR(pr.number);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("review-pr", {
        body: { repo_full_name: selectedRepo.full_name, pr_number: pr.number },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      if (data?.review) {
        setReviews((prev) => ({ ...prev, [pr.number]: data.review }));
      }
    } catch (err: any) {
      toast({ title: "Review failed", description: err.message, variant: "destructive" });
    } finally {
      setReviewing(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Pull Request Review</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-assisted code review for open pull requests</p>
        </div>
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
      </div>

      {!reposLoading && repos.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <GitBranch className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No repositories imported</p>
          <p className="text-sm text-muted-foreground mt-1">Go to Repositories to import a GitHub repo first.</p>
        </div>
      )}

      {selectedRepo && !loading && prs.length === 0 && !error && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <GitPullRequest className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No open pull requests</p>
          <p className="text-sm text-muted-foreground mt-1">This repository has no open PRs right now.</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-3 text-sm text-muted-foreground">Fetching pull requests...</span>
        </div>
      )}

      {!loading && prs.length > 0 && (
        <div className="space-y-4">
          {prs.map((pr, i) => {
            const statusKey = pr.draft ? "draft" : pr.state;
            const status = prStatusConfig[statusKey] || prStatusConfig.open;
            const review = reviews[pr.number];
            const isReviewing = reviewing === pr.number;
            const isExpanded = expandedPR === pr.number;

            return (
              <motion.div
                key={pr.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-lg border border-border bg-card overflow-hidden"
              >
                {/* PR Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <GitPullRequest className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <a href={pr.html_url} target="_blank" rel="noopener noreferrer"
                            className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                            {pr.title}
                          </a>
                          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          #{pr.number} by <span className="text-foreground">{pr.user.login}</span>
                          <span className="mx-1.5">·</span>
                          <span className="font-mono">{pr.head.ref}</span>
                          <span className="mx-1">→</span>
                          <span className="font-mono">{pr.base.ref}</span>
                        </p>
                        {pr.labels.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {pr.labels.map((label) => (
                              <Badge key={label.name} variant="outline" className="text-[10px]"
                                style={{ borderColor: `#${label.color}40`, color: `#${label.color}`, backgroundColor: `#${label.color}15` }}>
                                {label.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant={review ? "outline" : "default"}
                        onClick={(e) => { e.preventDefault(); handleReview(pr); }}
                        disabled={isReviewing}
                        className={review ? "gap-1.5" : "gap-1.5 bg-gradient-primary text-primary-foreground hover:opacity-90"}
                      >
                        {isReviewing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        {review ? "Re-review" : "AI Review"}
                      </Button>
                      <Badge variant="outline" className={`text-[10px] ${status.class}`}>
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground ml-8">
                    <span className="text-success">+{pr.additions.toLocaleString()}</span>
                    <span className="text-destructive">-{pr.deletions.toLocaleString()}</span>
                    {(pr.comments + pr.review_comments) > 0 && (
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{pr.comments + pr.review_comments}</span>
                    )}
                    {review && (
                      <button
                        onClick={() => setExpandedPR(isExpanded ? null : pr.number)}
                        className="flex items-center gap-1 text-primary hover:underline ml-auto"
                      >
                        <Sparkles className="h-3 w-3" />
                        {isExpanded ? "Hide review" : "Show review"}
                      </button>
                    )}
                    {!review && (
                      <span className="flex items-center gap-1 ml-auto"><Clock className="h-3 w-3" />{timeAgo(pr.updated_at)}</span>
                    )}
                  </div>
                </div>

                {/* AI Review Panel */}
                <AnimatePresence>
                  {isReviewing && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border bg-muted/20 p-6"
                    >
                      <div className="flex items-center justify-center gap-3 py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Analyzing PR diff with AI...</span>
                      </div>
                    </motion.div>
                  )}

                  {review && isExpanded && !isReviewing && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border"
                    >
                      {/* Review Summary */}
                      <div className="bg-muted/20 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold text-foreground">AI Review</span>
                            {(() => {
                              const V = verdictConfig[review.verdict];
                              return (
                                <Badge variant="outline" className={`text-[10px] ${V.class}`}>
                                  <V.icon className="h-3 w-3 mr-1" />
                                  {V.label}
                                </Badge>
                              );
                            })()}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-foreground">{review.score}</span>
                            <span className="text-xs text-muted-foreground">/100</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{review.summary}</p>

                        {/* Stats row */}
                        <div className="flex items-center gap-3 text-xs">
                          {(["critical", "warning", "suggestion", "praise"] as const).map((sev) => {
                            const count = review.comments.filter((c) => c.severity === sev).length;
                            if (count === 0) return null;
                            const cfg = severityConfig[sev];
                            return (
                              <span key={sev} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${cfg.class}`}>
                                <cfg.icon className="h-3 w-3" /> {count} {cfg.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Review Comments */}
                      <div className="divide-y divide-border">
                        {review.comments.map((c, ci) => {
                          const cfg = severityConfig[c.severity];
                          return (
                            <motion.div
                              key={ci}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: ci * 0.03 }}
                              className="p-4 hover:bg-muted/10 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <cfg.icon className={`h-4 w-4 shrink-0 mt-0.5 ${cfg.class.split(" ")[0]}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-foreground">{c.title}</span>
                                    <Badge variant="outline" className={`text-[10px] ${cfg.class}`}>{cfg.label}</Badge>
                                    {c.file && (
                                      <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                                        <FileCode className="h-3 w-3" />
                                        {c.file}{c.line ? `:${c.line}` : ""}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{c.comment}</p>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
