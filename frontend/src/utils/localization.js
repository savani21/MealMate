// Read a translated display field without changing the canonical value sent to APIs.
export function localizedValue(record, path, fallback) {
  const original = fallback ?? path.split(".").reduce((value, key) => value?.[key], record);
  const translated = record?.localized?.[path];
  return typeof translated === "string" && translated.trim() ? translated : original;
}
