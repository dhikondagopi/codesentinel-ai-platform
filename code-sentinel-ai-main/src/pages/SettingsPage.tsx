import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera, User } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const { settings, loading: settingsLoading, saving: settingsSaving, updateSetting, save } = useSettings();
  const { profile, loading: profileLoading, saving: profileSaving, uploading, updateProfile, uploadAvatar, saveProfile } = useProfile();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loading = settingsLoading || profileLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profile.display_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAvatar(file);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your CodeSentinel AI preferences</p>
      </div>

      {/* Profile */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Profile</h2>
        <div className="rounded-lg border border-border bg-card p-5 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url ?? undefined} alt={displayName} />
                <AvatarFallback className="bg-primary/15 text-primary text-lg font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading
                  ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                  : <Camera className="h-4 w-4 text-white" />
                }
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs text-primary hover:underline mt-1 disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Change photo"}
              </button>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label className="text-sm">Display Name</Label>
            <Input
              placeholder="Your name"
              value={profile.display_name ?? ""}
              onChange={(e) => updateProfile("display_name", e.target.value || null)}
              className="bg-muted border-border"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label className="text-sm">Username</Label>
            <Input
              placeholder="your-username"
              value={profile.username ?? ""}
              onChange={(e) => updateProfile("username", e.target.value || null)}
              className="bg-muted border-border"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={saveProfile}
              disabled={profileSaving}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {profileSaving && <Loader2 className="h-3 w-3 animate-spin" />}
              {profileSaving ? "Saving…" : "Save Profile"}
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* GitHub */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">GitHub Integration</h2>
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">GitHub Username</Label>
            <Input
              placeholder="your-github-username"
              value={settings.github_username ?? ""}
              onChange={(e) => updateSetting("github_username", e.target.value || null)}
              className="bg-muted border-border"
            />
            <p className="text-[10px] text-muted-foreground">Used to validate repository imports</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Personal Access Token (optional)</Label>
            <Input
              type="password"
              placeholder="ghp_..."
              value={settings.github_token ?? ""}
              onChange={(e) => updateSetting("github_token", e.target.value || null)}
              className="bg-muted border-border"
            />
            <p className="text-[10px] text-muted-foreground">Required for private repos. Stored securely.</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Analysis */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Analysis Preferences</h2>
        <div className="rounded-lg border border-border bg-card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Auto-scan on push</Label>
              <p className="text-xs text-muted-foreground">Automatically analyze code when pushed to main branch</p>
            </div>
            <Switch
              checked={settings.auto_scan_on_push}
              onCheckedChange={(v) => updateSetting("auto_scan_on_push", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Security scanning</Label>
              <p className="text-xs text-muted-foreground">Include security vulnerability detection in scans</p>
            </div>
            <Switch
              checked={settings.security_scanning}
              onCheckedChange={(v) => updateSetting("security_scanning", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Auto-generate tests</Label>
              <p className="text-xs text-muted-foreground">Generate unit tests for new functions automatically</p>
            </div>
            <Switch
              checked={settings.auto_generate_tests}
              onCheckedChange={(v) => updateSetting("auto_generate_tests", v)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Notifications */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Email for alerts</Label>
            <Input
              placeholder="developer@example.com"
              value={settings.alert_email ?? ""}
              onChange={(e) => updateSetting("alert_email", e.target.value || null)}
              className="bg-muted border-border"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Critical issue alerts</Label>
              <p className="text-xs text-muted-foreground">Get notified when critical vulnerabilities are found</p>
            </div>
            <Switch
              checked={settings.critical_alerts}
              onCheckedChange={(v) => updateSetting("critical_alerts", v)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={save}
          disabled={settingsSaving}
          className="bg-gradient-primary text-primary-foreground hover:opacity-90 gap-2"
        >
          {settingsSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {settingsSaving ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
