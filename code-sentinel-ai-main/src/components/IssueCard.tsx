import { AlertTriangle, Info, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type IssueSeverity = "critical" | "warning" | "info";

interface IssueCardProps {
  title: string;
  file: string;
  line: number;
  severity: IssueSeverity;
  description: string;
  snippet?: string;
}

const severityConfig: Record<IssueSeverity, { icon: typeof AlertTriangle; class: string; label: string }> = {
  critical: { icon: XCircle, class: "bg-destructive/10 text-destructive border-destructive/20", label: "Critical" },
  warning: { icon: AlertTriangle, class: "bg-warning/10 text-warning border-warning/20", label: "Warning" },
  info: { icon: Info, class: "bg-info/10 text-info border-info/20", label: "Info" },
};

export function IssueCard({ title, file, line, severity, description, snippet }: IssueCardProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div className="rounded-lg border border-border bg-card p-4 hover:border-primary/20 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`rounded-md p-1.5 ${config.class}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-medium text-foreground">{title}</h4>
            <Badge variant="outline" className={`text-[10px] ${config.class}`}>{config.label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono">{file}:{line}</p>
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
          {snippet && (
            <pre className="mt-3 rounded-md bg-muted p-3 text-xs font-mono text-foreground overflow-x-auto">
              {snippet}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
