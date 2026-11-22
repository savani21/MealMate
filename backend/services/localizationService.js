const crypto = require("crypto");
const Localization = require("../models/Localization");

const SUPPORTED_LANGUAGES = new Set(["en", "gu", "hi"]);
const LANGUAGE_NAMES = { en: "English", gu: "Gujarati", hi: "Hindi" };

// Deliberately exclude ingredient names, units, quantities, enum keys and IDs.
// These fields participate in matching, nutrition, diet validation and checkout.
const DISPLAY_FIELDS = new Set(["name", "title", "description", "slogan", "instructions", "mealName", "breakfast", "lunch", "dinner"]);
const EXCLUDED_PATH = /(^|\.)(ingredients|ingredientBreakdown|missingIngredients|nutrition|unit|quantity|diet|goal|status|type|category|_id|id)(\.|$)/i;

function hashSource(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function collectDisplayFields(value, path = "", output = {}) {
  if (value == null) return output;
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (item && typeof item === "object") collectDisplayFields(item, path ? `${path}.${index}` : String(index), output);
    });
    return output;
  }
  if (typeof value !== "object") return output;

  for (const [key, child] of Object.entries(value)) {
    const nextPath = path ? `${path}.${key}` : key;
    if (EXCLUDED_PATH.test(nextPath)) continue;
    if (DISPLAY_FIELDS.has(key) && typeof child === "string" && child.trim()) {
      output[nextPath] = child;
    } else if (Array.isArray(child) || (child && typeof child === "object")) {
      collectDisplayFields(child, nextPath, output);
    }
  }
  return output;
}

async function requestTranslations(fields, language) {
  const apiKey = String(process.env.OPENROUTER_API_KEY || "").trim();
  if (!apiKey || apiKey === "your_openrouter_api_key_here") {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL || "http://localhost:5173",
      "X-Title": "MealMate Localization",
    },
    signal: AbortSignal.timeout(Number(process.env.OPENROUTER_TRANSLATION_TIMEOUT_MS) || 30000),
    body: JSON.stringify({
      model: process.env.OPENROUTER_TRANSLATION_MODEL || process.env.OPENROUTER_MODEL || "openrouter/free",
      messages: [
        { role: "system", content: `Translate user-facing text into ${LANGUAGE_NAMES[language]}. Preserve meaning, brand names, numbers, placeholders and formatting. Return only a valid JSON object with exactly the same keys. Do not translate ingredient data, measurements or units.` },
        { role: "user", content: JSON.stringify(fields) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || `Translation provider returned HTTP ${response.status}`);
  const content = body?.choices?.[0]?.message?.content;
  const translated = typeof content === "string" ? JSON.parse(content) : content;
  if (!translated || typeof translated !== "object" || Array.isArray(translated)) throw new Error("Translation provider returned an invalid response");
  const result = {};
  for (const [key, source] of Object.entries(fields)) {
    result[key] = typeof translated[key] === "string" && translated[key].trim() ? translated[key] : source;
  }
  return result;
}

async function localizeRecord(record, entityType, language) {
  if (!record || !SUPPORTED_LANGUAGES.has(language)) return record;
  if (language === "en") return record;
  const plain = typeof record.toObject === "function" ? record.toObject() : record;
  const sourceFields = collectDisplayFields(plain);
  if (!Object.keys(sourceFields).length) return { ...plain, localized: {} };
  const entityId = plain._id || plain.id;
  if (!entityId) return { ...plain, localized: {} };
  const sourceHash = hashSource(sourceFields);
  let cached = await Localization.findOne({ entityType, entityId, language }).lean();
  if (!cached || cached.sourceHash !== sourceHash) {
    try {
      const fields = await requestTranslations(sourceFields, language);
      cached = await Localization.findOneAndUpdate(
        { entityType, entityId, language },
        { $set: { sourceHash, fields, provider: "openrouter" } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).lean();
    } catch (error) {
      // Never block core MealMate workflows if the translation provider is unavailable.
      console.warn(`Localization fallback (${entityType}/${entityId}/${language}):`, error.message);
      return { ...plain, localized: {} };
    }
  }
  return { ...plain, localized: cached?.fields || {} };
}

async function localizeRecords(records, entityType, language) {
  if (!Array.isArray(records)) return records;
  // Bound concurrency to avoid overwhelming the translation provider on large lists.
  const output = [];
  for (let index = 0; index < records.length; index += 3) {
    const batch = records.slice(index, index + 3);
    output.push(...await Promise.all(batch.map((record) => localizeRecord(record, entityType, language))));
  }
  return output;
}

module.exports = { localizeRecord, localizeRecords, SUPPORTED_LANGUAGES };
