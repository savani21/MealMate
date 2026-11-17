// OpenRouter transport and response parsing for meal-plan generation.
async function generateWithOpenRouter(prompt, duration = 1, maxTokensOverride = null) {
  const apiKey = String(process.env.OPENROUTER_API_KEY || "").trim();
  if (!apiKey || apiKey === "your_openrouter_api_key_here") return null;

  // Use OpenRouter's free-model router by default. It selects a currently
  // available free model instead of pinning every request to one overloaded
  // free provider. A paid model can still be selected through .env.
  const configuredModel = String(process.env.OPENROUTER_MODEL || "").trim();
  // Migrate the two previously recommended single-provider free models to
  // OpenRouter's live free-model router. Existing local .env files may still
  // contain these older values and would otherwise keep selecting them.
  const legacyFreeModels = new Set([
    "xingchen-agi/xing4.0-29b-a4b:free",
    "recursive/flint-v1.0:free",
  ]);
  const model =
    !configuredModel || legacyFreeModels.has(configuredModel)
      ? "openrouter/free"
      : configuredModel;
  const timeoutMs = Math.max(
    75000,
    Number(process.env.OPENROUTER_TIMEOUT_MS) || 75000
  );
  const dayCount = Math.max(1, Math.min(7, Number(duration) || 1));
  // Three candidates for breakfast, lunch and dinner produce a sizeable JSON
  // response. A fixed 3,500-token budget truncates even short plans, while
  // multi-day plans need a larger output allowance. Treat the env value as an
  // optional extra budget, not a low ceiling that silently breaks generation.
  const configuredTokenBudget = Number(process.env.OPENROUTER_MAX_TOKENS) || 0;
  const maxTokens = Number.isFinite(Number(maxTokensOverride)) && Number(maxTokensOverride) > 0
    ? Math.min(32000, Math.max(1000, Number(maxTokensOverride)))
    : Math.min(
        32000,
        Math.max(12000, dayCount * 9000, configuredTokenBudget)
      );

  const startedAt = Date.now();
  let response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "http://localhost:5173",
        "X-OpenRouter-Title": "MealMate AI",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are MealMate, a practical Indian home-cooking meal planner. Follow the user's ingredient and diet restrictions exactly. Return valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: maxTokens,
        stream: false,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const elapsed = Math.round((Date.now() - startedAt) / 1000);
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      throw new Error(
        `OpenRouter timed out after ${elapsed}s (limit ${timeoutMs / 1000}s, model ${model}). Check OpenRouter model capacity, free-tier limits, and network access.`
      );
    }
    throw new Error(`OpenRouter connection failed after ${elapsed}s: ${error.message}`);
  }

  const responseText = await response.text();
  let data;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(`OpenRouter returned non-JSON data (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    const detail = data?.error?.message || data?.message || "Unknown API error";
    const code = data?.error?.code ? ` [${data.error.code}]` : "";
    throw new Error(`OpenRouter HTTP ${response.status}${code}: ${detail}`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    const finishReason = data?.choices?.[0]?.finish_reason;
    throw new Error(
      finishReason === "length"
        ? `OpenRouter response was truncated at ${maxTokens} tokens. Reduce plan duration or increase OPENROUTER_MAX_TOKENS.`
        : "OpenRouter returned an empty AI response."
    );
  }

  try {
    return typeof content === "string" ? JSON.parse(content) : content;
  } catch {
    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      try {
        return JSON.parse(content.slice(jsonStart, jsonEnd + 1));
      } catch {
        // Fall through to a clear response-format error.
      }
    }
    throw new Error("OpenRouter returned invalid meal-plan JSON. Please retry.");
  }
}

module.exports = { generateWithOpenRouter };
