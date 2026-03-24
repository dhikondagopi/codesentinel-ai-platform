import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface UserSettings {
  github_token: string | null;
  github_username: string | null;
  auto_scan_on_push: boolean;
  security_scanning: boolean;
  auto_generate_tests: boolean;
  critical_alerts: boolean;
  alert_email: string | null;
}

const defaults: UserSettings = {
  github_token: null,
  github_username: null,
  auto_scan_on_push: true,
  security_scanning: true,
  auto_generate_tests: false,
  critical_alerts: true,
  alert_email: null,
};

export function useSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_settings" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setSettings({
          github_token: (data as any).github_token,
          github_username: (data as any).github_username,
          auto_scan_on_push: (data as any).auto_scan_on_push,
          security_scanning: (data as any).security_scanning,
          auto_generate_tests: (data as any).auto_generate_tests,
          critical_alerts: (data as any).critical_alerts,
          alert_email: (data as any).alert_email,
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const updateSetting = useCallback(
    <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const save = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      ...settings,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("user_settings" as any)
      .upsert(payload as any, { onConflict: "user_id" });

    setSaving(false);
    if (error) {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved" });
    }
  }, [user, settings, toast]);

  return { settings, loading, saving, updateSetting, save };
}
