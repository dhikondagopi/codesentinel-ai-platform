import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase configuration missing");

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { code, language, file_path, repository_id } = await req.json();
    if (!code) {
      return new Response(JSON.stringify({ error: "Missing code" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const startTime = Date.now();

    // Create scan record if repo provided
    let scan: any = null;
    if (repository_id && repository_id !== "00000000-0000-0000-0000-000000000000") {
      const { data, error: scanError } = await supabase
        .from("scan_results")
        .insert({ repository_id, user_id: user.id, scan_type: "security_scan", status: "running" })
        .select().single();
      if (!scanError) scan = data;
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert security auditor. Analyze the provided code for security vulnerabilities including: SQL injection, XSS, CSRF, insecure authentication, exposed secrets, path traversal, insecure deserialization, missing input validation, and other OWASP Top 10 issues. You MUST respond using the security_scan tool.`,
          },
          {
            role: "user",
            content: `Perform a security audit on this ${language || "unknown"} code from ${file_path || "unknown file"}:\n\n\`\`\`\n${code.slice(0, 8000)}\n\`\`\``,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "security_scan",
              description: "Return security scan results with vulnerabilities found.",
              parameters: {
                type: "object",
                properties: {
                  vulnerabilities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                        category: { type: "string", enum: ["injection", "auth", "xss", "csrf", "exposure", "config", "crypto", "other"] },
                        line_start: { type: "number" },
                        remediation: { type: "string", description: "Suggested fix" },
                        cwe_id: { type: "string", description: "CWE identifier if applicable" },
                      },
                      required: ["title", "description", "severity", "category", "remediation"],
                      additionalProperties: false,
                    },
                  },
                  risk_score: { type: "number", description: "Overall risk score 0-100 (100 = most risky)" },
                  summary: { type: "string" },
                },
                required: ["vulnerabilities", "risk_score", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "security_scan" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const text = await aiResponse.text();
      console.error("AI gateway error:", status, text);
      if (scan) await supabase.from("scan_results").update({ status: "failed" }).eq("id", scan.id);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const result = JSON.parse(toolCall.function.arguments);
    const durationMs = Date.now() - startTime;

    // Persist scan results
    if (scan) {
      const critCount = result.vulnerabilities.filter((v: any) => v.severity === "critical" || v.severity === "high").length;
      const warnCount = result.vulnerabilities.filter((v: any) => v.severity === "medium").length;
      const infoCount = result.vulnerabilities.filter((v: any) => v.severity === "low").length;

      await supabase.from("scan_results").update({
        status: "completed", total_issues: result.vulnerabilities.length,
        critical_count: critCount, warning_count: warnCount, info_count: infoCount,
        duration_ms: durationMs, completed_at: new Date().toISOString(),
      }).eq("id", scan.id);

      if (result.vulnerabilities.length > 0) {
        await supabase.from("detected_issues").insert(
          result.vulnerabilities.map((v: any) => ({
            scan_id: scan.id, repository_id, user_id: user.id,
            title: v.title, description: v.description,
            severity: v.severity === "high" ? "critical" : v.severity === "medium" ? "warning" : v.severity === "low" ? "info" : v.severity,
            category: "security", line_start: v.line_start || null, suggestion: v.remediation,
          }))
        );
      }
    }

    return new Response(JSON.stringify({ ...result, duration_ms: durationMs, scan_id: scan?.id || null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("security-scan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
