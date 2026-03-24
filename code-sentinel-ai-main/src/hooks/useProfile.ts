import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  username: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>({ display_name: null, avatar_url: null, username: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, username")
        .eq("id", user.id)
        .maybeSingle();
      if (data) setProfile(data);
      setLoading(false);
    })();
  }, [user]);

  const updateProfile = useCallback(<K extends keyof Profile>(key: K, value: Profile[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      // Bust cache by appending timestamp
      const urlWithBust = `${publicUrl}?t=${Date.now()}`;

      setProfile((prev) => ({ ...prev, avatar_url: urlWithBust }));
      toast({ title: "Avatar uploaded" });
      return urlWithBust;
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [user, toast]);

  const saveProfile = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        username: profile.username,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Error saving profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved" });
    }
  }, [user, profile, toast]);

  return { profile, loading, saving, uploading, updateProfile, uploadAvatar, saveProfile };
}
