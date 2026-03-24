import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalysisIssue {
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  category: string;
  line_start?: number;
  suggestion?: string;
}

interface QualityScore {
  overall_score: number;
  maintainability: number;
  reliability: number;
  security: number;
  performance: number;
}

interface AnalysisResult {
  scan_id: string;
  issues: AnalysisIssue[];
  quality: QualityScore;
  duration_ms: number;
}

export function useCodeAnalysis() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const analyze = async (code: string, repositoryId: string, language?: string) => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-code", {
        body: { code, repository_id: repositoryId, language },
      });

      if (error) {
        // Check for rate limit / payment errors
        const msg = error.message || "Analysis failed";
        toast({ title: "Analysis Error", description: msg, variant: "destructive" });
        return null;
      }

      if (data?.error) {
        toast({ title: "Analysis Error", description: data.error, variant: "destructive" });
        return null;
      }

      setResult(data as AnalysisResult);
      toast({ title: "Analysis Complete", description: `Found ${data.issues.length} issues in ${(data.duration_ms / 1000).toFixed(1)}s` });
      return data as AnalysisResult;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { analyze, loading, result };
}
