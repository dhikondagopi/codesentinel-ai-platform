import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Repository {
  id: string;
  name: string;
  full_name: string;
  description: string | null;
  url: string;
  default_branch: string;
  language: string | null;
  stars: number;
  last_scanned_at: string | null;
  created_at: string;
  user_id: string;
}

export function useRepositories() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  // ✅ Fetch repositories (USER BASED)
  const fetchRepos = useCallback(async () => {
    try {
      if (!user) {
        setRepos([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("repositories")
        .select("*")
        .eq("user_id", user.id)   // ⭐ IMPORTANT FIX
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRepos(data || []);
    } catch (err: any) {
      console.error("Repo fetch error:", err);
      toast({
        title: "Failed to load repositories",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]); // ⭐ removed toast dependency

  // ✅ Safe useEffect (NO RATE LIMIT ISSUE)
  useEffect(() => {
    if (user) {
      fetchRepos();
    }
  }, [user]);

  // ✅ Import GitHub Repository
  const importRepo = async (githubUrl: string) => {
    try {
      if (!user) {
        toast({
          title: "Login required",
          description: "Please login first",
          variant: "destructive",
        });
        return null;
      }

      setImporting(true);

      const { data, error } = await supabase.functions.invoke("fetch-repo", {
        body: {
          github_url: githubUrl,
          user_id: user.id,   // ⭐ PASS USER ID TO EDGE FUNCTION
        },
      });

      if (error) throw error;

      toast({
        title: "Repository Imported",
        description: data?.repository?.full_name || "Success",
      });

      await fetchRepos();

      return data?.repository;
    } catch (err: any) {
      console.error("Import repo error:", err);

      toast({
        title: "Import Failed",
        description: err.message,
        variant: "destructive",
      });

      return null;
    } finally {
      setImporting(false);
    }
  };

  // ✅ Delete repository
  const deleteRepo = async (id: string) => {
    try {
      const { error } = await supabase
        .from("repositories")
        .delete()
        .eq("id", id)
        .eq("user_id", user?.id); // ⭐ safety delete

      if (error) throw error;

      setRepos((prev) => prev.filter((r) => r.id !== id));

      toast({
        title: "Repository removed",
      });
    } catch (err: any) {
      console.error("Delete repo error:", err);

      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return {
    repos,
    loading,
    importing,
    importRepo,
    deleteRepo,
    refetch: fetchRepos,
  };
}