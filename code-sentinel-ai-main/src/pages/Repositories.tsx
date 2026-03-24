import { useState } from "react";
import { RepoCard } from "@/components/RepoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRepositories } from "@/hooks/useRepositories";
import { Plus, Search, Loader2, Github, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Repositories() {
  const { repos = [], loading, importing, importRepo, deleteRepo } = useRepositories();

  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");

  const filtered = repos.filter(
    (r: any) =>
      r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleImport = async () => {
    if (!githubUrl.trim()) return;

    const ok = await importRepo(githubUrl.trim());

    if (ok) {
      setGithubUrl("");
      setShowImport(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Repositories</h1>
          <p className="text-sm text-muted-foreground">
            {repos.length} connected repositories
          </p>
        </div>

        <Button onClick={() => setShowImport(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Import Repo
        </Button>
      </div>

      {/* Search */}
      {repos.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
          <Input
            className="pl-10"
            placeholder="Search repo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border rounded-lg p-10 text-center">
          <Github className="mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No repositories found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((repo: any) => (
            <RepoCard key={repo.id} repo={repo} onDelete={deleteRepo} />
          ))}
        </div>
      )}

      {/* Import Dialog FIXED */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import GitHub Repository</DialogTitle>
            <DialogDescription>
              Enter public GitHub repository URL
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
              <Input
                className="pl-10"
                placeholder="https://github.com/user/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
              {githubUrl && (
                <button
                  onClick={() => setGithubUrl("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Button
              onClick={handleImport}
              disabled={importing}
              className="w-full"
            >
              {importing ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Import Repository
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}