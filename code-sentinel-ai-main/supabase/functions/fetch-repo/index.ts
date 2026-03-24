import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function parseGitHubUrl(input: string) {
  const clean = input.trim().replace(".git", "");
  const match = clean.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,   // ⭐ IMPORTANT CHANGE
      {
        global: { headers: { Authorization: authHeader! } },
      }
    );

    // ✅ get logged user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { github_url } = await req.json();

    if (!github_url) {
      return new Response(JSON.stringify({ error: "GitHub URL required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const parsed = parseGitHubUrl(github_url);

    if (!parsed) {
      return new Response(JSON.stringify({ error: "Invalid GitHub URL" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // ✅ fetch repo from github
    const ghRes = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`
    );

    if (!ghRes.ok) {
      if (ghRes.status === 404) {
        return new Response(JSON.stringify({ error: "Repository not found" }), {
          status: 404,
          headers: corsHeaders,
        });
      }

      if (ghRes.status === 403) {
        return new Response(
          JSON.stringify({ error: "GitHub rate limit exceeded" }),
          {
            status: 429,
            headers: corsHeaders,
          }
        );
      }

      return new Response(JSON.stringify({ error: "GitHub fetch failed" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const repo = await ghRes.json();

    // ✅ check duplicate PER USER
    const { data: existing } = await supabase
      .from("repositories")
      .select("id")
      .eq("full_name", repo.full_name)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Repository already imported" }),
        { status: 409, headers: corsHeaders }
      );
    }

    // ✅ insert repo
    const { data: inserted, error: insertError } = await supabase
      .from("repositories")
      .insert({
        user_id: user.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        default_branch: repo.default_branch,
        language: repo.language,
        stars: repo.stargazers_count,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ repository: inserted }), {
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("EDGE ERROR:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});