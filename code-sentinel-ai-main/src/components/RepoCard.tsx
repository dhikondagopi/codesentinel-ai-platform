import { useState } from "react";
import { GitFork, Star, Clock, Circle, Trash2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Repository } from "@/hooks/useRepositories";
import { formatDistanceToNow } from "date-fns";

interface RepoCardProps {
  repo: Repository;
  onDelete?: (id: string) => void;
}

const languageColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  Kotlin: "#A97BFF",
  Ruby: "#701516",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Swift: "#F05138",
  PHP: "#4F5D95",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
};

export function RepoCard({ repo, onDelete }: RepoCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const langColor = repo.language ? languageColors[repo.language] || "#888" : "#888";
  const timeAgo = formatDistanceToNow(new Date(repo.created_at), { addSuffix: true });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-border bg-card p-5 hover:border-primary/30 transition-all group"
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {repo.full_name}
              </h3>
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {repo.description || "No description"}
            </p>
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 ml-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setShowConfirm(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          {repo.language && (
            <span className="flex items-center gap-1">
              <Circle className="h-2.5 w-2.5 fill-current" style={{ color: langColor }} />
              {repo.language}
            </span>
          )}
          <span className="flex items-center gap-1"><Star className="h-3 w-3" />{repo.stars}</span>
          <span className="flex items-center gap-1"><GitFork className="h-3 w-3" />{repo.default_branch}</span>
          <span className="flex items-center gap-1 ml-auto"><Clock className="h-3 w-3" />Added {timeAgo}</span>
        </div>
      </motion.div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete repository?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong className="text-foreground">{repo.full_name}</strong> and all its scan history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete?.(repo.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
