const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const getModel = () => process.env.OPENROUTER_MODEL || "openrouter/free";

const generateText = async ({ messages, json = false }) => {
  if (!process.env.OPENROUTER_API_KEY) {
    const error = new Error("OPENROUTER_API_KEY is not configured");
    error.status = 500;
    throw error;
  }

  const body = {
    model: getModel(),
    messages,
  };

  if (json) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:5173",
      "X-Title": "MealMate",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.error?.message || "OpenRouter request failed");
    error.status = response.status;
    error.code = data?.error?.code;
    throw error;
  }

  return data?.choices?.[0]?.message?.content || "";
};

module.exports = { generateText, getModel };
