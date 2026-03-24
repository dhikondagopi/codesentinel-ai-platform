import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { repo_full_name, pr_number } = await req.json();

    if (!repo_full_name || !pr_number) {
      return new Response(
        JSON.stringify({ error: "repo_full_name and pr_number are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch PR diff from GitHub
    const diffRes = await fetch(
      `https://api.github.com/repos/${repo_full_name}/pulls/${pr_number}`,
      {
        headers: {
          Accept: "application/vnd.github.v3.diff",
          "User-Agent": "CodeSentinel-AI",
        },
      }
    );

    if (!diffRes.ok) {
      throw new Error(`Failed to fetch PR diff: ${diffRes.status}`);
    }

    let diff = await diffRes.text();

    // Also fetch PR metadata for context
    const prRes = await fetch(
      `https://api.github.com/repos/${repo_full_name}/pulls/${pr_number}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "CodeSentinel-AI",
        },
      }
    );
    const prData = prRes.ok ? await prRes.json() : {};

    // Truncate diff if too large
    if (diff.length > 15000) {
      diff = diff.slice(0, 15000) + "\n\n... [diff truncated for analysis]";
    }

    const systemPrompt = `You are an expert code reviewer. Analyze the given pull request diff and provide a structured review.

For each finding, provide:
- file: the file path affected
- line: approximate line number (or null)
- severity: "critical" | "warning" | "suggestion" | "praise"
- title: short summary (max 10 words)
- comment: detailed explanation and recommendation

Also provide an overall summary of the PR quality.

Focus on:
1. Bugs and logic errors (critical)
2. Security vulnerabilities (critical)
3. Performance issues (warning)
4. Code style and best practices (suggestion)
5. Good patterns worth highlighting (praise)

Be concise but specific. Reference actual code from the diff.`;

    const userPrompt = `Review this pull request:

**Title:** ${prData.title || "Unknown"}
**Description:** ${(prData.body || "No description").slice(0, 500)}
**Branch:** ${prData.head?.ref || "unknown"} → ${prData.base?.ref || "unknown"}

**Diff:**
\`\`\`diff
${diff}
\`\`\``;

    // Call Lovable AI with tool calling for structured output
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_review",
              description: "Submit the structured code review for a pull request",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "Overall summary of the PR review (2-4 sentences)",
                  },
                  verdict: {
                    type: "string",
                    enum: ["approve", "request_changes", "comment"],
                    description: "Overall verdict for the PR",
                  },
                  score: {
                    type: "number",
                    description: "Quality score from 0-100",
                  },
                  comments: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        file: { type: "string" },
                        line: { type: "number" },
                        severity: {
                          type: "string",
                          enum: ["critical", "warning", "suggestion", "praise"],
                        },
                        title: { type: "string" },
                        comment: { type: "string" },
                      },
                      required: ["severity", "title", "comment"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["summary", "verdict", "score", "comments"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_review" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);
      throw new Error(`AI gateway error: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured review returned from AI");
    }

    const review = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ review }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("review-pr error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
